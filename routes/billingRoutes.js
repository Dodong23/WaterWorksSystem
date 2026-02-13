const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

// GET /api/billings/config - Get billing configuration
router.get('/config', billingController.getBillingConfig);

// GET /api/billings/download-for-reading - Download latest billing data for reading
router.get('/download-for-reading', billingController.downloadForReading);

// POST /api/billings/config - Update billing configuration
router.post('/config', billingController.updateBillingConfig);
// =============================================
// SPECIFIC ROUTES (must come before parameterized routes)
// =============================================

// GET /api/billings/client/:clientId/unpaid - Get unpaid billings for client
router.get('/client/:clientId/unpaid', billingController.getUnpaidBillings);

// GET /api/billings/client/:clientId - Get all billings for client
router.get('/client/:clientId', billingController.getBillingsByClientId);

// GET /water/clients/:clientId/statement/:year - Get statement data for a client for a specific year
router.get('/clients/:clientId/statement/:year', billingController.getStatementData);

// GET /api/billings/statement-data - Get statement data (JSON) for a client for a specific year
router.get('/statement-data', billingController.getStatementDataJson);

// GET /api/billings/statement-of-account - Generate Statement of Account PDF
router.get('/statement-of-account', billingController.generateStatementOfAccountPdf); //

// GET /api/billings/billingID/:billingID - Get billing by custom billingID
router.get('/billingID/:billingID', billingController.getBillingByBillingId);


// POST /api/billings/generate-billing - Generate billing for a specific month
router.post('/generate-billing', billingController.generateBilling);

// POST /api/billings - Create new billing
router.post('/', billingController.createBilling);

// POST /api/billings/create - Alternative create route
router.post('/create', billingController.createBilling);

// GET /api/billings - Get all billings with filters
router.get('/', billingController.getAllBillings);

// =============================================
// SINGLE RESOURCE ROUTES (must come last)
// =============================================

// GET /api/billings/:id - Get single billing by MongoDB ID
router.get('/:id', billingController.getBillingById);

// PUT /api/billings/:id - Update billing
router.put('/:id', billingController.updateBilling);

// POST 
router.post('/update-via-api', billingController.updateViaAPI); //updateViaAPI

// POST /api/billings/:id/payment - Add payment to billing (using POST instead of PATCH)
router.post('/:id/payment', billingController.addPayment);

// DELETE /api/billings/:id - Delete billing
router.delete('/:id', billingController.deleteBilling);

module.exports = router;