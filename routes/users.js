const express = require('express');
const router = express.Router();
const {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMe
} = require('../controllers/userController');
const auth = require('../middleware/authMiddleware'); // Assuming auth middleware exists

// @route   GET api/users/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, getMe);

router.post('/', registerUser);         // Register new user
router.get('/', getAllUsers);           // Get all users
router.get('/:id', getUserById);        // Get single user
router.put('/:id', updateUser);         // Update user
router.delete('/:id', deleteUser);      // Delete user

module.exports = router;
