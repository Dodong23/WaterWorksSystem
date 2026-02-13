const Payment = require("../models/Payment"); // Adjust path as needed
const Billing = require("../models/Billing");
const MiscellaneousFee = require("../models/MiscellaneousFee");
const ORRegistry = require('../models/ORRegistry');
const mongoose = require("mongoose");
const api = require('../helpers/apiResponse');

const paymentController = {
  // Create a new payment (alias for addPayment)
  createPayment: async (req, res) => {
  console.log("createPayment called");

  try {
    const { clientId, payor, address, batch, orNumber, type, paymentDate, totalAmount, allocation, notes } = req.body;

    if (!Array.isArray(allocation)) {
      return api.error(res, 'Allocation must be an array', 400);
    }
   const newPayment = await Payment.findOne({ orNumber: orNumber, batch: batch });

        if (newPayment) {
            return api.error(res, 'OR number already issued.', 404);
        }

    // Validate sum of amounts
    const allocationsSum = allocation.reduce((sum, a) => sum + a.amount, 0);

    if (Math.abs(allocationsSum - totalAmount) > 0.01) {
      return api.error(res, 'Sum of allocation amounts must equal total amount', 400);
    }

    // Server-side validation of discounts and recalculation of total amount
    for (const alloc of allocation) {
      if (type === 'billing') {
        const billing = await Billing.findOne({ billingID: alloc.code });
        if (!billing || billing.remainingBalance <= 0) continue;

        // Ensure payment amount + discount doesn't exceed remaining balance
        const amountToCredit = (alloc.amount || 0) + (alloc.discount || 0);
        if (amountToCredit > billing.remainingBalance) {
          // The user is trying to pay/get credit for more than is owed.
          // Adjust the discount downwards. The amount paid is what the user tendered.
          const overCredit = amountToCredit - billing.remainingBalance;
          alloc.discount = Math.max(0, (alloc.discount || 0) - overCredit);
        }
      } 
      // else (type === 'misc') {
      //   const misc = await MiscellaneousFee.findOne({ miscId: alloc.code });
      //   if (!misc) continue;

      // }
    }

    // After correcting discounts, recalculate the total amount based on the sum of amounts paid for each allocation.
    const recalculatedTotalAmount = allocation.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);

    const payment = new Payment({
      clientId,
      payor,
      address,
      batch,
      orNumber: parseInt(String(orNumber || '').trim().replace(/\D/g, ''), 10), // Parse to Number
      type,
      paymentDate,
      totalAmount: recalculatedTotalAmount, // Use server-recalculated total
      allocation, // Use the corrected allocation
      notes: notes || ""
    });

    const savedPayment = await payment.save();

    // After saving payment, update related billing records based on allocation
    try {
      await updatePayablesFromAllocations(savedPayment.allocation, savedPayment.orNumber, type);
    } catch (updErr) {
      console.warn('Warning: failed to update payable records after payment:', updErr);
    }

    // Update OR Registry (link OR to this payment)
    try {
      await updateOrRegistryForPayment(savedPayment);
    } catch (orErr) {
      console.warn('Warning: failed to update OR registry after payment:', orErr);
    }
    return api.success(res, savedPayment, 'Payment created successfully', 201);
    
  } catch (error) {
    console.error("Payment error:", error);

    if (error.name === "ValidationError") {
      return api.error(res, 'Validation error', 400, Object.values(error.errors).map(err => err.message));
    }

    return api.error(res, `Error creating payment: ${error.message}`, 500);
  }
}
,

  // Add payment (alternative to createPayment with additional business logic)
  addPayment: async (req, res) => {
    try {
      const { clientId, orNumber, paymentDate, totalAmount, type, allocations, notes } = req.body;

      // Check if OR Number already exists
      const numericOrNumber = parseInt(String(orNumber || '').trim().replace(/\D/g, ''), 10);
      const existingPayment = await Payment.findOne({ orNumber: numericOrNumber });
      if (existingPayment) {
        return api.error(res, 'OR Number already exists. Please use a unique OR Number.', 400);
      }
// ...
      const payment = new Payment({
        // keep clientId if provided (schema doesn't enforce it currently)
        clientId,
        orNumber: numericOrNumber, // Use the parsed numeric OR number
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        totalAmount,
        allocation,
        notes: notes || ""
      });

      const savedPayment = await payment.save();

      // Populate client if possible
      await savedPayment.populate('clientId');

      // Update related billing records based on allocation
      try {
        await updatePayablesFromAllocations(savedPayment.allocation, savedPayment.orNumber, type);
      } catch (updErr) {
        console.warn('Warning: failed to update billing records after addPayment:', updErr);
      }

      // Update OR registry for this payment
      try {
        await updateOrRegistryForPayment(savedPayment);
      } catch (orErr) {
        console.warn('Warning: failed to update OR registry after addPayment:', orErr);
      }

      return api.success(res, savedPayment, 'Payment added successfully', 201);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return api.error(res, 'Validation error', 400, Object.values(error.errors).map(err => err.message));
      }
      
      if (error.code === 11000) {
        return api.error(res, 'OR Number already exists', 400);
      }

      return api.error(res, `Error adding payment: ${error.message}`, 500);
    }
  },

  // Get all payments with pagination and filtering
  getAllPayments: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        clientId,
        startDate,
        endDate,
        orNumber
      } = req.query;

      const filter = {};

      if (clientId) {
        filter.clientId = clientId;
      }

      if (orNumber) {
        filter.orNumber = parseInt(orNumber, 10);
      }

      if (startDate || endDate) {
        filter.paymentDate = {};
        if (startDate) filter.paymentDate.$gte = new Date(startDate);
        if (endDate) filter.paymentDate.$lte = new Date(endDate);
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { paymentDate: -1, createdAt: -1 },
        populate: [
          { path: 'clientId' }
        ]
      };

      const payments = await Payment.paginate(filter, options);
      return api.success(res, {
        items: payments.docs,
        pagination: {
          currentPage: payments.page,
          totalPages: payments.totalPages,
          totalItems: payments.totalDocs,
          hasNext: payments.hasNextPage,
          hasPrev: payments.hasPrevPage
        }
      });
    } catch (error) {
      return api.error(res, `Error fetching payments: ${error.message}`, 500);
    }
  },

  // Get single payment by ID
  getPaymentById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return api.error(res, 'Invalid payment ID', 400);
      }

      const payment = await Payment.findById(id).populate('clientId');

      if (!payment) return api.error(res, 'Payment not found', 404);

      return api.success(res, payment);
    } catch (error) {
      return api.error(res, `Error fetching payment: ${error.message}`, 500);
    }
  },

  // Get payments by client ID
  getPaymentsByClientId: async (req, res) => {
    try {
      const { clientId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { paymentDate: -1 },
        populate: [ { path: 'clientId' } ]
      };

      const payments = await Payment.paginate({ clientId }, options);
      return api.success(res, {
        items: payments.docs,
        pagination: {
          currentPage: payments.page,
          totalPages: payments.totalPages,
          totalItems: payments.totalDocs,
          hasNext: payments.hasNextPage,
          hasPrev: payments.hasPrevPage
        }
      });
    } catch ( error) {
      return api.error(res, `Error fetching client payments: ${error.message}`, 500);
    }
  },

  // Get payments by Batch Code
  getPaymentsByBatchCode: async (req, res) => {
    try {
      const { batchCode } = req.params;
      
      const payments = await Payment.find({ batch: batchCode })
        .populate('clientId') // Populate client details for address etc.
        .sort({ orNumber: 1 }); // Sort by OR number

      if (!payments) {
        return api.success(res, [], 'No payments found for this batch', 200);
      }

      return api.success(res, payments);

    } catch (error) {
      return api.error(res, `Error fetching payments by batch: ${error.message}`, 500);
    }
  },

  // Update payment
  updatePayment: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment ID"
        });
      }

      // If allocations/allocation or totalAmount are being updated, validate the sum
      const incomingAllocations = updateData.allocations || updateData.allocation;
      if (incomingAllocations && updateData.totalAmount) {
        const allocationsSum = incomingAllocations.reduce((sum, allocation) => sum + (Number(allocation.amount) || 0), 0);
        
        if (Math.abs(allocationsSum - updateData.totalAmount) > 0.01) {
          return res.status(400).json({
            success: false,
            message: "Sum of allocations must equal total amount"
          });
        }
      }

      const payment = await Payment.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate('clientId');

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }

      res.json({
        success: true,
        message: "Payment updated successfully",
        data: payment
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "OR Number already exists"
        });
      }

      res.status(500).json({
        success: false,
        message: "Error updating payment",
        error: error.message
      });
    }
  },

  // Delete payment
  deletePayment: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) return api.error(res, 'Invalid payment ID', 400);

      const payment = await Payment.findByIdAndDelete(id);
      if (!payment) return api.error(res, 'Payment not found', 404);

      return api.success(res, null, 'Payment deleted successfully');
    } catch (error) {
      return api.error(res, `Error deleting payment: ${error.message}`, 500);
    }
  },

  cancelPayment: async (req, res) => {
    console.log("request Body", req.body);
    console.log("request params", req.params);
    try {
        const { orNumber, batchCode, reason } = req.body;

        if (!orNumber || !batchCode) {
            return api.error(res, 'OR Number and Batch Code are required to cancel payment', 400);
        }

        const payment = await Payment.findOne({ orNumber: orNumber, batch: batchCode });

        if (!payment) {
            return api.error(res, 'Payment not found', 404);
        }

        if (payment.status === 'cancelled') {
            return api.error(res, 'Payment is already cancelled', 400);
        }

        // Reverse allocations
        for (const alloc of payment.allocation) {
          console.log("type during cancellation:", payment.type);
            if (payment.type === 'billings') {
                const billing = await Billing.findOne({ billingID: alloc.code });
                if (billing) {
                    const totalCreditToReverse = (alloc.amount || 0) + (alloc.discount || 0);
                    billing.paidAmount = (billing.paidAmount || 0) - totalCreditToReverse;
                    if (billing.paidAmount < 0) billing.paidAmount = 0;
                    
                    billing.remainingBalance = totalCreditToReverse + billing.remainingBalance;
                    if (billing.remainingBalance < 0) billing.remainingBalance = 0;

                    billing.ORnumber = ""; // Clear the OR number
                    
                    await billing.save();
                }
            } else if (payment.type === 'misc') {
                const fee = await MiscellaneousFee.findOne({ miscId: alloc.code });
                if (fee) {
                    fee.paidAmount = (fee.paidAmount || 0) - (alloc.amount || 0);
                    if (fee.paidAmount < 0) fee.paidAmount = 0;
                    fee.status = 'Unpaid';
                    await fee.save();
                }
            }
        }

        // Cancel OR in ORRegistry
        const orBatch = await ORRegistry.findOne({ 'orList.orNumber': orNumber, batchCode: batchCode });
        if (orBatch) {
            const fullOrString = `${orBatch.prefix}${payment.orNumber}`;
            orBatch.cancelOR(fullOrString, {
                cancelledBy: req.user ? req.user.fullName : 'Treasury',
                reason: reason || ''
            });
            await orBatch.save();
        }
        // Update payment status
        // payment.status = 'cancelled';
        // payment.cancellationReason = reason || 'Payment cancelled by user.';
        // payment.cancelledBy = req.user ? req.user.fullName : 'Treasury';
        // payment.cancelledAt = new Date();
        // await payment.save();

      const paymentToDelete = await Payment.findByIdAndDelete(payment._id);
      if (!paymentToDelete) return api.error(res, 'Payment not found', 404);

        return api.success(res, paymentToDelete, 'Payment cancelled successfully');

    } catch (error) {
        console.error("Error during payment cancellation:", error);
        return api.error(res, `Error cancelling payment: ${error.message}`, 500);
    }
  },

  // Search payments by OR Number
  searchByOrNumber: async (req, res) => {
    try {
      const { orNumber } = req.query;

      if (!orNumber) {
        return res.status(400).json({
          success: false,
          message: "OR Number is required for search"
        });
      }
      const numericOrNumber = parseInt(orNumber, 10);
      if (isNaN(numericOrNumber)) {
        return res.status(400).json({
          success: false,
          message: "OR Number must be a valid number"
        });
      }

      const payments = await Payment.find({ orNumber: numericOrNumber }).populate('clientId').sort({ paymentDate: -1 });
      return api.success(res, payments);
    } catch (error) {
      return api.error(res, `Error searching payments: ${error.message}`, 500);
    }
  },

  // Get payment statistics
  getPaymentStats: async (req, res) => {
    try {
      const { startDate, endDate, clientId } = req.query;

      const matchStage = {};

      if (clientId) {
        matchStage.clientId = clientId;
      }

      if (startDate || endDate) {
        matchStage.paymentDate = {};
        if (startDate) matchStage.paymentDate.$gte = new Date(startDate);
        if (endDate) matchStage.paymentDate.$lte = new Date(endDate);
      }

      const stats = await Payment.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
            averagePayment: { $avg: "$totalAmount" }
          }
        }
      ]);

      const result = stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        averagePayment: 0
      };

      return api.success(res, result);
    } catch (error) {
      return api.error(res, `Error fetching payment statistics: ${error.message}`, 500);
    }
  },

  getDashboardSummary: async (req, res) => {
    try {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const twelveMonthsAgo = new Date();
        const now = new Date();
        // start of next month (Mar 1, 2026 00:00:00)
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const kpiQuery = Payment.aggregate([
            { $match: { status: 'paid' } },
            {
                $facet: {
                    totalAllTime: [
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ],
                    totalThisYear: [
                        { $match: { paymentDate: { $gte: startOfYear } } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ],
                    totalThisMonth: [
                        { $match: { paymentDate: { $gte: startOfMonth } } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ],
                    totalToday: [
                        { $match: { paymentDate: { $gte: startOfToday } } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ]
                }
            }
        ]);

        const monthlyPaymentsQuery = Payment.aggregate([
            { $match: { status: 'paid', paymentDate: { $gte: twelveMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } },
                    total: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const dailyPaymentsQuery = Payment.aggregate([
             {
                $match: {
                status: 'paid',
                paymentDate: {
                $gte: startOfMonth,
                $lt: startOfNextMonth
                             }
                        }
                },
                {
                $group: {
                _id: {
                 $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$paymentDate"
                 }
                 },
                total: { $sum: "$totalAmount" },
               count: { $sum: 1 }
                }
               },
               { $sort: { _id: 1 } }
        ]);


        const recentPaymentsQuery = Payment.find({ status: 'paid' })
            .sort({ paymentDate: -1 })
            .limit(10)
            .select('orNumber payor paymentDate totalAmount');

        const [kpiResult, monthlyPayments, dailyPayments, recentPayments] = await Promise.all([
            kpiQuery,
            monthlyPaymentsQuery,
            dailyPaymentsQuery,
            recentPaymentsQuery
        ]);
        
        const kpis = {
            totalAllTime: kpiResult[0].totalAllTime[0]?.total || 0,
            totalThisYear: kpiResult[0].totalThisYear[0]?.total || 0,
            totalThisMonth: kpiResult[0].totalThisMonth[0]?.total || 0,
            totalToday: kpiResult[0].totalToday[0]?.total || 0,
        };

        res.json({
            kpis,
            monthlyPayments,
            dailyPayments,
            recentPayments
        });

    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        res.status(500).json({ message: "Error fetching dashboard summary" });
    }
  }
};

// Optional: Helper function to update billing status (you can implement this based on your business logic)
// const updateBillingStatus = async (allocations) => {
//   try {
//     for (const allocation of allocations) {
//       await mongoose.model("Billing").findByIdAndUpdate(
//         allocation.billingID,
//         { 
//           $inc: { paidAmount: allocation.amount },
//           status: 'paid' // or whatever your business logic requires
//         }
//       );
//     }
//   } catch (error) {
//     console.error("Error updating billing status:", error);
//     throw error;
//   }
// };

module.exports = paymentController;

async function updatePayablesFromAllocations(allocations, orNumber, type) {
console.log("updatePayablesFromAllocations called with allocations:", allocations, "and orNumber:", orNumber);
console.log("processing aloccation type:", type)
  if (!Array.isArray(allocations) || allocations.length === 0) return;



  for (const alloc of allocations) {

    try {

      const code = String(alloc.code || '').trim();

      if (!code) continue;



      if (type === 'billings') {
console.log("Processing billing allocation for code:", code);
        const billing = await Billing.findOne({ billingID: code }).exec();

        if (!billing) {

          console.warn(`Billing not found for allocation code: ${alloc.code}`);

          continue;

        }

        

        const cashPaid = Number(alloc.amount || 0);

        const discountApplied = Number(alloc.discount || 0);

        const totalCredit = cashPaid + discountApplied;



        const newPaidAmount = (billing.paidAmount || 0) + totalCredit;

        const newRemainingBalance = Math.max(0, (billing.currentBilling || 0) - newPaidAmount);



        const updates = {

          paidAmount: parseFloat(newPaidAmount.toFixed(2)),

          remainingBalance: parseFloat(newRemainingBalance.toFixed(2)),

          ORnumber: String(orNumber)

        };



        await Billing.findByIdAndUpdate(billing._id, { $set: updates });



      } else if (type === 'misc') {

        const fee = await MiscellaneousFee.findOne({ miscId: code }).exec();



        if (!fee) {

          console.warn(`Miscellaneous Fee not found for allocation code: ${code}`);

          continue;

        }



        const incAmount = Number(alloc.amount || 0);

        let newPaid = Number(fee.paidAmount || 0) + incAmount;

        newPaid = parseFloat(newPaid.toFixed(2));



        fee.paidAmount = newPaid;



        if (newPaid >= parseFloat(fee.amount.toFixed(2))) {

          fee.status = 'Paid';

        }



        await fee.save();

      }

    } catch (error) {

      console.error('Error updating payable for allocation', alloc, error);

    }

  }

}

// Helper: link OR registry entry to saved payment (mark OR as issued and add usage)
async function updateOrRegistryForPayment(savedPayment) {
  try {
    const numericOr = savedPayment.orNumber; // savedPayment.orNumber is now a Number
    if (isNaN(numericOr)) { // Check if it's a valid number
      console.warn('Invalid numeric OR in savedPayment:', savedPayment.orNumber);
      return;
    }

    // Find the batch containing this OR. Query with numeric orNumber and the batchCode from payment.
    const batch = await ORRegistry.findOne({ 'orList.orNumber': numericOr, batchCode: savedPayment.batch, isDeleted: { $ne: true } });
    if (!batch) {
      console.warn('OR registry batch not found for OR:', numericOr, 'Batch:', savedPayment.batch);
      return;
    }

    const orItem = batch.orList.find(item => item.orNumber === numericOr);
    if (!orItem) {
      console.warn('OR list item not found in batch for numeric OR:', numericOr);
      return;
    }

    // Update orItem fields
    orItem.status = 'issued';
    orItem.paymentID = String(savedPayment._id);
    orItem.issuedAt = new Date();
    orItem.issuedTo = savedPayment.payor || '';

    // Add usage record
    batch.usage = batch.usage || [];
    batch.usage.push({
      orNumber: `${batch.prefix}${numericOr}`, // Reconstruct full OR string for usage record
      usedBy: savedPayment.payor || 'System',
      userId: batch.entryUserId,
      dateUsed: new Date(),
      paymentId: savedPayment._id,
      purpose: 'Payment',
      amount: savedPayment.totalAmount,
      remarks: savedPayment.notes || ''
    });

    // If this OR is at/after currentNumber, bump currentNumber
    if (typeof batch.currentNumber === 'number') {
      if (numericOr >= batch.currentNumber) { // Compare numeric values
        batch.currentNumber = numericOr + 1; // Update with numeric value
        if (batch.currentNumber > batch.endNumber) batch.status = 'completed';
      }
    }

    await batch.save();
  } catch (error) {
    console.error('Error updating OR registry for payment:', error);
    throw error;
  }
}