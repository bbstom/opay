const mongoose = require('mongoose');

const energyRentalOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderNo: { type: String, required: true, unique: true },
  receiveAddress: { type: String, required: true },
  trxPaid: { type: Number, required: true },
  energyAmount: { type: Number, required: true },
  duration: { type: String, default: '1h' },
  payMethod: { type: String, default: 'balance' },
  status: { type: String, enum: ['pending', 'fulfilled', 'refunded', 'failed'], default: 'pending' },
  catfeeOrderNo: { type: String, default: '' },
  error: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

energyRentalOrderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('EnergyRentalOrder', energyRentalOrderSchema);
