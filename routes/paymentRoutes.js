const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create', paymentController.createPayment);
router.post('/add', paymentController.addPayment);           // New route for addPayment
router.get('/', paymentController.getAllPayments);
router.get('/stats', paymentController.getPaymentStats);
router.get('/dashboard-summary', paymentController.getDashboardSummary);
router.get('/search', paymentController.searchByOrNumber);
router.get('/:id', paymentController.getPaymentById);
router.get('/client/:clientId', paymentController.getPaymentsByClientId);
router.get('/by-batch/:batchCode', paymentController.getPaymentsByBatchCode);
router.put('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);
router.post('/cancel-payment', paymentController.cancelPayment);

module.exports = router;