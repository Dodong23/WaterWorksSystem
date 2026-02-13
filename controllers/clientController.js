const Client = require('../models/Client');
const ServiceRequest = require('../models/ServiceRequest');
const clientService = require('../services/clientService');
const Billing = require("../models/Billing");
const Payment = require("../models/Payment");
const MiscellaneousFee = require("../models/MiscellaneousFee");
// const beneficiaryController = require('./beneficiaryController');
exports.createClient = async (req, res) => {
  try {
    // Only consider clientIds matching /^M\d+$/
    const lastClient = await Client.aggregate([
      { $match: { clientId: { $regex: /^M\d+$/ } } },   // Only IDs starting with 'M' followed by digits
      { $project: {
          clientId: 1,
          clientIdNum: { $toInt: { $substr: ["$clientId", 1, -1] } } // skip 'M', take the rest
        }
      },
      { $sort: { clientIdNum: -1 } },
      { $limit: 1 }
    ]);

    let nextId = 'M100'; // Default if no clients exist
    if (lastClient && lastClient.length > 0 && lastClient[0].clientId) {
      const prefix = 'M';
      const num = (lastClient[0].clientIdNum || 99) + 1;
      nextId = `${prefix}${num}`;
    }

    // Create the client with the generated ID
    const clientData = { ...req.body, clientId: nextId };
    // Directly insert to DB using the Client model
    console.log("Creating client with ID:", nextId);
    console.log("Client data:", clientData);
    const client = await Client.create(clientData);

    // Send single response
    res.status(201).json(client);

  } catch (err) {
    console.error("client controller/createClient error:", err.message);

    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: err.errors
      });
    }

    if (err.code === 11000) { // Duplicate key error
      return res.status(400).json({
        error: 'Duplicate Entry',
        message: 'Client with this ID already exists'
      });
    }
    res.status(500).json({ 
      error: 'Server Error',
      message: err.message
    });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const { search, name, barangay, status } = req.query;
    const matchQuery = {};

    // Handle status filter
    if (status && status !== 'all') {
      // Ensure status is treated as a number for matching, as it's stored numerically
      const numericStatus = parseInt(status, 10);
      if (!isNaN(numericStatus)) {
        matchQuery.status = numericStatus;
      }
    }
// status = 1;
    // Filter by barangay (optional)
    if (barangay) {
      matchQuery.barangay = barangay.toString().padStart(2, '0');
    }

    // General search across multiple fields
    if (search) {
      const searchTerms = search.trim().split(/\s+/);
      matchQuery.$and = searchTerms.map(term => {
        const regex = new RegExp(term, 'i');
        return {
          $or: [
            { name: regex },
            { clientId: regex },
            { contact: regex },
            { meterNumber: regex }
          ]
        };
      });
    }
    // Specific search by name
    if (name) {
      const nameTerms = name.trim().split(/\s+/);
      matchQuery.name = {
        $all: nameTerms.map(term => new RegExp(term, 'i'))
      };
    }
    // --- Build dynamic serviceRequestMatch pipeline
    const serviceRequestMatch = [
      {
        $match: {
          $expr: { $eq: ["$clientId", "$$clientId"] }
        }
      }
    ];

    // --- Main aggregation
    const result = await Client.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "servicerequests", // <-- collection name must match MongoDB
          let: { clientId: "$clientId" },
          pipeline: serviceRequestMatch,
          as: "serviceRequests"
        }
      }
      // Optional: Only return clients with at least one joined service request
      // { $match: { "joinedDocuments.0": { $exists: true } } }
    ]);
    res.json(result);
  } catch (err) {
    console.error("Error fetching clients:", err.message);
    res.status(500).json({ error: err.message });
  }
};
exports.getClientById = async (req, res) => {
   console.log(req.params.fullName, " is fetched by id");
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
  // beneficiaryController.getAllBeneficiaries

    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getClientByClientId = async (req, res) => {
  try {
    // 1. Get the clientId from URL params
    const clientId = req.params.clientId;
   
    // 2. Validate the input
    if (!clientId) {
      return res.status(400).json({ 
        success: false,
        message: 'Client ID is required' 
      });
    }
    // 3. Search by custom clientId field (not _id)
    const client = await Client.findOne({ clientId }); // This is the key fix
    
    if (!client) {
      return res.status(404).json({ 
        success: false,
        message: 'Client not found' 
      });
    }
     console.log(client.fullName, "is fetched by clientId");
    // 4. Return successful response
    res.status(200).json({
      success: true,
      data: client
    });

  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
exports.updateClient = async (req, res) => {
  console.log("Updating client with ID:", req.params.id);
  try {
    const Id = req.params.id;
    const { name, contact, meterNumber, barangay, sitio, status, classification, lastReadDate, lastReadValue, registerNote, balance, freeCubic, lessAmount } = req.body;
    // Create update object with only allowed fields
    console.log("Updating client with ID:", name, contact, meterNumber, barangay, sitio, status, classification, lastReadDate, lastReadValue, registerNote, balance, freeCubic, lessAmount);
    const updateFields = {};
    if (name !== undefined && name !== null) updateFields.name = name;
    if (contact !== undefined && contact !== null) updateFields.contact = contact;
    if (meterNumber !== undefined && meterNumber !== null) updateFields.meterNumber = meterNumber;
    if (barangay !== undefined && barangay !== null) updateFields.barangay = barangay;
    if (sitio !== undefined && sitio !== null) updateFields.sitio = sitio;
    if (status !== undefined && status !== null) updateFields.status = status;
    if (classification !== undefined && classification !== null) updateFields.classification = classification;
    if (lastReadDate !== undefined && lastReadDate !== null) updateFields.lastReadDate = lastReadDate;
    if (lastReadValue !== undefined && lastReadValue !== null) updateFields.lastReadValue = lastReadValue;
    if (registerNote !== undefined && registerNote !== null) updateFields.registerNote = registerNote;
    if (freeCubic !== undefined && freeCubic !== null) updateFields.freeCubic = freeCubic;
    if (lessAmount !== undefined && lessAmount !== null) updateFields.lessAmount = lessAmount;
    // Update only the specified fields
    console.log("Updating client with fields:", updateFields.name);
        const updatedClient = await Client.findByIdAndUpdate(
      Id,
      { $set: updateFields },
      { 
        new: true,
        runValidators: true // Ensures updated fields pass schema validation
      }
    );
    if (!updatedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(updatedClient);
  } catch (err) {
    console.log("Error updating client:", err.message);
    res.status(400).json({ 
      error: 'Update failed',
      details: err.message
    });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const clientId = req.params.clientId;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required.'
      });
    }

    const [billing, payment, miscFee] = await Promise.all([
      Billing.findOne({ clientId }),
      Payment.findOne({ clientId }),
      MiscellaneousFee.findOne({ clientId })
    ]);

    if (billing || payment || miscFee) {
      return res.status(400).json({
        success: false,
        message: 'Client cannot be deleted because related billing, payment, or fee records exist.'
      });
    }
    const client = await Client.findOne({ clientId });
    const deletedClient = await Client.findByIdAndDelete(client._id);

    if (!deletedClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Client deleted successfully.'
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while deleting the client.',
      error: err.message
    });
  }
};


