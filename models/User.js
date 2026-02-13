const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  officeCode: {type: String, requered: true }, //0-master, 1-billing, 2-treasury, 3-engineering
  officeDescription: {type: String, requered: true},
  userContact: {type: String, requered: true},
  position: {type: String, requered: true},
  isLoggedIn: { type: Boolean, default: false },
  avatar: { type: String, default: 'https://via.placeholder.com/150' }
});

module.exports = mongoose.model('User', userSchema);
