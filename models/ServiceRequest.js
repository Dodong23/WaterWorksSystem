const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
const ServiceRequestSchema = new mongoose.Schema({
//  account info
    clientId: { type: String, required: true },
//     requestId: { type: String, required: true },
//     serviceRef: { type: String, required: true },
//     accountName: { type: String, required: true },
//     classificattion: { type: String, required: true },
//     barangay: { type: String, required: true },s
//     sitio: { type: String, required: true },
//     meterNumber: { type: String, required: true },
// //  request info
//     serviceCode: {type: Number, requered: true},  // 0 - New, 1 - re-connection, 2 - disconnection, 3 - change of meter, 4 - calibration of meter,
//     serviceRequestName: { type: String, required: true },
//     requestorName: { type: String, required: true },
//     requestorContact: { type: String, required: true },
//     prepairedBy: { type: String, requered: true },  // user info...
//     prepairedPosition: { type: String, required: true }, 
    prepairedDate: { type: Date, required: true },
// //  treasury
//     treasuryDone: { type: Number, default: 0 },
//     treasuryDoneDate: { type: String },
//     ORNumber: { type: String },
//     fees: [{}],
// //  engineering
//     plumberDone: { type: Number, default: 0 },
//     plumberDoneDate: { type: String },
//     plumberName: { type: String },
//     settleAmount: { type: Number },
//     remarks: { type: String },
    isCompleted: {type: Number}, // 0 - not yet, 1 - completed
    doneStatus: { type: Number, default: 0 },  // 0 - Inactive, 1 Active
    },
     { timestamps: true });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);