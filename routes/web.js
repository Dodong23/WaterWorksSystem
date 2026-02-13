const express = require('express');
const router = express.Router();
const path = require('path');
const webController = require('../controllers/webController');
// Serve the client listing page
router.get('/', webController.getAllClients);
router.get('/all-clients', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/client-list.html'));
});

router.get('/treasury', (req, res) => {
    res.sendFile(path.join(__dirname, '../index-treasury.html'));
});

router.get('/billing', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/billing.html'));
});

router.get('/billing-management', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/billing-management.html'));
});

module.exports = router;