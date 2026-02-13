const express = require('express');
const router = express.Router();
const ORRegistryController = require('../controllers/orRegistryController');
const auth = require('../middleware/authMiddleware');

// Import middleware (assuming you have these)
// const auth = require('../middleware/auth');
// const validate = require('../middleware/validate');
// const { orRegistrySchema } = require('../validations/orRegistryValidation');

// Apply authentication middleware to all routes
// router.use(auth);

/**
 * @route   GET /api/or-registry/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'OR Registry API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * @route   POST /api/or-registry/batches
 * @desc    Create new OR batch
 * @access  Private (Admin/Cashier)
 */
router.post('/batches', ORRegistryController.createBatch);
// With validation: router.post('/batches', validate(orRegistrySchema.create), ORRegistryController.createBatch);

/**
 * @route   GET /api/or-registry/batches
 * @desc    Get all batches with pagination and filters
 * @access  Private
 */
router.get('/batches', ORRegistryController.getAllBatches);

/**
 * @route   GET /api/or-registry/batches/statistics
 * @desc    Get system statistics
 * @access  Private
 */
router.get('/batches/statistics', ORRegistryController.getStatistics);

/**
 * @route   GET /api/or-registry/batches/next-or
 * @desc    Get next available OR number for the logged in user
 * @access  Private
 */
router.get('/batches/next-or', auth, ORRegistryController.getNextOR);

/**
 * @route   GET /api/or-registry/batches/search
 * @desc    Search for specific OR number
 * @access  Private
 */
router.get('/batches/search', ORRegistryController.searchOR);

/**
 * @route   GET /api/or-registry/batches/:id
 * @desc    Get batch by ID
 * @access  Private
 */
router.get('/batches/:id', ORRegistryController.getBatchById);

/**
 * @route   PUT /api/or-registry/batches/:id
 * @desc    Update batch
 * @access  Private (Admin)
 */
router.put('/batches/:id', ORRegistryController.updateBatch);
// With validation: router.put('/batches/:id', validate(orRegistrySchema.update), ORRegistryController.updateBatch);

/**
 * @route   DELETE /api/or-registry/batches/:id
 * @desc    Soft delete batch
 * @access  Private (Admin)
 */
router.delete('/batches/:id', ORRegistryController.deleteBatch);

/**
 * @route   PATCH /api/or-registry/batches/:id/status
 * @desc    Change batch status
 * @access  Private (Admin)
 */
router.patch('/batches/:id/status', ORRegistryController.changeBatchStatus);

/**
 * @route   GET /api/or-registry/batches/:id/usage
 * @desc    Get usage history for a batch
 * @access  Private
 */
router.get('/batches/:id/usage', ORRegistryController.getBatchUsage);

/**
 * @route   POST /api/or-registry/batches/:id/issue
 * @desc    Issue next OR number from batch
 * @access  Private (Cashier)
 */
router.post('/batches/:id/issue', ORRegistryController.issueOR);

/**
 * @route   POST /api/or-registry/batches/:id/void/:orNumber
 * @desc    Void an issued OR number
 * @access  Private (Admin/Cashier)
 */
router.post('/batches/:id/void/:orNumber', ORRegistryController.voidOR);

// Export router
module.exports = router;