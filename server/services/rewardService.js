const crypto = require('crypto');
const User = require('../models/User');
const Settings = require('../models/Settings');
const RewardLedger = require('../models/RewardLedger');
const WithdrawRequest = require('../models/WithdrawRequest');
const EnergyRentalOrder = require('../models/EnergyRentalOrder');
const { getPrimaryTelegramBot } = require('../utils/telegramBots');

const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TRON_ADDRESS_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

const round6 = (n) => Math.round(Number(n) * 1e6) / 1e6;

const shanghaiDay = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);

const makeInviteCode = () => {
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    out += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return out;
};

const normalizeInviteCode = (raw) => String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

const isTronAddress = (address) => TRON_ADDRESS_RE.test(String(address || '').trim());

const botUsernameFromSettings = (settings) =>
  (getPrimaryTelegramBot(settings) || {}).username || '';

const parseInvitePayload = (payload) => {
  const raw = String(payload || '').trim();
  if (!raw) return '';
  if (/^inv_/i.test(raw)) return normalizeInviteCode(raw.slice(4));
  return '';
};

const loadSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings();
    await settings.save();
  }
  return settings;
};

const publicRewardConfig = (settings) => ({
  rewardEnabled: settings.rewardEnabled !== false,
  checkinEnabled: settings.checkinEnabled !== false,
  checkinTrx: Number(settings.checkinTrx ?? 1),
  inviteSignupTrx: Number(settings.inviteSignupTrx ?? 5),
  consumeRewardUsdtPercent: Number(settings.consumeRewardUsdtPercent ?? 5),
  withdrawMinUsdt: Number(settings.withdrawMinUsdt ?? 10),
  withdrawFeeUsdt: Number(settings.withdrawFeeUsdt ?? 0),
  energyPriceTrx: Number(settings.energyPriceTrx ?? 1),
  energyPriceEnergy: Number(settings.energyPriceEnergy ?? 65000),
  energyMinAmount: Number(settings.energyMinAmount ?? 10),
  trxDepositEnabled: settings.trxDepositEnabled !== false,
  trxDepositAddress: String(settings.trxDepositAddress || '').trim(),
  trxDepositMin: Number(settings.trxDepositMin ?? 1),
  energyDuration: `${Number(settings.catfeePeriod) === 3 ? 3 : 1}h`
});

const spendToUsdt = (amount, payType, settings) => {
  const qty = Number(amount) || 0;
  if (qty <= 0) return 0;
  if (String(payType).toUpperCase() === 'USDT') return round6(qty);
  const usdtCny = Number(settings.exchangeRateUSDT) || 7.35;
  const trxCny = Number(settings.exchangeRateTRX) || 1.08;
  if (!usdtCny) return 0;
  return round6(qty * trxCny / usdtCny);
};

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const ensureInviteCode = async (user) => {
  if (!user) return '';
  if (user.inviteCode) return user.inviteCode;
  for (let i = 0; i < 8; i += 1) {
    const code = makeInviteCode();
    try {
      const updated = await User.findOneAndUpdate(
        {
          _id: user._id,
          $or: [{ inviteCode: { $exists: false } }, { inviteCode: null }, { inviteCode: '' }]
        },
        { $set: { inviteCode: code } },
        { new: true }
      );
      if (updated?.inviteCode) {
        user.inviteCode = updated.inviteCode;
        return updated.inviteCode;
      }
      const fresh = await User.findById(user._id).select('inviteCode');
      if (fresh?.inviteCode) {
        user.inviteCode = fresh.inviteCode;
        return fresh.inviteCode;
      }
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
  throw httpError(500, '邀请码生成失败');
};

const creditOnce = async ({
  userId,
  asset,
  amount,
  type,
  idempotencyKey,
  relatedUserId,
  relatedOrderId,
  relatedOrderType,
  dayKey,
  note
}) => {
  const qty = round6(amount);
  if (qty <= 0) return { skipped: true };
  try {
    await RewardLedger.create({
      userId,
      asset,
      amount: qty,
      type,
      idempotencyKey,
      relatedUserId: relatedUserId || undefined,
      relatedOrderId: relatedOrderId || '',
      relatedOrderType: relatedOrderType || '',
      dayKey: dayKey || '',
      note: note || '',
      balanceAfter: 0
    });
  } catch (err) {
    if (err.code === 11000) return { skipped: true, duplicate: true };
    throw err;
  }

  const field = asset === 'TRX' ? 'trxBalance' : 'usdtReward';
  const updated = await User.findByIdAndUpdate(userId, { $inc: { [field]: qty } }, { new: true });
  if (!updated) {
    await RewardLedger.deleteOne({ idempotencyKey }).catch(() => {});
    throw httpError(404, '用户不存在');
  }
  await RewardLedger.updateOne({ idempotencyKey }, { $set: { balanceAfter: round6(updated[field]) } });
  return { ok: true, balance: round6(updated[field]) };
};

const debitOnce = async ({
  userId,
  asset,
  amount,
  type,
  idempotencyKey,
  relatedOrderId,
  relatedOrderType,
  note
}) => {
  const qty = round6(Math.abs(amount));
  if (qty <= 0) throw httpError(400, '金额无效');
  const field = asset === 'TRX' ? 'trxBalance' : 'usdtReward';
  const updated = await User.findOneAndUpdate(
    { _id: userId, [field]: { $gte: qty } },
    { $inc: { [field]: -qty } },
    { new: true }
  );
  if (!updated) throw httpError(400, asset === 'TRX' ? 'TRX 余额不足' : 'USDT 奖励余额不足');

  try {
    await RewardLedger.create({
      userId,
      asset,
      amount: -qty,
      type,
      idempotencyKey,
      relatedOrderId: relatedOrderId || '',
      relatedOrderType: relatedOrderType || '',
      note: note || '',
      balanceAfter: round6(updated[field])
    });
  } catch (err) {
    await User.updateOne({ _id: userId }, { $inc: { [field]: qty } }).catch(() => {});
    if (err.code === 11000) return { skipped: true, duplicate: true };
    throw err;
  }
  return { ok: true, balance: round6(updated[field]) };
};

const creditInviteSignup = async (inviterId, inviteeId) => {
  const settings = await loadSettings();
  const cfg = publicRewardConfig(settings);
  if (!cfg.rewardEnabled || cfg.inviteSignupTrx <= 0) return { skipped: true };
  return creditOnce({
    userId: inviterId,
    asset: 'TRX',
    amount: cfg.inviteSignupTrx,
    type: 'invite_signup',
    idempotencyKey: `invite_signup:${inviteeId}`,
    relatedUserId: inviteeId,
    note: '邀请注册奖励'
  });
};

const bindInviter = async (invitee, rawCode) => {
  const code = normalizeInviteCode(rawCode);
  if (!invitee?._id || !code) return { bound: false };
  if (invitee.invitedBy) return { bound: false };

  const inviter = await User.findOne({ inviteCode: code });
  if (!inviter || String(inviter._id) === String(invitee._id)) return { bound: false };

  const updated = await User.findOneAndUpdate(
    {
      _id: invitee._id,
      $or: [{ invitedBy: { $exists: false } }, { invitedBy: null }]
    },
    { $set: { invitedBy: inviter._id } },
    { new: true }
  );
  if (!updated?.invitedBy) return { bound: false };
  invitee.invitedBy = updated.invitedBy;
  await creditInviteSignup(inviter._id, invitee._id);
  return { bound: true, inviterId: inviter._id };
};

const afterUserCreated = async (user, inviteCode) => {
  if (!user?._id) return user;
  await ensureInviteCode(user);
  await bindInviter(user, inviteCode);
  return user;
};

const checkin = async (userId) => {
  const settings = await loadSettings();
  const cfg = publicRewardConfig(settings);
  if (!cfg.rewardEnabled || !cfg.checkinEnabled) throw httpError(400, '签到未开启');
  if (cfg.checkinTrx <= 0) throw httpError(400, '签到奖励未配置');

  const dayKey = shanghaiDay();
  const result = await creditOnce({
    userId,
    asset: 'TRX',
    amount: cfg.checkinTrx,
    type: 'checkin',
    idempotencyKey: `checkin:${userId}:${dayKey}`,
    dayKey,
    note: `每日签到 ${dayKey}`
  });
  if (result.duplicate) throw httpError(400, '今日已签到');
  return { trx: cfg.checkinTrx, dayKey, trxBalance: result.balance };
};

const onConsumption = async ({ consumerId, telegramId, orderType, orderId, spendUsdt }) => {
  try {
    const settings = await loadSettings();
    const cfg = publicRewardConfig(settings);
    if (!cfg.rewardEnabled || cfg.consumeRewardUsdtPercent <= 0) return { skipped: true };

    let consumer = null;
    if (consumerId) consumer = await User.findById(consumerId).select('invitedBy');
    if (!consumer && telegramId) {
      consumer = await User.findOne({ telegramId: String(telegramId) }).select('invitedBy');
    }
    if (!consumer?.invitedBy) return { skipped: true };

    const reward = round6((Number(spendUsdt) || 0) * cfg.consumeRewardUsdtPercent / 100);
    if (reward <= 0) return { skipped: true };

    return creditOnce({
      userId: consumer.invitedBy,
      asset: 'USDT',
      amount: reward,
      type: 'consume_reward',
      idempotencyKey: `consume:${orderType}:${orderId}`,
      relatedUserId: consumer._id,
      relatedOrderId: String(orderId),
      relatedOrderType: orderType,
      note: `下级消费返佣 ${cfg.consumeRewardUsdtPercent}%`
    });
  } catch (err) {
    console.error('消费返佣失败:', err.message);
    return { skipped: true, error: err.message };
  }
};

const onPaymentPaid = async (payment, settings) => {
  if (!payment) return { skipped: true };
  const spendUsdt = spendToUsdt(payment.amount, payment.payType, settings || await loadSettings());
  return onConsumption({
    consumerId: payment.userId,
    telegramId: payment.telegramId,
    orderType: 'payment',
    orderId: payment._id,
    spendUsdt
  });
};

const prepareCatfee = (settings) => {
  if (!settings.catfeeApiKey) throw httpError(400, '能量服务未配置，请联系管理员');
  if (settings.catfeeApiUrl) catfeeService.setApiUrl(settings.catfeeApiUrl);
  catfeeService.setApiKey(settings.catfeeApiKey);
};

const rentEnergyWithBalance = async ({ userId, receiveAddress, trxAmount }) => {
  const settings = await loadSettings();
  const cfg = publicRewardConfig(settings);
  if (!cfg.rewardEnabled) throw httpError(400, '奖励系统未开启');

  const address = String(receiveAddress || '').trim();
  if (!isTronAddress(address)) throw httpError(400, '收款地址无效');

  const paid = round6(trxAmount);
  if (!(paid >= cfg.energyMinAmount)) throw httpError(400, `最小金额 ${cfg.energyMinAmount} TRX`);

  const energyAmount = Math.floor(paid / cfg.energyPriceTrx * cfg.energyPriceEnergy);
  if (energyAmount <= 0) throw httpError(400, '支付金额过低，无法租赁能量');

  prepareCatfee(settings);
  const duration = cfg.energyDuration;

  const orderNo = `ER${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const order = await EnergyRentalOrder.create({
    userId,
    orderNo,
    receiveAddress: address,
    trxPaid: paid,
    energyAmount,
    duration,
    payMethod: 'balance',
    status: 'pending'
  });

  await debitOnce({
    userId,
    asset: 'TRX',
    amount: paid,
    type: 'energy_spend',
    idempotencyKey: `energy_spend:${order._id}`,
    relatedOrderId: String(order._id),
    relatedOrderType: 'energy',
    note: `余额租赁能量 ${energyAmount}`
  });

  try {
    const bought = await catfeeService.buyEnergy(address, energyAmount, duration);
    order.status = 'fulfilled';
    order.catfeeOrderNo = bought.orderNo || '';
    await order.save();
    const spendUsdt = spendToUsdt(paid, 'TRX', settings);
    onConsumption({
      consumerId: userId,
      orderType: 'energy',
      orderId: order._id,
      spendUsdt
    }).catch(() => {});
    return order;
  } catch (err) {
    try {
      await creditOnce({
        userId,
        asset: 'TRX',
        amount: paid,
        type: 'energy_refund',
        idempotencyKey: `energy_refund:${order._id}`,
        relatedOrderId: String(order._id),
        relatedOrderType: 'energy',
        note: '能量租赁失败退款'
      });
      order.status = 'refunded';
      order.error = err.message || '能量购买失败';
    } catch (refundErr) {
      order.status = 'failed';
      order.error = `购买失败且退款失败: ${refundErr.message}`;
      await order.save();
      throw httpError(400, order.error);
    }
    await order.save();
    throw httpError(400, order.error);
  }
};

const requestWithdraw = async ({ userId, amount, address }) => {
  const settings = await loadSettings();
  const cfg = publicRewardConfig(settings);
  if (!cfg.rewardEnabled) throw httpError(400, '奖励系统未开启');

  const qty = round6(amount);
  if (!(qty > 0)) throw httpError(400, '提现金额无效');
  if (qty + 1e-9 < cfg.withdrawMinUsdt) throw httpError(400, `最低提现 ${cfg.withdrawMinUsdt} USDT`);

  const fee = round6(Math.max(0, cfg.withdrawFeeUsdt));
  const netAmount = round6(qty - fee);
  if (!(netAmount > 0)) throw httpError(400, '提现金额需大于手续费');

  const to = String(address || '').trim();
  if (!isTronAddress(to)) throw httpError(400, '提现地址无效');

  const withdraw = await WithdrawRequest.create({
    userId,
    amount: qty,
    fee,
    netAmount,
    address: to,
    status: 'pending'
  });

  try {
    await debitOnce({
      userId,
      asset: 'USDT',
      amount: qty,
      type: 'withdraw_hold',
      idempotencyKey: `withdraw_hold:${withdraw._id}`,
      relatedOrderId: String(withdraw._id),
      relatedOrderType: 'withdraw',
      note: 'USDT 提现冻结'
    });
  } catch (err) {
    await WithdrawRequest.deleteOne({ _id: withdraw._id }).catch(() => {});
    throw err;
  }
  return withdraw;
};

const approveWithdraw = async ({ adminId, withdrawId, txHash }) => {
  const withdraw = await WithdrawRequest.findOneAndUpdate(
    { _id: withdrawId, status: 'pending' },
    {
      $set: {
        status: 'paid',
        txHash: String(txHash || '').trim(),
        processedAt: new Date(),
        processedBy: adminId
      }
    },
    { new: true }
  );
  if (!withdraw) throw httpError(400, '提现单不存在或已处理');
  return withdraw;
};

const rejectWithdraw = async ({ adminId, withdrawId, reason }) => {
  const withdraw = await WithdrawRequest.findOneAndUpdate(
    { _id: withdrawId, status: 'pending' },
    {
      $set: {
        status: 'rejected',
        rejectReason: String(reason || '').trim(),
        processedAt: new Date(),
        processedBy: adminId
      }
    },
    { new: true }
  );
  if (!withdraw) throw httpError(400, '提现单不存在或已处理');

  await creditOnce({
    userId: withdraw.userId,
    asset: 'USDT',
    amount: withdraw.amount,
    type: 'withdraw_reject',
    idempotencyKey: `withdraw_reject:${withdraw._id}`,
    relatedOrderId: String(withdraw._id),
    relatedOrderType: 'withdraw',
    note: withdraw.rejectReason || '提现驳回退回'
  });
  return withdraw;
};

const getSummary = async (userId) => {
  const user = await User.findById(userId).select('username inviteCode invitedBy trxBalance usdtReward createdAt');
  if (!user) throw httpError(404, '用户不存在');
  const inviteCode = await ensureInviteCode(user);
  const settings = await loadSettings();
  const cfg = publicRewardConfig(settings);
  const dayKey = shanghaiDay();
  const [checkedIn, inviteeCount] = await Promise.all([
    RewardLedger.exists({ idempotencyKey: `checkin:${userId}:${dayKey}` }),
    User.countDocuments({ invitedBy: userId })
  ]);
  const bot = botUsernameFromSettings(settings);
  return {
    ...cfg,
    inviteCode,
    trxBalance: round6(user.trxBalance || 0),
    usdtReward: round6(user.usdtReward || 0),
    checkedInToday: !!checkedIn,
    inviteeCount,
    telegramInviteUrl: bot ? `https://t.me/${bot}?start=inv_${inviteCode}` : '',
    hasInviter: !!user.invitedBy
  };
};

const inspectNativeTrxTransfer = async (txHash) => {
  const hash = String(txHash || '').trim().match(/[0-9a-fA-F]{64}/)?.[0] || '';
  if (!hash) throw httpError(400, '交易哈希无效');
  const tronService = require('./tronService');
  await tronService.initialize();
  const tronWeb = tronService.tronWeb;
  if (!tronWeb) throw httpError(400, '节点未就绪');

  const tx = await tronWeb.trx.getTransaction(hash);
  if (!tx?.txID) throw httpError(400, '链上未找到该交易');
  const contract = tx.raw_data?.contract?.[0];
  if (contract?.type !== 'TransferContract') throw httpError(400, '只支持 TRX 转账，不支持 USDT/合约');
  const value = contract.parameter?.value || {};
  if (!value.to_address || !value.owner_address) throw httpError(400, '无法解析转账');

  const to = tronWeb.address.fromHex(value.to_address);
  const from = tronWeb.address.fromHex(value.owner_address);
  const amount = round6((Number(value.amount) || 0) / 1e6);
  const txInfo = await tronWeb.trx.getTransactionInfo(hash);
  const confirmed = !!(txInfo && txInfo.blockNumber > 0);
  const ret = tx.ret?.[0]?.contractRet;
  const failed = ret ? ret !== 'SUCCESS' : !!(txInfo?.result && txInfo.result !== 'SUCCESS');
  return { hash: tx.txID, to, from, amount, confirmed, failed };
};

const creditTrxDeposit = async ({ userId, txHash }) => {
  const settings = await loadSettings();
  const cfg = publicRewardConfig(settings);
  if (!cfg.trxDepositEnabled) throw httpError(400, '充值未开启');
  if (!isTronAddress(cfg.trxDepositAddress)) throw httpError(400, '充值地址未配置');
  if (cfg.trxDepositAddress === String(settings.energyRentalAddress || '').trim()) {
    throw httpError(400, '充值地址不能与能量租赁收款地址相同');
  }

  const parsed = await inspectNativeTrxTransfer(txHash);
  if (parsed.failed) throw httpError(400, '该交易失败');
  if (!parsed.confirmed) throw httpError(400, '交易尚未确认，请稍后再试');
  if (parsed.to !== cfg.trxDepositAddress) throw httpError(400, '收款地址不匹配');
  if (!(parsed.amount >= cfg.trxDepositMin)) throw httpError(400, `最低充值 ${cfg.trxDepositMin} TRX`);

  const result = await creditOnce({
    userId,
    asset: 'TRX',
    amount: parsed.amount,
    type: 'trx_deposit',
    idempotencyKey: `trx_deposit:${parsed.hash}`,
    relatedOrderId: parsed.hash,
    relatedOrderType: 'trx_deposit',
    note: `链上充值 from ${parsed.from}`
  });
  if (result.duplicate) throw httpError(400, '该交易已入账');
  return { amount: parsed.amount, txHash: parsed.hash, trxBalance: result.balance };
};

module.exports = {
  round6,
  shanghaiDay,
  parseInvitePayload,
  publicRewardConfig,
  spendToUsdt,
  loadSettings,
  ensureInviteCode,
  afterUserCreated,
  bindInviter,
  checkin,
  onConsumption,
  onPaymentPaid,
  rentEnergyWithBalance,
  creditTrxDeposit,
  requestWithdraw,
  approveWithdraw,
  rejectWithdraw,
  getSummary,
  isTronAddress
};
