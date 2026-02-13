const Miscellaneous = require('../models/MiscellaneousFee');
const Fee = require('../models/Fee');


/**
 * GET /api/misc-fees - Get all miscellaneous fees
 */
exports.getAllFees = async (req, res) => {
  try {
    const fees = await Miscellaneous.find({})
      .populate({
        path: 'clientId',
        select: 'firstName middleName lastName'
      })
      .sort({ dateCreated: -1, createdAt: -1 })
      .lean();

    res.status(200).json(fees);
  } catch (error) {
    console.error('Get all miscellaneous fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all miscellaneous fees',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * GET /api/misc-fees/client/:clientId/unpaid - Get unpaid miscellaneous fees for a client
 */
exports.getUnpaidFeesByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    const fees = await Miscellaneous.find({
      clientId: clientId,
      status: 'Unpaid'
    })
    .sort({ dateCreated: -1, createdAt: -1 })
    .lean();

    res.status(200).json(fees);

  } catch (error) {
    console.error('Get unpaid miscellaneous fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unpaid miscellaneous fees',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * GET /api/misc-fees/client/:clientId - Get all miscellaneous fees for a client
 */
exports.getFeesByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    const fees = await Miscellaneous.find({
      clientId: clientId
    })
    .sort({ dateCreated: -1, createdAt: -1 })
    .lean();

    res.status(200).json(fees);

  } catch (error) {
    console.error('Get miscellaneous fees by client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch miscellaneous fees for client',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


/**
 * POST /api/misc-fees - Create a new miscellaneous fee
 */
exports.createFee = async (req, res) => {
  console.log("Creating misc fee...");
  try {
    const {
      clientId,
      fee: feeId,
      amount,
      dateCreated,
      clientName,
      address,
      meterNumber
    } = req.body;

    if (!clientId || !feeId || !amount || !dateCreated) {
      return res.status(400).json({
        success: false,
        message: 'Client ID, Fee ID, amount, and date created are required'
      });
    }

    const feeDoc = await Fee.findById(feeId);
    if (!feeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Selected fee not found'
      });
    }

    // 🔒 Prevent duplicate same fee on same date
    const existingFee = await Miscellaneous.findOne({
      clientId,
      fee: feeId,
      dateCreated
    });

    if (existingFee) {
      return res.status(409).json({
        success: false,
        message: 'This miscellaneous fee already exists for the selected date'
      });
    }

    // 🔢 Generate miscId (per client)
    const lastFee = await Miscellaneous.findOne({ clientId })
      .sort({ createdAt: -1 })
      .select('miscId')
      .lean();

    let nextNumber = 1;

    if (lastFee?.miscId) {
      const lastNumber = Number(lastFee.miscId.split('-').pop());
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const miscId = `${clientId}-${String(nextNumber).padStart(3, '0')}`;

    const newFee = new Miscellaneous({
      miscId,
      clientId,
      fee: feeId,
      name: feeDoc.name,
      clientName,
      address,
      meterNumber,
      description: feeDoc.description,
      amount,
      dateCreated,
      responsibleOffice: feeDoc.accomplishingOffice
    });

    await newFee.save();

    const populatedFee = await Miscellaneous
      .findById(newFee._id)
      .populate('fee');

    res.status(201).json({
      success: true,
      message: 'Miscellaneous fee created successfully',
      data: populatedFee
    });

  } catch (error) {
    console.error('Create miscellaneous fee error:', error);

    // 🔁 Unique miscId collision safeguard
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate miscellaneous ID detected. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create miscellaneous fee',
      error: process.env.NODE_ENV === 'development'
        ? error.message
        : 'Internal server error'
    });
  }
};


/**
 * GET /api/misc-fees/:id - Get a miscellaneous fee by its ID
 */
exports.getFeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const fee = await Miscellaneous.findById(id);
        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee not found' });
        }
        res.status(200).json({ success: true, data: fee });
    } catch (error) {
        console.error('Get miscellaneous fee by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch miscellaneous fee',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * PUT /api/misc-fees/:id - Update a miscellaneous fee
 */
exports.updateFee = async (req, res) => {
    try {
        const { id } = req.params;
        // prevent fee and clientId from being updated
        const { fee, clientId, ...updates } = req.body;
        const updatedFee = await Miscellaneous.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('fee');
        if (!updatedFee) {
            return res.status(404).json({ success: false, message: 'Fee not found' });
        }
        res.status(200).json({ success: true, message: 'Fee updated successfully', data: updatedFee });
    } catch (error) {
        console.error('Update miscellaneous fee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update miscellaneous fee',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * PUT /api/misc-fees/:id/cancel - Cancel a miscellaneous fee
 */
exports.cancelFee = async (req, res) => {
    try {
        const { id } = req.params;
        const fee = await Miscellaneous.findByIdAndUpdate(id, { status: 'Cancelled' }, { new: true }).populate('fee');
        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee not found' });
        }
        res.status(200).json({ success: true, message: 'Fee cancelled successfully', data: fee });
    } catch (error) {
        console.error('Cancel miscellaneous fee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel miscellaneous fee',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * DELETE /api/misc-fees/:id - Delete a miscellaneous fee
 */
exports.deleteFee = async (req, res) => {
    try {
        const { id } = req.params;
        const fee = await Miscellaneous.findByIdAndDelete(id);
        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee not found' });
        }
        res.status(200).json({ success: true, message: 'Fee deleted successfully' });
    } catch (error) {
        console.error('Delete miscellaneous fee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete miscellaneous fee',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * PUT /api/misc-fees/:id/work-order - Update work order for a miscellaneous fee
 */
exports.updateWorkOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { workOrder } = req.body;

        const updatedFee = await Miscellaneous.findByIdAndUpdate(
            id,
            { $set: { workOrder: workOrder } },
            { new: true, runValidators: true }
        );

        if (!updatedFee) {
            return res.status(404).json({ success: false, message: 'Fee not found' });
        }

        res.status(200).json({ success: true, message: 'Work order updated successfully', data: updatedFee });
    } catch (error) {
        console.error('Update work order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update work order',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = exports;
