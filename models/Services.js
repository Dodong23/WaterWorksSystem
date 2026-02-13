const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    serviceCode: {
        type: Number,
        required: true,
        unique: true
    },
    serviceName: {
        type: String,
        required: true
    },
    paymentRequired: {
        type: Number,
        required: true
    },
    plumberRequired: {
        type: Number,
        required: true
    },
    doneStatus: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Service', ServiceSchema);