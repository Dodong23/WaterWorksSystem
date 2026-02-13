const mongoose = require('mongoose');

const endorsingOfficeSchema = new mongoose.Schema({
    officeCode: {
        type: Number,
        required: true,
        unique: true
    },
    officeName: {
        type: String,
        required: true
    },
    officeLocation: {
        type: String,
        required: true
    },
    officeContact: {
        type: String,
        required: true
    },
    officeHead: {
        type: String,
        required: true
    },
    
});

module.exports = mongoose.model('EndorsingOffice', endorsingOfficeSchema);