const express = require('express');
const router = express.Router();
const { loginUser, logoutUser } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware'); // Assuming auth middleware exists

router.post('/login', loginUser);
router.post('/logout', auth, logoutUser); // Protected logout route

module.exports = router;
