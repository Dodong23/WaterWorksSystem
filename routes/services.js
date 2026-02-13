const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');

// Create a new service
router.post('/', servicesController.createService);

// Get all services
router.get('/', servicesController.getAllServices);

// Get a single service by ID
router.get('/:id', servicesController.getServiceById);

// Update a service by ID
router.put('/:id', servicesController.updateService);

// Delete a service by ID
router.delete('/:id', servicesController.deleteService);

module.exports = router;
