const mongoose = require('mongoose');

const withdrawRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  address: { type: String, required: true },
  status: { type: String, enum: ['pending', 'paid', 'rejected'], default: 'pending', index: true },
  txHash: { type: String, default: '' },
  rejectReason: { type: String, default: '' },
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

withdrawRequestSchema.index({ userId: 1, createdAt: -1 });
withdrawRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('WithdrawRequest', withdrawRequestSchema);
