const mongoose = require('mongoose');

const miscellaneousSchema = new mongoose.Schema({
  miscId: {
    type: String,
    required: true,
    unique: true
  },
  fee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fee',
    required: true
  },
  name: {
    type: String,
    required: true,
  },
  clientName: String,
  address: String,
  meterNumber: String,
  description: String,
  clientId: {
    type: String,
    required: true,
    trim: true
  },
  dateCreated: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Cancelled'],
    default: 'Unpaid'
  },
  responsibleOffice: [{
    type: String
  }],
  workOrder: {
    plumberName: String,
    dateWorkDone: Date,
    remarks: String,
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending'
    }
  },
  serviceStatus: {
    type: String,
    enum: ['Pending', 'Accomplished'],
    default: 'Pending'
  },
  endorsingOffice: [{
    office: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EndorsingOffice',
      required: true
    },
    fulfilled: {
      type: Number,
      default: 0
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/* ✅ APPLY THE INDEX HERE */
miscellaneousSchema.index(
  { clientId: 1, miscId: 1 },
  { unique: true }
);

/* THEN EXPORT MODEL */
const Miscellaneous = mongoose.model('Miscellaneous', miscellaneousSchema);
module.exports = Miscellaneous;
