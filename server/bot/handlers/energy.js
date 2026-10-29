const Settings = require('../../models/Settings');
const User = require('../../models/User');
const { generateEnergyQRCode } = require('../utils/qrCodeGenerator');
const rewardService = require('../../services/rewardService');

const sessionUserId = (ctx) => ctx.session?.user?._id;

const menuKeyboard = {
  inline_keyboard: [
    [{ text: '⚡ 链上转账租赁', callback_data: 'energy_chain' }],
    [{ text: '💎 余额租赁', callback_data: 'energy_balance' }],
    [{ text: '➕ 充值 TRX', callback_data: 'energy_deposit' }],
    [{ text: '👛 我的余额', callback_data: 'energy_wallet' }],
    [{ text: '🔙 返回主菜单', callback_data: 'back_to_main' }]
  ]
};

const backEnergyKeyboard = {
  inline_keyboard: [
    [{ text: '🔙 能量菜单', callback_data: 'energy_rental' }]
  ]
};

const answerIfCallback = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});
};

const loadEnergySettings = async () => {
  const settings = await Settings.findOne();
  return {
    settings,
    walletAddress: settings?.energyRentalAddress || '',
    priceTrx: settings?.energyPriceTrx || 1,
    priceEnergy: settings?.energyPriceEnergy || 65000,
    minAmount: settings?.energyMinAmount || 10,
    validityHours: settings?.energyValidityHours || 24,
    notice: settings?.energyNotice || '',
    cfg: rewardService.publicRewardConfig(settings || {})
  };
};

const freshTrxBalance = async (userId) => {
  const user = await User.findById(userId).select('trxBalance');
  return rewardService.round6(user?.trxBalance || 0);
};

const energyHandler = {
  async start(ctx) {
    const user = ctx.session?.user;
    if (!user) return ctx.reply('请先使用 /start 命令');
    await answerIfCallback(ctx);
    if (ctx.session) ctx.session.state = null;

    const { cfg, priceTrx, priceEnergy, minAmount } = await loadEnergySettings();
    const balance = await freshTrxBalance(sessionUserId(ctx));
    const message =
      `⚡ <b>能量租赁</b>\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>当前价格：</code>${priceTrx} TRX = ${Number(priceEnergy).toLocaleString()} 能量\n` +
      `<code>余额下限：</code>${minAmount} TRX\n` +
      `<code>我的余额：</code>${balance} TRX\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `链上转账：转到租赁地址后自动租能量\n` +
      `余额支付：先充值 TRX 入账，再用余额租\n` +
      (cfg.trxDepositEnabled ? `最低充值：${cfg.trxDepositMin} TRX` : '充值暂未开启');

    await ctx.reply(message, { parse_mode: 'HTML', reply_markup: menuKeyboard });
  },

  async showChainRental(ctx) {
    const user = ctx.session?.user;
    if (!user) return ctx.reply('请先使用 /start 命令');
    await answerIfCallback(ctx);
    if (ctx.session) ctx.session.state = null;

    try {
      const { walletAddress, priceTrx, priceEnergy, minAmount, validityHours, notice } = await loadEnergySettings();
      if (!walletAddress) return ctx.reply('❌ 能量租赁服务暂未配置，请联系管理员');

      const qrBuffer = await generateEnergyQRCode(walletAddress);
      const message = `⚡ <b>链上转账租赁</b>\n\n` +
        `━━━━━━━━━━━━━━━\n` +
        `<code>当前价格：</code>${priceTrx} TRX = ${Number(priceEnergy).toLocaleString()} 能量\n` +
        `<code>最小金额：</code>${minAmount} TRX\n` +
        `<code>有效期：</code>${validityHours} 小时\n` +
        `━━━━━━━━━━━━━━━\n\n` +
        `📍 <b>收款地址：</b>\n<code>${walletAddress}</code>\n\n` +
        (notice ? `💡 <b>重要提示：</b>\n${notice}\n\n` : '') +
        `⚡ <b>使用说明：</b>\n` +
        `1️⃣ 转入 TRX 到上方地址\n` +
        `2️⃣ 系统自动检测到账\n` +
        `3️⃣ 自动租赁能量到转账地址\n` +
        `4️⃣ 能量有效期 ${validityHours} 小时`;

      await ctx.replyWithPhoto(
        { source: qrBuffer },
        {
          caption: message,
          parse_mode: 'HTML',
          reply_markup: backEnergyKeyboard
        }
      );
    } catch (error) {
      console.error('能量租赁显示失败:', error);
      await ctx.reply('❌ 系统错误，请稍后重试');
    }
  },

  async showWallet(ctx) {
    const userId = sessionUserId(ctx);
    if (!userId) return ctx.reply('请先使用 /start 命令');
    await answerIfCallback(ctx);
    const balance = await freshTrxBalance(userId);
    const { cfg, minAmount } = await loadEnergySettings();
    await ctx.reply(
      `👛 <b>TRX 余额</b>\n\n` +
      `<code>当前余额：</code>${balance} TRX\n` +
      `<code>租赁下限：</code>${minAmount} TRX\n` +
      `<code>充值状态：</code>${cfg.trxDepositEnabled ? '已开启' : '未开启'}\n\n` +
      `余额来自签到、邀请和自行充值，仅用于站内租赁能量。`,
      { parse_mode: 'HTML', reply_markup: menuKeyboard }
    );
  },

  async showDeposit(ctx) {
    const user = ctx.session?.user;
    if (!user) return ctx.reply('请先使用 /start 命令');
    await answerIfCallback(ctx);

    const { cfg } = await loadEnergySettings();
    if (!cfg.trxDepositEnabled) {
      return ctx.reply('❌ 充值未开启，请联系管理员', { reply_markup: backEnergyKeyboard });
    }
    if (!rewardService.isTronAddress(cfg.trxDepositAddress)) {
      return ctx.reply('❌ 充值地址未配置，请联系管理员', { reply_markup: backEnergyKeyboard });
    }

    ctx.session.state = 'waiting_trx_deposit_hash';
    const message =
      `➕ <b>充值 TRX</b>\n\n` +
      `转到下方地址后，把交易哈希发给我入账。\n` +
      `<code>最低充值：</code>${cfg.trxDepositMin} TRX\n\n` +
      `📍 <b>充值地址：</b>\n<code>${cfg.trxDepositAddress}</code>\n\n` +
      `请直接发送 64 位交易哈希（TxID）。`;

    try {
      const qrBuffer = await generateEnergyQRCode(cfg.trxDepositAddress);
      await ctx.replyWithPhoto(
        { source: qrBuffer },
        { caption: message, parse_mode: 'HTML', reply_markup: backEnergyKeyboard }
      );
    } catch (error) {
      console.error('充值二维码失败:', error);
      await ctx.reply(message, { parse_mode: 'HTML', reply_markup: backEnergyKeyboard });
    }
  },

  async handleDepositHash(ctx) {
    const userId = sessionUserId(ctx);
    if (!userId) return ctx.reply('请先使用 /start 命令');
    const txHash = ctx.message?.text || '';
    try {
      const result = await rewardService.creditTrxDeposit({ userId, txHash });
      ctx.session.state = null;
      await ctx.reply(
        `✅ 已入账 ${result.amount} TRX\n当前余额：${result.trxBalance} TRX`,
        { reply_markup: menuKeyboard }
      );
    } catch (err) {
      await ctx.reply(`❌ ${err.message || '充值失败'}，请确认哈希后重试`);
    }
  },

  async startBalanceRent(ctx) {
    const userId = sessionUserId(ctx);
    if (!userId) return ctx.reply('请先使用 /start 命令');
    await answerIfCallback(ctx);
    const balance = await freshTrxBalance(userId);
    const { minAmount, priceTrx, priceEnergy } = await loadEnergySettings();
    ctx.session.state = 'waiting_energy_balance_address';
    ctx.session.energyReceiveAddress = '';
    await ctx.reply(
      `💎 <b>余额租赁</b>\n\n` +
      `<code>当前余额：</code>${balance} TRX\n` +
      `<code>最低金额：</code>${minAmount} TRX\n` +
      `<code>价格：</code>${priceTrx} TRX = ${Number(priceEnergy).toLocaleString()} 能量\n\n` +
      `请发送接收能量的 TRON 地址：`,
      { parse_mode: 'HTML', reply_markup: backEnergyKeyboard }
    );
  },

  async handleBalanceAddress(ctx) {
    const address = String(ctx.message?.text || '').trim();
    if (!rewardService.isTronAddress(address)) {
      return ctx.reply('❌ 地址无效，请发送 T 开头的 TRON 地址');
    }
    ctx.session.energyReceiveAddress = address;
    ctx.session.state = 'waiting_energy_balance_amount';
    const { minAmount } = await loadEnergySettings();
    await ctx.reply(
      `地址已记录：<code>${address}</code>\n\n请输入支付的 TRX 数量（最少 ${minAmount}）：`,
      { parse_mode: 'HTML', reply_markup: backEnergyKeyboard }
    );
  },

  async handleBalanceAmount(ctx) {
    const userId = sessionUserId(ctx);
    if (!userId) return ctx.reply('请先使用 /start 命令');
    const trxAmount = Number(String(ctx.message?.text || '').trim());
    const receiveAddress = ctx.session.energyReceiveAddress;
    try {
      const order = await rewardService.rentEnergyWithBalance({ userId, receiveAddress, trxAmount });
      ctx.session.state = null;
      ctx.session.energyReceiveAddress = '';
      const balance = await freshTrxBalance(userId);
      await ctx.reply(
        `✅ 能量租赁成功\n` +
        `<code>订单：</code>${order.orderNo}\n` +
        `<code>能量：</code>${Number(order.energyAmount).toLocaleString()}\n` +
        `<code>扣款：</code>${order.trxPaid} TRX\n` +
        `<code>余额：</code>${balance} TRX`,
        { parse_mode: 'HTML', reply_markup: menuKeyboard }
      );
    } catch (err) {
      await ctx.reply(`❌ ${err.message || '租赁失败'}`);
    }
  },

  async handleCallback(ctx) {
    const action = ctx.callbackQuery?.data || ctx.match?.[0];
    if (action === 'energy_rental' || action === 'energy') return energyHandler.start(ctx);
    if (action === 'energy_chain') return energyHandler.showChainRental(ctx);
    if (action === 'energy_deposit') return energyHandler.showDeposit(ctx);
    if (action === 'energy_balance') return energyHandler.startBalanceRent(ctx);
    if (action === 'energy_wallet') return energyHandler.showWallet(ctx);
    if (ctx.callbackQuery) await ctx.answerCbQuery('未知操作');
  }
};

module.exports = energyHandler;
