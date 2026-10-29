const mongoose = require('mongoose');

const rewardLedgerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'checkin',
      'invite_signup',
      'consume_reward',
      'energy_spend',
      'energy_refund',
      'withdraw_hold',
      'withdraw_reject',
      'trx_deposit'
    ],
    required: true
  },
  asset: { type: String, enum: ['TRX', 'USDT'], required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, default: 0 },
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedOrderId: { type: String, default: '' },
  relatedOrderType: { type: String, default: '' },
  dayKey: { type: String, default: '' },
  idempotencyKey: { type: String, required: true, unique: true },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

rewardLedgerSchema.index({ userId: 1, createdAt: -1 });
rewardLedgerSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('RewardLedger', rewardLedgerSchema);
