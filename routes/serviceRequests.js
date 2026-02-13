const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');

// Create a new service request
router.post('/', serviceRequestController.createServiceRequest);

// Get all service requests
router.get('/', serviceRequestController.getAllServiceRequests);

// Get a single service request by ID
router.get('/:id', serviceRequestController.getServiceRequestById);

// Update a service request by ID
router.put('/:id', serviceRequestController.updateServiceRequest);

// Delete a service request by ID
router.delete('/:id', serviceRequestController.deleteServiceRequest);

module.exports = router;
