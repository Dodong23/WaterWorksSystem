const Billing = require('../models/Billing');
const Client = require('../models/Client');
const BillingConfig = require('../models/BillingConfig');
const Payment = require('../models/Payment');
const PDFDocument = require('pdfkit');
const { getNextClientId } = require('../services/clientService');

const classificationMap = {
    1: 'residential',
    2: 'institutional',
    3: 'commercial',
    4: 'industrial',
};

exports.getBillingConfig = async (req, res) => {
    try {
        const config = await BillingConfig.findOne({ name: 'default' });
        if (!config) {
            // If no config exists, create a default one
            const defaultConfig = new BillingConfig();
            await defaultConfig.save();
            return res.status(200).json({ success: true, data: defaultConfig });
        }
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error('Get billing config error:', error);
        res.status(500).json({ success: false, message: 'Failed to get billing configuration' });
    }
};

exports.updateBillingConfig = async (req, res) => {
    try {
        const { rates, meterReader, contactNo } = req.body;
        if (!rates) {
            return res.status(400).json({ success: false, message: 'Rates object is required.' });
        }

        const fieldsToUpdate = {
            rates,
            meterReader,
            contactNo
        };

        const config = await BillingConfig.findOneAndUpdate(
            { name: 'default' },
            fieldsToUpdate,
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({ success: true, message: 'Billing configuration updated successfully.', data: config });
    } catch (error) {
        console.error('Update billing config error:', error);
        res.status(500).json({ success: false, message: 'Failed to update billing configuration' });
    }
};

/**
 * Helper to safely convert values to numbers
 */
function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Helper to sanitize and trim string inputs
 */
function sanitizeString(value, allowNull = false) {
  if (value === null || value === undefined) return allowNull ? null : '';
  const str = String(value).trim();
  return str === '' && allowNull ? null : str;
}

/**
 * Parse various date string formats into a Date object or null.
 */
function parseDateString(val) {
  if (!val) return null;
  // If already a Date
  if (val instanceof Date && !isNaN(val)) return val;
  const s = String(val).trim();
  if (!s) return null;

  // Try ISO / direct parse
  const iso = new Date(s);
  if (!isNaN(iso)) return iso;

  // YYYY-MM or YYYY-MM-DD
  const m = /^\s*(\d{4})-(\d{1,2})(?:-(\d{1,2}))?\s*$/.exec(s);
  if (m) {
    const yyyy = m[1];
    const mm = m[2].padStart(2, '0');
    const dd = m[3] ? m[3].padStart(2, '0') : '01';
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    if (!isNaN(d)) return d;
  }

  // US format M/D/YYYY or MM/DD/YYYY
  const us = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(s);
  if (us) {
    const mm = us[1].padStart(2, '0');
    const dd = us[2].padStart(2, '0');
    const yyyy = us[3];
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    if (!isNaN(d)) return d;
  }

  // D-M-YYYY or DD-MM-YYYY
  const alt = /^\s*(\d{1,2})-(\d{1,2})-(\d{4})\s*$/.exec(s);
  if (alt) {
    const dd = alt[1].padStart(2, '0');
    const mm = alt[2].padStart(2, '0');
    const yyyy = alt[3];
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    if (!isNaN(d)) return d;
  }

  return null;
}

/**
 * Validate billing payload against schema requirements
 */
function validateBillingPayload(payload, isUpdate = false) {
  const errors = [];

  if (!isUpdate) {
    if (!sanitizeString(payload.billingID)) {
      errors.push('billingID is required and must be non-empty');
    }
    if (!sanitizeString(payload.clientId)) {
      errors.push('clientId is required and must be non-empty');
    }
    if (!sanitizeString(payload.name)) {
      errors.push('name is required and must be non-empty');
    }
    if (!sanitizeString(payload.meterNum)) {
      errors.push('meterNum is required and must be non-empty');
    }
    // Accept either legacy `sortableDate` string or new `periodStart` Date
    if (!sanitizeString(payload.sortableDate)) {
      errors.push('sortableDate (or periodStart) is required and must be non-empty');
    }
  }

  // Reading validations
  if (payload.currentReading !== undefined && payload.currentReading < 0) {
    errors.push('currentReading cannot be negative');
  }

  if (payload.previousReading !== undefined && payload.previousReading < 0) {
    errors.push('previousReading cannot be negative');
  }

  // if (payload.currentReading !== undefined && payload.previousReading !== undefined) {
  //   if (payload.currentReading < payload.previousReading) {
  //     errors.push('currentReading cannot be less than previousReading');
  //   }
  // }

  // String length validations
  if (payload.name && payload.name.length > 200) {
    errors.push('name must not exceed 200 characters');
  }

  if (payload.meterNum && payload.meterNum.length > 100) {
    errors.push('meterNum must not exceed 100 characters');
  }

  return errors;
}

/**
 * Calculate derived billing fields based on readings and rates
 */
function getNext20thFromYYYYMM(yyyyMM) {
    const [year, month] = yyyyMM.split('-').map(Number);
    return new Date(year, month, 20);
}

function calculateBillingAmounts(payload, billingConfig) {
  const result = { ...payload };
  const classificationName = classificationMap[result.classification] || 'residential';
  const rateInfo = (billingConfig && billingConfig.rates) ? billingConfig.rates[classificationName] : null;

  // If rateInfo is missing, use existing values on the payload or default to 0.
  result.minimum = result.minimum > 0 ? result.minimum : (rateInfo ? rateInfo.minimum : 0);
  result.perCubic = result.perCubic > 0 ? result.perCubic : (rateInfo ? rateInfo.perCubic : 0);
  
  // Always recalculate consumption from readings
  result.consumption = Math.max(0, toNumber(result.currentReading) - toNumber(result.previousReading));

  // Always recalculate current billing amount
  const chargeableCubic = Math.max(0, result.consumption - toNumber(result.freeCubic));
  const computedAmount = toNumber(result.perCubic) * chargeableCubic;
  
  // Amount is the sum of the minimum charge plus the charge for consumption beyond the free allowance.
  result.currentBilling = computedAmount + toNumber(result.minimum);

  // Apply discount
  if (result.discount && result.discount > 0) {
    result.currentBilling = Math.max(0, result.currentBilling - toNumber(result.discount));
  }

  // Apply lessAmount as a deduction from the current bill
  if (result.lessAmount && result.lessAmount > 0) {
    result.currentBilling = Math.max(0, result.currentBilling);
  }
  result.readDate = payload.readDate;
  result.isRead = result.consumption > 0? 1 : result.isRead;
  
  // Always recalculate remaining balance
  result.remainingBalance = Math.max(0, result.currentBilling - toNumber(result.paidAmount));
  return result;
}

/**
 * Prepare and sanitize billing data for database operations
 */
function prepareBillingData(input, isUpdate = false) {
  const payload = {};

  // String fields with trimming
  const stringFields = [
    'billingID', 'clientId', 'name', 'meterNum', 'contact', 'area',
    'sortableDate', 'prevReadDate', 'readDate', 'defaultBillingDate', 'note'
  ];

  stringFields.forEach(field => {
    if (input[field] !== undefined) {
      const allowNull = ['contact', 'area', 'prevReadDate', 'readDate', 'defaultBillingDate', 'note'].includes(field);
      const value = sanitizeString(input[field], allowNull);
      if (value !== null && !(isUpdate && value === '')) {
        payload[field] = value;
      }
    }
  });

  // Parse legacy string date fields into new Date fields when provided
  if (input.sortableDate !== undefined) {
    const d = parseDateString(input.sortableDate);
    if (d) payload.periodStart = d;
  }
  if (input.prevReadDate !== undefined) {
    const d = parseDateString(input.prevReadDate);
    if (d) payload.prevReadAt = d;
  }
  if (input.readDate !== undefined) {
    const d = parseDateString(input.readDate);
    if (d) payload.readAt = d;
  }
  if (input.defaultBillingDate !== undefined) {
    const d = parseDateString(input.defaultBillingDate);
    if (d) payload.billingDate = d;
  }
  // Numeric fields
  const numericFields = [
    'classification', 'previousReading', 'currentReading', 'consumption',
    'freeCubic', 'lessAmount', 'minimum', 'perCubic', 'paidAmount',
    'remainingBalance', 'currentBilling', 'discount', 'isRead'
  ];

  numericFields.forEach(field => {
    if (input[field] !== undefined) {
      payload[field] = toNumber(input[field]);
    }
  });

  return payload;
}

async function getPreviousBillingTotal(clientId, currentSortableDate) {
  const result = await Billing.aggregate([
    {
      $match: {
        clientId: clientId,
        sortableDate: { $lt: currentSortableDate } // BEFORE current billing
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$remainingBalance" } // or "$amount"
      }
    }
  ]);

  return result.length ? result[0].totalAmount : 0;
}


/**
 * GET /api/billings - Get all billings with filtering and pagination
 */
exports.getAllBillings = async (req, res) => {
  try {
    const { 
      clientId, 
      sortableDate, 
      billingID, 
      isRead, 
      limit = 1000,
      page = 1 
    } = req.query;

    const query = {};

    // Build query filters
    if (clientId) query.clientId = sanitizeString(clientId);
    if (sortableDate) {
      const parsed = parseDateString(sortableDate);
      if (parsed) {
          const year = parsed.getUTCFullYear();
          const month = parsed.getUTCMonth();
          const startDate = new Date(Date.UTC(year, month, 1));
          const endDate = new Date(Date.UTC(year, month + 1, 1));
  
          query.$or = [
              {
                  periodStart: {
                      $gte: startDate,
                      $lt: endDate,
                  },
              },
              {
                  sortableDate: sanitizeString(sortableDate),
              },
          ];
      } else {
          query.sortableDate = sanitizeString(sortableDate);
      }
    }
    if (billingID) query.billingID = sanitizeString(billingID);
    if (isRead !== undefined) query.isRead = toNumber(isRead);

    // Pagination and limits
    const validatedLimit = Math.min(1000, Math.max(1, toNumber(limit, 1000)));
    const validatedPage = Math.max(1, toNumber(page, 1));
    const skip = (validatedPage - 1) * validatedLimit;

    const [billings, totalCount] = await Promise.all([
      Billing.find(query)
        .sort({ periodStart: -1, createdAt: -1 })
        .skip(skip)
        .limit(validatedLimit)
        .lean(),
      Billing.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: billings.length,
      total: totalCount,
      page: validatedPage,
      pages: Math.ceil(totalCount / validatedLimit),
      data: billings
    });

  } catch (error) {
    console.error('Get all billings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * GET /api/billings/client/:clientId - Get billings by client ID
 */
exports.getBillingsByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { limit = 100, page = 1 } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    const sanitizedClientId = sanitizeString(clientId);
    const validatedLimit = Math.min(500, Math.max(1, toNumber(limit, 100)));
    const validatedPage = Math.max(1, toNumber(page, 1));
    const skip = (validatedPage - 1) * validatedLimit;

    const [billings, totalCount] = await Promise.all([
      Billing.find({ clientId: sanitizedClientId })
        .sort({ isRead: 1, periodStart: -1, createdAt: -1 })
        .skip(skip)
        .limit(validatedLimit)
        .lean(),
      Billing.countDocuments({ clientId: sanitizedClientId })
    ]);
     
    res.status(200).json({
      success: true,
      clientId: sanitizedClientId,
      count: billings.length,
      total: totalCount,
      page: validatedPage,
      pages: Math.ceil(totalCount / validatedLimit),
      data: billings,
    });

  } catch (error) {
    console.error('Get billings by client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client billings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * GET /api/billings/:id - Get single billing by MongoDB ID
 */
exports.getBillingById = async (req, res) => {
  try {
    const { id } = req.params;

    const billing = await Billing.findById(id).lean();

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Billing record not found'
      });
    }
    billing.prevBal = await getPreviousBillingTotal(billing.clientId, billing.sortableDate);
    res.status(200).json({
      success: true,
      data: billing
    });

  } catch (error) {
    console.error('Get billing by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid billing ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * GET /api/billings/billingID/:billingID - Get billing by custom billingID
 */
exports.getBillingByBillingId = async (req, res) => {
  try {
    const { billingID } = req.params;

    if (!billingID) {
      return res.status(400).json({
        success: false,
        message: 'Billing ID is required'
      });
    }

    const sanitizedBillingID = sanitizeString(billingID);
    const billing = await Billing.findOne({ billingID: sanitizedBillingID }).lean();

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Billing record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: billing
    });

  } catch (error) {
    console.error('Get billing by billingID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * POST /api/billings - Create new billing record
 */
exports.createBilling = async (req, res) => {
  try {
    const billingConfig = await BillingConfig.findOne({ name: 'default' });
    if (!billingConfig) {
        return res.status(500).json({ success: false, message: 'Billing configuration not found.' });
    }

    let payload = prepareBillingData(req.body);
    
    // Validate required fields
    const validationErrors = validateBillingPayload(payload);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Calculate derived billing amounts
    payload = calculateBillingAmounts(payload, billingConfig);

    const billing = new Billing(payload);
    await billing.save();

    res.status(201).json({
      success: true,
      message: 'Billing created successfully',
      data: billing.toObject()
    });

  } catch (error) {
    console.error('Create billing error:', error);

    // Handle duplicate billingID
    if (error.code === 11000 && error.keyPattern?.billingID) {
      return res.status(409).json({
        success: false,
        message: 'Billing ID already exists',
        billingID: req.body.billingID
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create billing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * PUT /api/billings/:id - Update existing billing record
 */
exports.updateBilling = async (req, res) => {
    try {
    const { id } = req.params;
    
    // Check if billing exists
    const existingBilling = await Billing.findById(id);
    existingBilling.currentBilling = 0;
    const paidAmount = existingBilling.paidAmount;
    if (existingBilling.sortableDate === "2025-12") {
    return res.status(200).json({
      success: true,
      message: 'Unable to update billing! December 2025 is serve as the starting balance.'
    })
    }
    if (paidAmount > 0) {
    return res.status(200).json({
      success: true,
      message: 'Unable to update billing! Payments is already added.'
    })
    }
    if (!existingBilling) {
      return res.status(404).json({
        success: false,
        message: 'Billing record not found'
      });
    }

    let updates = prepareBillingData(req.body, true);
    
    // Prevent changing unique identifiers in updates
    delete updates.billingID;

    // Validate updates against existing data
    const mergedData = { ...existingBilling.toObject(), ...updates };
    const validationErrors = validateBillingPayload(mergedData, true);
    
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Recalculate amounts if readings or rates changed
    const needsRecalculation = 
      updates.currentReading !== undefined ||
      updates.previousReading !== undefined ||
      updates.freeCubic !== undefined ||
      updates.perCubic !== undefined ||
      updates.minimum !== undefined ||
      updates.discount !== undefined;

    if (needsRecalculation) {
        const billingConfig = await BillingConfig.findOne({ name: 'default' });
        if (!billingConfig) {
            return res.status(500).json({ success: false, message: 'Billing configuration not found.' });
        }
      updates = calculateBillingAmounts(mergedData, billingConfig);
    }

    const updatedBilling = await Billing.findByIdAndUpdate(
      id, 
      updates, 
      { 
        new: true, 
        runValidators: true,
        lean: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Billing updated successfully',
      data: updatedBilling
    });
  } catch (error) {
    console.error('Update billing error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
      if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid billing ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update billing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
 }
};
// update via API call

exports.updateViaAPI = async (req, res) => {
  console.log('Reading via API is called')
  try {
    const payload = req.body;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON payload'
      });
    }

    const results = [];
    const billingConfig = await BillingConfig.findOne({ name: 'default' });

    if (!billingConfig) {
      return res.status(500).json({
        success: false,
        message: 'Billing configuration not found'
      });
    }

    for (const key of Object.keys(payload)) {
      const entry = payload[key];
console.log("Updating reading for", entry.AccNum)
      try {
        const existingBilling = await Billing.findOne({
          clientId: entry.AccNum,
          sortableDate: entry.SortableDate,
          isRead: 0
        });

        if (!existingBilling) {
          results.push({
            clientId: entry.AccNum,
            status: 'skipped',
            reason: 'Billing record not found'
          });
          continue;
        }

        // ❌ December 2025 lock
        if (existingBilling.sortableDate === '2025-12') {
          results.push({
            getNextClientId: entry.AccNum,
            status: 'skipped',
            reason: 'December 2025 is starting balance'
          });
          continue;
        }

        // ❌ Already paid
        if (existingBilling.paidAmount > 0) {
          results.push({
            accountNo: entry.AccNum,
            status: 'skipped',
            reason: 'Payment already added'
          });
          continue;
        }

        // Map JSON → billing fields
        const [startDate, endDate] = dateRange.split(' - ');
        let updates = prepareBillingData({
          previousReading: Number(entry.PrevReading),
          currentReading: Number(entry.CurReading),
          prevReadDate: startDate,
          readDate: endDate
        }, true);

        delete updates.billingID;

        const mergedData = {
          ...existingBilling.toObject(),
          ...updates
        };

        // const validationErrors = validateBillingPayload(mergedData, true);
        // if (validationErrors.length > 0) {
        //   results.push({
        //     accountNo: entry.AccNum,
        //     status: 'failed',
        //     errors: validationErrors
        //   });
        //   continue;
        // }

        // Recalculate amounts
        updates = calculateBillingAmounts(mergedData, billingConfig);

        await Billing.findByIdAndUpdate(
          existingBilling._id,
          updates,
          { runValidators: true }
        );

        results.push({
          clientId: entry.AccNum,
          status: 'updated'
        });

      } catch (innerErr) {
        results.push({
          accountNo: entry.AccNum,
          status: 'error',
          error: innerErr.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk billing update completed',
      summary: {
        total: Object.keys(payload).length,
        updated: results.filter(r => r.status === 'updated').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        failed: results.filter(r => r.status === 'failed').length
      },
      results
    });
  console.log("Billing updated successfully")
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk update',
      error: process.env.NODE_ENV === 'development'
        ? error.message
        : 'Internal server error'
    });
  }
};


/**
 * DELETE /api/billings/:id - Delete billing record
 */
exports.deleteBilling = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBilling = await Billing.findByIdAndDelete(id).lean();

    if (!deletedBilling) {
      return res.status(404).json({
        success: false,
        message: 'Billing record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Billing deleted successfully',
      data: {
        billingID: deletedBilling.billingID,
        clientId: deletedBilling.clientId,
        name: deletedBilling.name
      }
    });

  } catch (error) {
    console.error('Delete billing error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid billing ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete billing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * GET /api/billings/client/:clientId/unpaid - Get unpaid billings for client
 */
exports.getUnpaidBillings = async (req, res) => {
  console.log("fetching unpaid billings for: ", req.params.clientId)
  try {
    const { clientId } = req.params;
    const { limit = 50 } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    const sanitizedClientId = sanitizeString(clientId);
    const validatedLimit = Math.min(100, Math.max(1, toNumber(limit, 50)));

    const billings = await Billing.find({
  clientId: sanitizedClientId,
  remainingBalance: { $ne: 0, $exists: true },
  isRead: 1
})
    .sort({ periodStart: -1, createdAt: -1 })
    .limit(validatedLimit)
    .lean();

    res.status(200).json(billings);

  } catch (error) {
    console.error('Get unpaid billings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unpaid billings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * POST /api/billings/:id/payment - Add payment to billing record
 */
exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, paymentDate, note } = req.body;

    const payment = toNumber(paidAmount, 0);

    if (payment <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    const billing = await Billing.findById(id);
    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Billing record not found'
      });
    }

    // Update payment details
    const newPaidAmount = (billing.paidAmount || 0) + payment;
    const newRemainingBalance = Math.max(0, (billing.currentBilling || 0) - newPaidAmount);

    const updates = {
      paidAmount: newPaidAmount,
      remainingBalance: newRemainingBalance
    };

    // Update payment date if provided
    if (paymentDate) {
      updates.paymentDate = sanitizeString(paymentDate, true);
    }

    // Update note if provided
    if (note !== undefined) {
      updates.note = sanitizeString(note, true);
    }

    // Mark as read if fully paid
    if (newRemainingBalance <= 0) {
      updates.isRead = 1;
    }

    const updatedBilling = await Billing.findByIdAndUpdate(
      id,
      updates,
      { new: true, lean: true }
    );

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: updatedBilling,
      payment: {
        amount: payment,
        previousBalance: billing.remainingBalance,
        newBalance: newRemainingBalance
      }
    });

  } catch (error) {
    console.error('Add payment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid billing ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * POST /api/billings/generate-billing - Generate billing for a specific month
 */
exports.generateBilling = async (req, res) => {
    try {
        const { month } = req.body; // Expecting YYYY-MM format
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ success: false, message: 'Invalid month format. Please use YYYY-MM.' });
        }

        const billingConfig = await BillingConfig.findOne({ name: 'default' });
        if (!billingConfig) {
            return res.status(500).json({ success: false, message: 'Billing configuration not found.' });
        }

        const [year, monthNum] = month.split('-').map(Number);
        const periodStart = new Date(Date.UTC(year, monthNum - 1, 1));
        
        const clients = await Client.find({ status: 3 });

        let generatedCount = 0;
        let skippedCount = 0;

        for (const client of clients) {
            const billingID = `${client.clientId}-${month}`;

            const existingBilling = await Billing.findOne({ billingID: billingID });
            if (existingBilling) {
                skippedCount++;
                continue;
            }

            const lastBilling = await Billing.findOne({ clientId: client.clientId }).sort({ sortableDate: -1 });

            const previousReading = lastBilling? lastBilling.currentReading : client.lastReadValue;
            const PrevReadDate = lastBilling? lastBilling.readDate : client.lastReadDate;

            const newBillingData = {
                billingID: billingID,
                clientId: client.clientId,
                name: client.name,
                meterNum: client.meterNumber,
                contact: client.contact,
                area: client.barangay,
                classification: client.classification,
                sortableDate: month,
                prevReadDate: PrevReadDate,
                freeCubic: client.freeCubic,
                lessAmount: client.lessAmount,
                minimum: client.minimum,
                perCubic: client.perCubic,
                paidAmount: 0,
                remainingBalance: 0,
                currentBilling: 224,
                isRea: 1,
                discount: 0,
                previousReading: previousReading,
                defaultBillingDate: getNext20thFromYYYYMM(month),
                currentReading: null, // Set currentReading to previousReading initially
            };

            // const calculatedBilling = calculateBillingAmounts(newBillingData, billingConfig);

            const newBilling = new Billing(newBillingData);

            await newBilling.save();
            generatedCount++;
        }

        res.status(201).json({
            success: true,
            message: `Billing generation for ${month} completed.`,
            generated: generatedCount,
            skipped: skippedCount
        });

    } catch (error) {
        console.error('Generate billing error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate billing',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.downloadForReading = async (req, res) => {
    try {
        // 1. Find the latest billing month
        const latestBilling = await Billing.findOne().sort({ periodStart: -1 }).lean();
        if (!latestBilling) {
            return res.status(404).json({ success: false, message: 'No billing records found.' });
        }
        const latestMonth = latestBilling.sortableDate;
        const latestPeriodStart = latestBilling.periodStart;

        // 2. Get all billing records for that month
        const billingsForMonth = await Billing.find({ sortableDate: latestMonth }).lean();
        const clientIds = billingsForMonth.map(b => b.clientId);

        // 3. Get all clients for these billings
        const clients = await Client.find({ clientId: { $in: clientIds } }).lean();
        const clientsMap = new Map(clients.map(c => [c.clientId, c]));

        // 4. Get all forwarded balances efficiently using aggregation
        const forwardedBalances = await Billing.aggregate([
            { $match: { 
                clientId: { $in: clientIds },
                periodStart: { $lt: latestPeriodStart }
            }},
            { $group: {
                _id: '$clientId',
                totalRemaining: { $sum: '$remainingBalance' }
            }}
        ]);
        const forwardedMap = new Map(forwardedBalances.map(item => [item._id, item.totalRemaining]));

        const resultData = {};
        const classificationWordMap = { 0: 'Residential', 1: 'Commercial', 2: 'Institutional', 3: 'Industrial' };

        for (const billing of billingsForMonth) {
            const client = clientsMap.get(billing.clientId);
            if (!client) continue;

            const forwardedBalance = forwardedMap.get(billing.clientId) || 0;

            const accountData = {
                Status: client.status === 3 ? 'Normal' : 'Inactive',
                Address: client.barangay || 'N/A',
                AccNum: client.clientId,
                MeterNum: client.meterNumber || 'N/A',
                Name: `${client.lastName}, ${client.firstName}`,
                Contact: client.contactNumber || 'N/A',
                ClassiWord: classificationWordMap[client.classification] || 'Residential'
            };

            const billingData = {
                PrevReadingDate: billing.prevReadAt ? billing.prevReadAt.toISOString().split('T')[0].replace(/-/g, '/') : (billing.prevReadDate || 'N/A'),
                LessAmount: billing.lessAmount || 0,
                BillingMonth: new Date(billing.periodStart).toLocaleString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '-'),
                CType: 0, // Per user example
                Classification: client.classification,
                Forwarded: forwardedBalance,
                AccNum: billing.clientId,
                Billed: billing.currentBilling || 0,
                FreeCubic: billing.freeCubic || 0,
                SortableDate: billing.sortableDate,
                CurReading: billing.currentReading || 0,
            };

            resultData[billing.clientId] = {
                AccountData: accountData,
                BillingData: billingData
            };
        }

        res.status(200).json({ success: true, latestMonth: latestMonth, data: resultData });

    } catch (error) {
        console.error('Error downloading data for reading:', error);
        res.status(500).json({ success: false, message: 'An error occurred while preparing download data.' });
    }
};

exports.getStatementData = async (req, res) => {
    try {
        const { clientId, year } = req.params;

        if (!clientId || !year) {
            return res.status(400).json({
                success: false,
                message: 'Client ID and year are required'
            });
        }

        const sanitizedClientId = sanitizeString(clientId);
        const validatedYear = parseInt(year, 10);

        if (isNaN(validatedYear)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid year format'
            });
        }

        const startDate = new Date(Date.UTC(validatedYear, 0, 1));
        const endDate = new Date(Date.UTC(validatedYear + 1, 0, 1));

        const [billings, payments] = await Promise.all([
            Billing.find({
                clientId: sanitizedClientId,
                $or: [
                    {
                        periodStart: {
                            $gte: startDate,
                            $lt: endDate,
                        },
                    },
                    {
                        sortableDate: { $regex: `^${validatedYear}-` }
                    }
                ]
            }).sort({ periodStart: -1 }).lean(),
            Payment.find({
                clientId: sanitizedClientId,
                paymentDate: {
                    $gte: startDate,
                    $lt: endDate,
                },
            }).sort({ paymentDate: -1 }).lean(),
        ]);

        res.status(200).json({
            success: true,
            data: {
                billings,
                payments,
            },
        });

    } catch (error) {
        console.error('Get statement data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statement data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * GET /api/billings/statement-data - Get statement data (JSON) for a client for a specific year
 */
exports.getStatementDataJson = async (req, res) => {
  console.log("Fetching statement data JSON for:", req.query);

  try {
    const { clientId, year } = req.query;

    if (!clientId || !year) {
      return res.status(400).json({
        success: false,
        message: 'Client ID and year are required'
      });
    }

    const sanitizedClientId = sanitizeString(clientId);
    const validatedYear = parseInt(year, 10);

    if (isNaN(validatedYear)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year format'
      });
    }

    const startDate = new Date(Date.UTC(validatedYear, 0, 1));
    const endDate = new Date(Date.UTC(validatedYear + 1, 0, 1));

    const [
      client,
      yearBillings,
      yearPayments,
      previousBillings
    ] = await Promise.all([
      Client.findOne({ clientId: sanitizedClientId }).lean(),

      // Billings within selected year
      Billing.find({
        clientId: sanitizedClientId,
        readDate: { $regex: `^${validatedYear}/` }
      }).lean(),

      // Payments within selected year
      Payment.find({
        clientId: sanitizedClientId,
        status: 'paid',
        type: 'billings',
        paymentDate: { $gte: startDate, $lt: endDate }
      }).lean(),

      // Forwarded balance from previous year
      Billing.aggregate([
        {
          $match: {
            clientId: sanitizedClientId,
            readDate: { $lt: `${validatedYear}/1/1` }
          }
        },
        {
          $group: {
            _id: null,
            totalRemainingBalance: {
              $sum: '$remainingBalance'
            }
          }
        }
      ])
    ]);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const balanceForwarded = previousBillings[0]?.totalRemainingBalance || 0;

    /**
     * Normalize billings
     */
    const billingEntries = yearBillings.map(billing => ({
      type: 'billing',
      date: billing.readDate,
      sortDate: normalizeDate(billing.readDate),

      previousReading: billing.previousReading ?? null,
      presentReading: billing.currentReading ?? null,
      usage: billing.consumption ?? null,

      amount: billing.currentBilling ?? 0,
      discount: billing.discount ?? 0,

      reference: billing.billingNumber ?? null
    }));

    /**
     * Normalize payments and calculate previousPaymentTotal
     */
    let previousPaymentTotal = 0; // total across all payments
    const paymentEntries = yearPayments.map(payment => {
      // Sum allocations from previous year
      const prevTotal = Array.isArray(payment.allocation)
        ? payment.allocation
            .filter(a => isPreviousYearAllocation(a.code, validatedYear))
            .reduce((sum, a) => sum + (a.amount ?? 0) + (a.discount ?? 0), 0)
        : 0;

      previousPaymentTotal += prevTotal; // accumulate total

      return {
        type: 'payment',
        date: payment.paymentDate,
        sortDate: normalizeDate(payment.paymentDate),
        previousReading: null,
        presentReading: null,
        usage: null,
        amount: payment.totalAmount ?? 0,
        discount: Array.isArray(payment.allocation)
          ? payment.allocation.reduce((sum, a) => sum + (a.discount ?? 0), 0)
          : 0,
        previousPaymentTotal: prevTotal, // per payment
        reference: payment.orNumber ?? null
      };
    });

    /**
     * Merge & sort chronologically
     */
    const statementItems = [...billingEntries, ...paymentEntries]
      .filter(item => item.sortDate)
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ sortDate, ...rest }) => rest); // remove helper field

    res.status(200).json({
      success: true,
      data: {
        client,
        year: validatedYear,
        previousPaymentTotal, // total across all payments
        balanceForwarded,
        statementItems
      }
    });
  } catch (error) {
    console.error('Get statement data JSON error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch statement data (JSON)',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error'
    });
  }
};

/**
 * Date normalizer for SOA sorting
 */
function normalizeDate(dateValue) {
  if (!dateValue) return null;

  // Already a valid Date
  if (dateValue instanceof Date && !isNaN(dateValue)) {
    return dateValue;
  }

  // Handle string "YYYY/M/D" or "YYYY/MM/DD"
  if (typeof dateValue === 'string') {
    const parts = dateValue.trim().split('/');
    if (parts.length !== 3) return null;

    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);

    if (!y || !m || !d) return null;

    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}



/**
 * Check if allocation code belongs to previous year
 */
function isPreviousYearAllocation(code, currentYear) {
  const previousYear = currentYear - 1;
  const match = code?.match(/^M\d+-([0-9]{4})-\d{2}$/);
  return match ? Number(match[1]) === previousYear : false;
}


/**
 * GET /api/billings/statement-of-account - Generate Statement of Account PDF
 */
exports.generateStatementOfAccountPdf = async (req, res) => {
  console.log("Generating Statement of Account PDF for:", req.query);
    try {
        const { clientId, year } = req.query;

        if (!clientId || !year) {
            return res.status(400).json({
                success: false,
                message: 'Client ID and Year are required query parameters.'
            });
        }

        const sanitizedClientId = sanitizeString(clientId);
        const validatedYear = parseInt(year, 10);

        if (isNaN(validatedYear)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid year format. Year must be a number.'
            });
        }

        const client = await Client.findOne({ clientId: sanitizedClientId }).lean();
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found.'
            });
        }

        const startDate = new Date(Date.UTC(validatedYear, 0, 1)); // January 1st of the year
        const endDate = new Date(Date.UTC(validatedYear + 1, 0, 1)); // January 1st of next year

        const billings = await Billing.find({
            clientId: sanitizedClientId,
            periodStart: { $gte: startDate, $lt: endDate }
        }).sort({ periodStart: 1 }).lean(); // Sort by date ascending

        const payments = await Payment.find({
            clientId: sanitizedClientId,
            paymentDate: { $gte: startDate, $lt: endDate }
        }).sort({ paymentDate: 1 }).lean(); // Sort by date ascending

        // Calculate 1/2 Legal size: 8.5 inches / 2 = 4.25 inches wide, 13 inches tall
        // 1 inch = 72 points
        const pageWidth = 4.25 * 72; // 306 points
        const pageHeight = 13 * 72;  // 936 points

        const doc = new PDFDocument({
            size: [pageWidth, pageHeight],
            margins: {
                top: 36, // 0.5 inch
                bottom: 36,
                left: 18,  // 0.25 inch
                right: 18
            }
        });

        // Pipe the PDF to the response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Statement_of_Account_${clientId}_${year}.pdf"`);
        doc.pipe(res);

        // --- PDF Content Generation ---
        doc.fontSize(10).text('STATEMENT OF ACCOUNT', { align: 'center' });
        doc.fontSize(8).text(`For Year: ${validatedYear}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(7).text(`Client ID: ${client.clientId}`);
        doc.text(`Name: ${client.firstName} ${client.lastName}`);
        doc.text(`Address: ${client.barangay}, ${client.municipality}`);
        doc.text(`Contact: ${client.contactNumber || 'N/A'}`);
        doc.moveDown();

        // Table Headers
        const tableTop = doc.y;
        const col1X = doc.x;
        const col2X = col1X + 40; // Date
        const col3X = col2X + 60; // Description
        const col4X = col3X + 70; // Debit
        const col5X = col4X + 40; // Credit
        const col6X = col5X + 40; // Balance

        doc.fontSize(6)
           .text('Date', col2X, tableTop)
           .text('Description', col3X, tableTop)
           .text('Debit', col4X, tableTop, { width: 40, align: 'right' })
           .text('Credit', col5X, tableTop, { width: 40, align: 'right' })
           .text('Balance', col6X, tableTop, { width: 40, align: 'right' });
        doc.moveTo(col1X, tableTop + 10).lineTo(doc.page.width - doc.options.margins.right, tableTop + 10).stroke();
        doc.moveDown(0.5);

        let currentY = doc.y;
        let runningBalance = 0; // This would ideally be the forwarded balance from previous year

        // For simplicity, let's assume runningBalance starts at 0 or is fetched separately for the beginning of the year.
        // For a true "statement of account", you'd need the closing balance of the previous year.
        // For now, it starts from 0 for the given year.

        // Combine and sort all transactions
        const transactions = [];

        billings.forEach(b => {
            transactions.push({
                type: 'billing',
                date: b.periodStart || b.createdAt,
                description: `Billing for ${b.sortableDate || 'N/A'}`,
                amount: b.currentBilling || 0,
                id: b._id
            });
        });

        payments.forEach(p => {
            transactions.push({
                type: 'payment',
                date: p.paymentDate || p.createdAt,
                description: `Payment for OR No. ${p.orNumber || 'N/A'}`,
                amount: p.amount || 0,
                id: p._id
            });
        });

        transactions.sort((a, b) => a.date - b.date);

        transactions.forEach(t => {
            if (currentY + 15 > doc.page.height - doc.options.margins.bottom) {
                doc.addPage();
                doc.fontSize(6)
                   .text('Date', col2X, doc.y)
                   .text('Description', col3X, doc.y)
                   .text('Debit', col4X, doc.y, { width: 40, align: 'right' })
                   .text('Credit', col5X, doc.y, { width: 40, align: 'right' })
                   .text('Balance', col6X, doc.y, { width: 40, align: 'right' });
                doc.moveTo(col1X, doc.y + 10).lineTo(doc.page.width - doc.options.margins.right, doc.y + 10).stroke();
                doc.moveDown(0.5);
                currentY = doc.y;
            }

            const formattedDate = t.date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
            
            doc.fontSize(6).text(formattedDate, col2X, currentY);
            doc.text(t.description, col3X, currentY);

            if (t.type === 'billing') {
                runningBalance += t.amount;
                doc.text(t.amount.toFixed(2), col4X, currentY, { width: 40, align: 'right' });
                doc.text(runningBalance.toFixed(2), col6X, currentY, { width: 40, align: 'right' });
            } else { // type === 'payment'
                runningBalance -= t.amount;
                doc.text(t.amount.toFixed(2), col5X, currentY, { width: 40, align: 'right' });
                doc.text(runningBalance.toFixed(2), col6X, currentY, { width: 40, align: 'right' });
            }
            currentY = doc.y + doc.fontSize(); // Move y down by font size for next line
        });

        doc.moveDown();
        doc.fontSize(7).text(`Final Balance for ${validatedYear}: ${runningBalance.toFixed(2)}`, { align: 'right' });

        doc.end();

    } catch (error) {
        console.error('Generate Statement of Account PDF error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate Statement of Account PDF',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = exports;