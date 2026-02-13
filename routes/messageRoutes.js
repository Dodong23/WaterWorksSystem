const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
} = require('../controllers/messageController');

// @route   GET api/messages/:userId
// @desc    Get messages with a specific user
// @access  Private
router.get('/:userId', getMessages);

// @route   POST api/messages
// @desc    Send a new message
// @access  Private
router.post('/', sendMessage);

module.exports = router;
