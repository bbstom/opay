const mongoose = require('mongoose');

const jobLockSchema = new mongoose.Schema(
  {
    _id: { type: String },
    owner: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

jobLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('JobLock', jobLockSchema);
