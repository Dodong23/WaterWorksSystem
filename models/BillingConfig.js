const mongoose = require('mongoose');

const billingConfigSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, default: 'default' },
  rates: {
    commercial: {
      minimum: { type: Number, required: true, default: 0 },
      perCubic: { type: Number, required: true, default: 0 }
    },
    residential: {
      minimum: { type: Number, required: true, default: 0 },
      perCubic: { type: Number, required: true, default: 0 }
    },
    institutional: {
      minimum: { type: Number, required: true, default: 0 },
      perCubic: { type: Number, required: true, default: 0 }
    },
    industrial: {
      minimum: { type: Number, required: true, default: 0 },
      perCubic: { type: Number, required: true, default: 0 }
    }
  },
  meterReader: { type: String },
  contactNo: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BillingConfig', billingConfigSchema);
