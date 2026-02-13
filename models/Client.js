const mongoose = require('mongoose');
const ClientIdGenerator = require('../helpers/clientIdGenerator');
const clientsSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    unique: true,
    default: undefined
  },
  name: {
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  contact: { 
    type: String,
    unique: false,
    default: "N/A"
  },
  meterNumber: {
    type: String,
    unique: false,
    default: "N/A"
  },
   barangay: {
    type: Number,
    required: true,
    default: 0
  },
  sitio: {
    type: String, 
    required: false,
    trim: true,
    maxlength: 50,
    default: null
  },
    status: {
    type: Number,
    enum: [0, 1, 2, 3, 4],
    required: true,
    default: 1
  },
   classification: {
    type: Number,
    required: false,
    default: 0
  },
    lastReadDate: {type: Date, 
    required: true,
  },
  lastReadValue: { 
    type: Number, 
    required: false,
    default: 0
  },
  registerNote: {type: String, 
    required: false,
    trim: true,
    maxlength: 250,
    default: null
  },
   balance: { 
    type: Number, 
    required: false,
    default: 0
  },
   freeCubic: { 
    type: Number, 
    required: false,
    default: 0
  },
   lessAmount: {
    type: Number, 
    required: false,
    default: 0
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
// Add this function directly in the model file
clientsSchema.statics.insertManyWithGeneratedIds = async function(docs) {
// Group documents by barangay
  const barangayGroups = {};
  docs.forEach(doc => {
    const barangay = doc.barangay.toString().padStart(2, '0');
    if (!barangayGroups[barangay]) {
      barangayGroups[barangay] = [];
    }
    barangayGroups[barangay].push(doc);
  });

  // Process each barangay group separately
  const documentsWithIds = await Promise.all(
    Object.entries(barangayGroups).flatMap(async ([barangay, barangayDocs]) => {
      // Get the last client ID for this barangay
      const lastClient = await this.findOne({ clientId: new RegExp(`^${barangay}-`) })
        .sort({ clientId: -1 })
        .limit(1)
        .lean();

      // Determine starting sequence
      let sequence = 1;
      if (lastClient && lastClient.clientId) {
        const parts = lastClient.clientId.split('-');
        if (parts.length === 3) {
          sequence = parseInt(parts[2]) + 1;
        }
      }
      // Generate IDs for each document in this barangay group
      return barangayDocs.map(doc => {
        if (!doc.clientId) {
          const currentYear = new Date().getFullYear();
          const cid = `${barangay}-${currentYear}-${sequence.toString().padStart(4, '0')}`;
          doc.clientId = cid;
          sequence++;
        }
        return doc;
      });
    })
  );
  // Flatten the array of arrays and perform the insert
  return this.insertMany(documentsWithIds.flat());
};
module.exports = mongoose.model('Client', clientsSchema);




