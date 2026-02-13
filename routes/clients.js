const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router.post('/', clientController.createClient);
router.get('/', clientController.getAllClients);
router.get('/:id', clientController.getClientById);
router.get('/client-id/:clientId', 
// Optional: Add validation middleware
  (req, res, next) => {
    if (!req.params.clientId.match(/^[\w-]+$/)) {
      return res.status(400).json({ 
        error: 'Invalid ID format - only letters, numbers, hyphens allowed'
      });
    }
    next();
  },
  clientController.getClientByClientId
);
//router.patch('/:id', clientController.updateClient);
router.patch('/:id', clientController.updateClient);
router.delete('/:clientId', clientController.deleteClient);
module.exports = router;
