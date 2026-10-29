const mongoose = require('mongoose');

const blogTagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true
});

// slug 已 unique，无需重复 index

module.exports = mongoose.model('BlogTag', blogTagSchema);
