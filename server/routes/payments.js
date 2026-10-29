const express = require('express');
const Payment = require('../models/Payment');
const { auth, adminAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/audit');
const tronService = require('../services/tronService');
const paymentOrderService = require('../services/paymentOrderService');
const Settings = require('../models/Settings');

const router = express.Router();

// 创建代付订单（限流）
router.post('/', rateLimit(30, 60000), async (req, res) => {
  try {
    const result = await paymentOrderService.createOrder(
      req.body,
      req.headers.authorization
    );
    res.status(result.status).json(result.data);
  } catch (error) {
    console.error('创建订单失败:', error.message);
    if (error.debug) console.error('支付平台原始返回:', error.debug);
    const status = error.status || 400;
    res.status(status).json({ error: error.message });
  }
});

// 支付回调 GET
router.get('/notify', rateLimit(120, 60000), async (req, res) => {
  try {
    const settings = await Settings.findOne();
    console.log('收到支付回调（GET）:', req.query);
    const result = await paymentOrderService.verifyAndHandleNotify(req.query, settings);
    res.send(result === 'fail' ? 'fail' : 'success');
  } catch (error) {
    console.error('支付回调处理失败:', error);
    res.send('fail');
  }
});

// 支付回调 POST
router.post('/notify', rateLimit(120, 60000), async (req, res) => {
  try {
    const settings = await Settings.findOne();
    console.log('收到支付回调（POST）:', req.body);
    const result = await paymentOrderService.verifyAndHandleNotify(req.body, settings);
    res.send(result === 'fail' ? 'fail' : 'success');
  } catch (error) {
    console.error('支付回调处理失败:', error);
    res.send('fail');
  }
});

// 获取所有订单（管理员）
router.get('/all', auth, adminAuth, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(1000);
    res.json(payments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 统计（管理员）
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalRevenue, todayRevenue, totalOrders, todayOrders, completedOrders] =
      await Promise.all([
        Payment.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$serviceFee' } } }
        ]),
        Payment.aggregate([
          { $match: { status: 'completed', createdAt: { $gte: today } } },
          { $group: { _id: null, total: { $sum: '$serviceFee' } } }
        ]),
        Payment.countDocuments(),
        Payment.countDocuments({ createdAt: { $gte: today } }),
        Payment.countDocuments({ status: 'completed' })
      ]);

    const successRate =
      totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      totalOrders,
      todayOrders,
      successRate: parseFloat(successRate)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 查询订单状态
router.get('/order/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    let payment = null;
    if (/^[0-9a-fA-F]{24}$/.test(orderId)) {
      payment = await Payment.findById(orderId);
    }
    if (!payment) {
      payment = await Payment.findOne({ platformOrderId: orderId });
    }
    if (!payment) {
      return res.status(404).json({ error: '订单不存在' });
    }
    res.json({
      _id: payment._id,
      payType: payment.payType,
      amount: payment.amount,
      status: payment.status,
      paymentStatus: payment.paymentStatus,
      transferStatus: payment.transferStatus,
      txHash: payment.txHash,
      createdAt: payment.createdAt,
      platformOrderId: payment.platformOrderId
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 手动重试转账（管理员）
router.post('/retry/:paymentId', auth, adminAuth, async (req, res) => {
  try {
    const payment = await paymentOrderService.retryTransfer(req.params.paymentId);
    res.json({ message: '已开始重试转账', payment });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
});

// 钱包状态（管理员）
router.get('/wallet/status', auth, adminAuth, async (req, res) => {
  try {

    const status = await tronService.checkWalletStatus();
    const warnings = [];
    if (status.trxBalance < 50) {
      warnings.push({ type: 'warning', message: 'TRX 余额不足 50，建议及时充值' });
    }
    if (status.trxBalance < 20) {
      warnings.push({ type: 'danger', message: 'TRX 余额严重不足，可能影响转账' });
    }
    if (status.usdtBalance < 100) {
      warnings.push({ type: 'warning', message: 'USDT 余额较低，建议及时充值' });
    }

    res.json({ ...status, warnings });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(payments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .select(
        'payType amount address status txHash createdAt platformOrderId paymentMethod _id'
      );
    res.json(payments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/my-orders', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(payments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/my-stats', auth, async (req, res) => {
  try {
    const query = { userId: req.user.userId };
    const [totalOrders, completedOrders, processingOrders, totalAmountResult] =
      await Promise.all([
        Payment.countDocuments(query),
        Payment.countDocuments({ ...query, status: 'completed' }),
        Payment.countDocuments({
          ...query,
          status: { $in: ['pending', 'paid', 'processing'] }
        }),
        Payment.aggregate([
          { $match: { userId: req.user.userId, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalCNY' } } }
        ])
      ]);

    res.json({
      totalOrders,
      completedOrders,
      processingOrders,
      totalAmount: totalAmountResult[0]?.total || 0
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 兼容旧引用：部分脚本可能 require processTransfer
router.processTransfer = paymentOrderService.processTransfer;

module.exports = router;
