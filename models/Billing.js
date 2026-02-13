const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  billingID: {                 // e.g. "M100-2025-10"
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },

  clientId: {                  // stored as string in your DB (e.g. "M100")
    type: String,
    required: true,
    trim: true,
   
  },

  name: {                      // payor name snapshot
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  meterNum: {                  // meter number stored as string
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  contact: {                   // contact phone (store as string to preserve leading zeros/length)
    type: String,
    default: null
  },

  area: {                      // area / barangay
    type: String,
    default: null
  },

  classification: {            // numeric classification
    type: Number,
  },

  // date fields (stored as strings in your DB)
  sortableDate: {              // "2025-10"
    type: String,
    required: true,
    trim: true
  },

  prevReadDate: {              // e.g. "9/20/2025"
    type: String,
    default: null
  },

  readDate: {                  // e.g. "10/20/2025"
    type: String,
    default: null
  },

  defaultBillingDate: {
    type: String,
    default: null
  },
  // readings & consumption
  previousReading: {
    type: Number,
    default: 0
  },

  currentReading: {
    type: Number,
    default: null
  },

  consumption: {
    type: Number,
    default: 0
  },

  isRead: {
    type: Number,
    default: 0
  },

  // billing parameters
  freeCubic: {
    type: Number,
    default: 0
  },

  lessAmount: {
    type: Number,
    default: 0
  },

  minimum: {
    type: Number,
    default: 0
  },

  perCubic: {
    type: Number,
    default: 0
  },

  note: {
    type: String,
    default: null
  },

  // financials
  currentBilling: {
    type: Number,
    default: 0
  },

  paidAmount: {
    type: Number,
    default: 0
  },

  remainingBalance: {
    type: Number,
    default: 0
  },

  discount: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual id for convenience
billingSchema.virtual('id').get(function() {
  return this._id?.toString();
});

module.exports = mongoose.model('Billing', billingSchema);
