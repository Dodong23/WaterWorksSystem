const Fee = require('../models/Fee');

// Create a new fee
exports.createFee = async (req, res) => {
    try {
        const { name, description, amount, accomplishingOffice } = req.body;
        const newFee = new Fee({ name, description, amount, accomplishingOffice, createdBy: req.user._id });
        await newFee.save();
        res.status(201).json({ success: true, message: 'Fee created successfully', data: newFee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create fee', error: error.message });
    }
};

// Get all fees
exports.getAllFees = async (req, res) => {
    try {
        const fees = await Fee.find().sort({ name: 1 }).lean();
        res.status(200).json(fees);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch fees', error: error.message });
    }
};

// Get a single fee by ID
exports.getFeeById = async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id);
        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee not found' });
        }
        res.status(200).json({ success: true, data: fee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch fee', error: error.message });
    }
};

// Update a fee
exports.updateFee = async (req, res) => {
    try {
        const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee not found' });
        }
        res.status(200).json({ success: true, message: 'Fee updated successfully', data: fee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update fee', error: error.message });
    }
};

// Delete a fee
exports.deleteFee = async (req, res) => {
    try {
        const fee = await Fee.findByIdAndDelete(req.params.id);
        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee not found' });
        }
        res.status(200).json({ success: true, message: 'Fee deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete fee', error: error.message });
    }
};
