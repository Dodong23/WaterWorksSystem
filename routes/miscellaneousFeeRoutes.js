const express = require('express');
const router = express.Router();
const miscellaneousFeeController = require('../controllers/miscellaneousFeeController');

// GET /api/misc-fees - Get all miscellaneous fees
router.get('/', miscellaneousFeeController.getAllFees);

// GET /api/misc-fees/client/:clientId/unpaid - Get unpaid miscellaneous fees for a client
router.get('/client/:clientId/unpaid', miscellaneousFeeController.getUnpaidFeesByClientId);

// GET /api/misc-fees/client/:clientId - Get all miscellaneous fees for a client
router.get('/client/:clientId', miscellaneousFeeController.getFeesByClientId);

// POST /api/misc-fees - Create a new miscellaneous fee
router.post('/', miscellaneousFeeController.createFee);

// GET /api/misc-fees/:id - Get a miscellaneous fee by its ID
router.get('/:id', miscellaneousFeeController.getFeeById);

// PUT /api/misc-fees/:id - Update a miscellaneous fee
router.put('/:id', miscellaneousFeeController.updateFee);

// PUT /api/misc-fees/:id/cancel - Cancel a miscellaneous fee
router.put('/:id/cancel', miscellaneousFeeController.cancelFee);

// DELETE /api/misc-fees/:id - Delete a miscellaneous fee
router.delete('/:id', miscellaneousFeeController.deleteFee);

// PUT /api/misc-fees/:id/work-order - Update work order for a miscellaneous fee
router.put('/:id/work-order', miscellaneousFeeController.updateWorkOrder);

module.exports = router;
