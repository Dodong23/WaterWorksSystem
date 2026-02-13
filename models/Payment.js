const mongoose = require("mongoose");

const mongoosePaginate = require('mongoose-paginate-v2');

const allocationSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  isPaidFull: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  // Optional external identifier (string-friendly)
  paymentId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },

  payor: {
    type: String,
    required: true,
    trim: true,
  },

  address: {
    type: String,
    required: false,
    trim: true,
  },

  clientId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },

  batch: {
    type: String,
    required: true,
    trim: true,
  },

  type: {
    type: String,
    required: true,
    trim: true,
  },

  orNumber: {
    type: Number,
    required: true,
    index: true
  },

  paymentDate: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  currency: {
    type: String,
    default: "PHP",
    uppercase: true,
    trim: true
  },

  paymentMethod: {
    type: String,
    required: true,
    default: "Cash",
    trim: true
  },

  status: {
    type: String,
    enum: ['paid', 'cancelled'],
    default: 'paid'
  },

  cancellationReason: {
    type: String,
    default: ''
  },

  cancelledBy: {
    type: String,
    default: ''
  },

  cancelledAt: {
    type: Date
  },

  allocation: {
    type: [allocationSchema],
    required: true,
    validate: {
      validator: function (value) {
        return Array.isArray(value) && value.length > 0;
      },
      message: "Allocation cannot be empty."
    }
  },

  notes: {
    type: String,
    default: ""
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Backwards-compatibility alias: `allocations` -> `allocation`
paymentSchema.virtual('allocations').get(function () {
  return this.allocation;
});

// Validation to ensure totalAmount equals sum of allocation amounts (allow small rounding differences)
paymentSchema.pre("save", function (next) {
  try {
    if (!Array.isArray(this.allocation) || this.allocation.length === 0) {
      return next(new Error('Allocation cannot be empty'));
    }

    const totalAllocation = this.allocation.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (Math.abs(Number(this.totalAmount || 0) - totalAllocation) > 0.01) {
      return next(new Error(`Total amount (${this.totalAmount}) must equal sum of allocation amounts (${totalAllocation})`));
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

// Indexes for common queries
paymentSchema.index({ "allocation.code": 1 });
paymentSchema.index({ paymentDate: -1 });

// Add pagination plugin
paymentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Payment", paymentSchema);