const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');

// All routes are protected and can only be accessed by authenticated users.
// Further role-based access can be added here if needed (e.g., only Treasury can create/update/delete).

// GET /api/fees - Get all fees
router.get('/', feeController.getAllFees);

// POST /api/fees - Create a new fee
router.post('/', feeController.createFee);

// GET /api/fees/:id - Get a single fee by ID
router.get('/:id', feeController.getFeeById);

// PUT /api/fees/:id - Update a fee
router.put('/:id', feeController.updateFee);

// DELETE /api/fees/:id - Delete a fee
router.delete('/:id', feeController.deleteFee);

module.exports = router;
