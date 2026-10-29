/**
 * 代付订单领域服务
 * - 创建订单 / 费率
 * - 支付回调（原子幂等）
 * - 链上转账与重试
 */

const jwt = require('../utils/jwt');
const Payment = require('../models/Payment');
const Settings = require('../models/Settings');
const paymentService = require('./paymentService');
const tronService = require('./tronService');
const emailService = require('./emailService');
const telegramNotifications = require('../bot/notifications');
const rewardService = require('./rewardService');
const { quoteServiceFee, getExchangeRate } = require('../utils/tieredFee');

// 订单状态机：仅允许单向推进
const PAYMENT_STATUS_FLOW = {
  pending: new Set(['paid', 'failed', 'expired']),
  paid: new Set(['completed', 'failed']),
  completed: new Set(),
  failed: new Set(['paid']) // 管理员重试可回到 paid 再转账
};

const TRANSFER_STATUS_FLOW = {
  pending: new Set(['processing', 'failed']),
  processing: new Set(['completed', 'pending', 'failed']), // pending = 重试排队
  completed: new Set(),
  failed: new Set(['pending']) // 允许重试重置
};

function canTransit(flow, from, to) {
  if (from === to) return true;
  return flow[from]?.has(to) === true;
}

function calculateServiceFee(amount, payType, settings) {
  return quoteServiceFee(amount, payType, settings);
}

function tryDecodeUserId(authHeader) {
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const decoded = jwt.verifyToken(token);
    return decoded.userId || null;
  } catch {
    return null;
  }
}

/**
 * 创建代付订单 + 拉起支付
 */
async function createOrder(body, authHeader) {
  const { payType, amount, address, paymentMethod, email, telegramId } = body;

  if (!payType || !amount || !address || !paymentMethod) {
    const err = new Error('缺少必要参数');
    err.status = 400;
    throw err;
  }

  const settings = await Settings.findOne();
  if (!settings) {
    const err = new Error('系统配置未完成');
    err.status = 400;
    throw err;
  }

  const feeResult = calculateServiceFee(amount, payType, settings);
  if (feeResult.error) {
    const err = new Error(feeResult.error);
    err.status = 400;
    throw err;
  }

  const totalCNY = feeResult.totalCNY;

  const orderId =
    'ORD' + Date.now() + Math.random().toString(36).substring(2, 9).toUpperCase();
  const userId = tryDecodeUserId(authHeader);

  const payment = new Payment({
    userId,
    payType,
    amount,
    address,
    paymentMethod,
    totalCNY,
    serviceFee: feeResult.serviceFee,
    platformOrderId: orderId,
    email: email || null,
    telegramId: telegramId || null,
    paymentStatus: 'pending',
    transferStatus: 'pending',
    status: 'pending'
  });
  await payment.save();

  const useMockPayment =
    process.env.NODE_ENV === 'development' &&
    (!settings.paymentMerchantId || !settings.paymentApiKey);

  if (useMockPayment) {
    console.log('⚠️  使用模拟支付模式（开发环境）');
    return {
      status: 201,
      data: {
        payment,
        paymentUrl: `https://pay.abcdely.top/mock?order=${orderId}&amount=${totalCNY}`,
        orderId,
        mock: true
      }
    };
  }

  const randomProductName = Math.floor(Math.random() * 1e12)
    .toString()
    .padStart(12, '0');

  const paymentOrder = await paymentService.createPaymentOrder({
    orderId,
    amount: totalCNY,
    payType,
    paymentMethod,
    subject: randomProductName,
    body: randomProductName
  });

  let paymentUrl;
  if (settings.paymentApiVersion === 'v2') {
    paymentUrl =
      paymentOrder.pay_url ||
      paymentOrder.payUrl ||
      paymentOrder.data?.pay_url ||
      paymentOrder.data?.payUrl ||
      paymentOrder.url ||
      paymentOrder.payment_url ||
      paymentOrder.data?.url ||
      paymentOrder.data?.qrcode_url;
  } else {
    paymentUrl =
      paymentOrder.payurl ||
      paymentOrder.pay_url ||
      paymentOrder.qrcode ||
      paymentOrder.code_url;
    if (paymentOrder.type === 'html' && !paymentUrl) {
      paymentUrl = paymentOrder.payurl || `${settings.paymentApiUrl}/submit.php`;
    }
  }

  if (!paymentUrl && paymentOrder.type === 'html') {
    paymentUrl = paymentOrder.payurl;
  }

  if (!paymentUrl) {
    const err = new Error('支付平台未返回支付链接，请检查配置');
    err.status = 400;
    err.debug = paymentOrder;
    throw err;
  }

  return {
    status: 201,
    data: { payment, paymentUrl, orderId }
  };
}

/**
 * 支付成功回调：原子 CAS 更新，保证幂等，避免重复出款
 * @returns {'success'|'fail'|'already'}
 */
async function handlePaymentNotify({ outTradeNo, tradeStatus, raw }) {
  const successStatuses = new Set(['TRADE_SUCCESS', 'success', '1', 'SUCCESS']);
  if (!successStatuses.has(String(tradeStatus))) {
    console.log('支付状态不是成功:', tradeStatus);
    return 'fail';
  }

  // 原子：仅 pending → paid，已 paid/completed 直接幂等成功
  const payment = await Payment.findOneAndUpdate(
    {
      platformOrderId: outTradeNo,
      paymentStatus: 'pending'
    },
    {
      $set: {
        paymentStatus: 'paid',
        paymentTime: new Date(),
        status: 'paid'
      }
    },
    { new: true }
  );

  if (!payment) {
    const existing = await Payment.findOne({ platformOrderId: outTradeNo });
    if (!existing) {
      console.error('订单不存在:', outTradeNo);
      return 'fail';
    }
    // 已处理过
    console.log('订单已处理过，幂等返回成功:', outTradeNo, existing.paymentStatus);
    return 'already';
  }

  console.log('✅ 支付成功（原子确认）:', payment._id, raw ? '' : '');

  const settings = await Settings.findOne();

  if (payment.email) {
    try {
      await emailService.sendPaymentSuccessEmail(payment, settings);
    } catch (emailError) {
      console.error('❌ 发送支付成功邮件失败:', emailError);
    }
  }

  if (payment.telegramId) {
    try {
      await telegramNotifications.notifyPaymentSuccess(payment.telegramId, payment);
    } catch (tgError) {
      console.error('❌ 发送 TG 支付成功通知失败:', tgError);
    }
  }

  // 仅在首次确认支付时触发转账
  processTransfer(payment._id).catch((err) => {
    console.error('代付失败:', err);
  });

  rewardService.onPaymentPaid(payment, settings).catch((err) => {
    console.error('消费返佣失败:', err.message);
  });

  return 'success';
}

async function verifyAndHandleNotify(params, settings) {
  if (!settings) {
    settings = await Settings.findOne();
  }
  if (!settings || !paymentService.verifySign(params, settings)) {
    console.error('签名验证失败', params);
    return 'fail';
  }

  const outTradeNo = params.out_trade_no;
  const tradeStatus =
    params.trade_status || params.status || params.tradeStatus;

  if (!outTradeNo) {
    return 'fail';
  }

  return handlePaymentNotify({
    outTradeNo,
    tradeStatus,
    raw: params
  });
}

async function updateWalletBalance(walletId, timeout = 30000) {
  const Wallet = require('../models/Wallet');
  const wallet = await Wallet.findById(walletId);
  if (!wallet) throw new Error('钱包不存在');
  if (!wallet.address) throw new Error('钱包地址为空');

  await tronService.initialize();

  const updatePromise = (async () => {
    const [trxBalance, usdtBalance] = await Promise.all([
      tronService.getBalance(wallet.address),
      tronService.getUSDTBalance(wallet.address)
    ]);
    wallet.balance.trx = trxBalance;
    wallet.balance.usdt = usdtBalance;
    wallet.balance.lastUpdated = new Date();
    await wallet.save();
    return { trxBalance, usdtBalance };
  })();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('更新超时')), timeout)
  );

  await Promise.race([updatePromise, timeoutPromise]);
}

/**
 * 链上转账：transferStatus 原子抢占 processing，防并发双花
 */
async function processTransfer(paymentId, retryCount = 0, maxRetries = 3) {
  const walletSelector = require('./walletSelector');
  let selectedWallet = null;

  try {
    // 原子抢占：pending|failed → processing
    const payment = await Payment.findOneAndUpdate(
      {
        _id: paymentId,
        transferStatus: { $in: ['pending', 'failed'] }
      },
      { $set: { transferStatus: 'processing' } },
      { new: true }
    );

    if (!payment) {
      const current = await Payment.findById(paymentId);
      console.log(
        `订单 ${paymentId} 无法抢占转账锁，当前 transferStatus=${current?.transferStatus}`
      );
      return;
    }

    if (!canTransit(PAYMENT_STATUS_FLOW, payment.status, 'completed') && payment.status !== 'paid') {
      console.log(`订单状态 ${payment.status} 不允许转账，跳过`);
      // 回滚 processing
      await Payment.updateOne(
        { _id: paymentId, transferStatus: 'processing' },
        { $set: { transferStatus: 'pending' } }
      );
      return;
    }

    console.log(`\n🔄 开始处理转账 (尝试 ${retryCount + 1}/${maxRetries + 1})`);
    console.log(`   订单: ${payment.platformOrderId} ${payment.payType} ${payment.amount}`);

    const walletUpdateService = require('./walletUpdateService');
    try {
      await walletUpdateService.updateAllWallets();
    } catch (updateError) {
      console.error('⚠️  钱包余额更新失败:', updateError.message);
    }

    const estimatedFee = payment.payType === 'TRX' ? 2 : 5;
    selectedWallet = await walletSelector.selectBestWallet({
      amount: payment.amount,
      type: payment.payType,
      estimatedFee
    });

    let txResult;
    if (payment.payType === 'USDT') {
      txResult = await tronService.sendUSDTWithWallet(
        selectedWallet,
        payment.address,
        payment.amount
      );
    } else {
      txResult = await tronService.sendTRXWithWallet(
        selectedWallet,
        payment.address,
        payment.amount
      );
    }

    // 原子完成：仅 processing → completed
    const completed = await Payment.findOneAndUpdate(
      { _id: paymentId, transferStatus: 'processing' },
      {
        $set: {
          txHash: txResult.txid,
          transferStatus: 'completed',
          transferTime: new Date(),
          status: 'completed',
          walletId: selectedWallet._id,
          walletName: selectedWallet.name
        }
      },
      { new: true }
    );

    if (!completed) {
      console.error('转账已上链但订单状态写入失败，请人工核对:', paymentId, txResult.txid);
      return;
    }

    console.log(`✅ 代付成功 ${completed.platformOrderId} tx=${completed.txHash}`);

    try {
      await updateWalletBalance(selectedWallet._id);
    } catch (updateError) {
      setTimeout(() => {
        updateWalletBalance(selectedWallet._id).catch(() => {});
      }, 5000);
    }

    if (completed.email) {
      try {
        const settings = await Settings.findOne();
        await emailService.sendTransferCompletedEmail(completed, settings);
        await Payment.updateOne({ _id: completed._id }, { $set: { emailSent: true } });
      } catch (emailError) {
        console.error('❌ 发送代付完成邮件失败:', emailError);
      }
    }

    if (completed.telegramId) {
      try {
        await telegramNotifications.notifyTransferComplete(
          completed.telegramId,
          completed
        );
      } catch (tgError) {
        console.error('❌ 发送 TG 代付完成通知失败:', tgError);
      }
    }
  } catch (error) {
    console.error(`❌ 代付失败 (尝试 ${retryCount + 1}):`, error.message);

    if (selectedWallet) {
      try {
        await updateWalletBalance(selectedWallet._id);
      } catch (_) {}
    }

    if (retryCount < maxRetries) {
      const waitTime = 5000 * (retryCount + 1);
      await Payment.findOneAndUpdate(
        { _id: paymentId, transferStatus: 'processing' },
        { $set: { transferStatus: 'pending' } }
      );
      setTimeout(() => {
        processTransfer(paymentId, retryCount + 1, maxRetries).catch((err) =>
          console.error('重试失败:', err)
        );
      }, waitTime);
    } else {
      const failed = await Payment.findOneAndUpdate(
        { _id: paymentId, transferStatus: { $in: ['processing', 'pending'] } },
        { $set: { transferStatus: 'failed', status: 'failed' } },
        { new: true }
      );
      if (failed?.telegramId) {
        try {
          await telegramNotifications.notifyTransferFailed(
            failed.telegramId,
            failed,
            error.message
          );
        } catch (_) {}
      }
    }
  }
}

/**
 * 管理员重试：仅 failed|pending 且未 completed 可重置
 */
async function retryTransfer(paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const err = new Error('订单不存在');
    err.status = 404;
    throw err;
  }

  if (payment.transferStatus === 'completed' || payment.status === 'completed') {
    const err = new Error('订单已完成，禁止重试');
    err.status = 400;
    throw err;
  }

  if (payment.transferStatus !== 'failed' && payment.transferStatus !== 'pending') {
    const err = new Error('该订单状态不允许重试');
    err.status = 400;
    throw err;
  }

  if (!canTransit(TRANSFER_STATUS_FLOW, payment.transferStatus, 'pending')) {
    const err = new Error('状态机不允许此转换');
    err.status = 400;
    throw err;
  }

  payment.transferStatus = 'pending';
  payment.status = 'paid';
  await payment.save();

  processTransfer(payment._id).catch((err) => {
    console.error('手动重试转账失败:', err);
  });

  return payment;
}

module.exports = {
  createOrder,
  verifyAndHandleNotify,
  handlePaymentNotify,
  processTransfer,
  retryTransfer,
  calculateServiceFee,
  getExchangeRate,
  canTransit,
  PAYMENT_STATUS_FLOW,
  TRANSFER_STATUS_FLOW
};
