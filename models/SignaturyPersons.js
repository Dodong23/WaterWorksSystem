const mongoose = require('mongoose');

const signaturyPersonSchema = new mongoose.Schema({
  spId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  nameExtension: { type: String, required: false },
  title: {type: String, requered: true },
  officeName: {type: String, requered: flase},
  agency: {type: String, requered: true},
  electronicSignature: {type: String, requered: false},
});

module.exports = mongoose.model('SignaturyPerson', signaturyPersonSchema);
