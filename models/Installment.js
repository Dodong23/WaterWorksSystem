const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
    clientId: {
        type: String,
        required: true,
    },
    installmentId: {
        type: String,
        required: true,
    },
    processedBy: {
        type: String,
        required: true,
    },
    processedDate: {
        type: Date,
        required: true,
    },
    signedBy: {
        type: String,
        required: true,
    },
    installmentRef: {
        type: String,
        required: true,
    },
    items: [{}],
    paymementSchedules: [{
        type: String,
        required: true,
    }],
});

module.exports = mongoose.model('installment', installmentSchema);