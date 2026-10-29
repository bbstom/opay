const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/audit');
const User = require('../models/User');
const RewardLedger = require('../models/RewardLedger');
const WithdrawRequest = require('../models/WithdrawRequest');
const EnergyRentalOrder = require('../models/EnergyRentalOrder');
const rewardService = require('../services/rewardService');

const router = express.Router();

const asyncRoute = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    const status = err.status || 400;
    res.status(status).json({ error: err.message || '操作失败' });
  });
};

const pageQuery = (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

router.get('/config', asyncRoute(async (_req, res) => {
  const settings = await rewardService.loadSettings();
  res.json(rewardService.publicRewardConfig(settings));
}));

router.get('/me', auth, asyncRoute(async (req, res) => {
  const summary = await rewardService.getSummary(req.user.userId);
  res.json(summary);
}));

router.post('/checkin', auth, rateLimit(8, 60000), asyncRoute(async (req, res) => {
  const result = await rewardService.checkin(req.user.userId);
  res.json({ message: '签到成功', ...result });
}));

router.get('/ledger', auth, asyncRoute(async (req, res) => {
  const { page, limit, skip } = pageQuery(req);
  const filter = { userId: req.user.userId };
  const [items, total] = await Promise.all([
    RewardLedger.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    RewardLedger.countDocuments(filter)
  ]);
  res.json({ items, total, page, limit });
}));

router.get('/invitees', auth, asyncRoute(async (req, res) => {
  const { page, limit, skip } = pageQuery(req);
  const filter = { invitedBy: req.user.userId };
  const [items, total] = await Promise.all([
    User.find(filter).select('username createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter)
  ]);
  res.json({ items, total, page, limit });
}));

router.post('/withdraw', auth, rateLimit(6, 60000), asyncRoute(async (req, res) => {
  const withdraw = await rewardService.requestWithdraw({
    userId: req.user.userId,
    amount: req.body.amount,
    address: req.body.address
  });
  res.status(201).json({ message: '提现已提交', withdraw });
}));

router.get('/withdraws', auth, asyncRoute(async (req, res) => {
  const { page, limit, skip } = pageQuery(req);
  const filter = { userId: req.user.userId };
  const [items, total] = await Promise.all([
    WithdrawRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WithdrawRequest.countDocuments(filter)
  ]);
  res.json({ items, total, page, limit });
}));

router.post('/energy', auth, rateLimit(8, 60000), asyncRoute(async (req, res) => {
  const order = await rewardService.rentEnergyWithBalance({
    userId: req.user.userId,
    receiveAddress: req.body.receiveAddress || req.body.address,
    trxAmount: req.body.trxAmount || req.body.amount
  });
  res.status(201).json({ message: '能量租赁成功', order });
}));

router.post('/deposit', auth, rateLimit(8, 60000), asyncRoute(async (req, res) => {
  const result = await rewardService.creditTrxDeposit({
    userId: req.user.userId,
    txHash: req.body.txHash || req.body.hash
  });
  res.json({ message: `已入账 ${result.amount} TRX`, ...result });
}));

router.get('/energy-orders', auth, asyncRoute(async (req, res) => {
  const { page, limit, skip } = pageQuery(req);
  const filter = { userId: req.user.userId };
  const [items, total] = await Promise.all([
    EnergyRentalOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    EnergyRentalOrder.countDocuments(filter)
  ]);
  res.json({ items, total, page, limit });
}));

router.get('/admin/withdraws', auth, adminAuth, asyncRoute(async (req, res) => {
  const { page, limit, skip } = pageQuery(req);
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  const [items, total] = await Promise.all([
    WithdrawRequest.find(filter)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WithdrawRequest.countDocuments(filter)
  ]);
  res.json({ items, total, page, limit });
}));

router.post('/admin/withdraws/:id/approve', auth, adminAuth, asyncRoute(async (req, res) => {
  const withdraw = await rewardService.approveWithdraw({
    adminId: req.user.userId,
    withdrawId: req.params.id,
    txHash: req.body.txHash
  });
  res.json({ message: '已标记打款', withdraw });
}));

router.post('/admin/withdraws/:id/reject', auth, adminAuth, asyncRoute(async (req, res) => {
  const withdraw = await rewardService.rejectWithdraw({
    adminId: req.user.userId,
    withdrawId: req.params.id,
    reason: req.body.reason
  });
  res.json({ message: '已驳回并退回余额', withdraw });
}));

router.get('/admin/ledger', auth, adminAuth, asyncRoute(async (req, res) => {
  const { page, limit, skip } = pageQuery(req);
  const filter = {};
  if (req.query.userId) filter.userId = req.query.userId;
  if (req.query.type) filter.type = req.query.type;
  const [items, total] = await Promise.all([
    RewardLedger.find(filter)
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    RewardLedger.countDocuments(filter)
  ]);
  res.json({ items, total, page, limit });
}));

module.exports = router;
