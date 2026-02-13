const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update isLoggedIn status
    user.isLoggedIn = true;
    await user.save();

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        officeCode: user.officeCode,
        fullName: user.fullName
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        // Set token in an HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            maxAge: 3600000 // 1 hour in milliseconds
        });
        res.json({ success: true, user: { id: user.id, username: user.username, isLoggedIn: user.isLoggedIn, officeCode: user.officeCode, fullName: user.fullName } });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

const logoutUser = async (req, res) => {
  try {
    // Assuming user ID is available from auth middleware after token verification
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isLoggedIn = false;
    await user.save();

    res.clearCookie('token'); // Clear the token cookie on logout
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

module.exports = {
  loginUser,
  logoutUser
};
