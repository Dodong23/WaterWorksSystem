const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  accomplishingOffice: {
    type: String, // e.g., '1' for Billing, '2' for Treasury, '3' for Engineering
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

const Fee = mongoose.model('Fee', feeSchema);
module.exports = Fee;
