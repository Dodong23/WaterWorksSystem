const ORRegistry = require('../models/ORRegistry');
const mongoose = require('mongoose');

// Helper function for response formatting
const apiResponse = (success, message, data = null) => ({
    success,
    message,
    data,
    timestamp: new Date().toISOString()
});

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

class ORRegistryController {
    // ✅ CREATE: Create new OR batch with no overlapping ranges
    static createBatch = asyncHandler(async (req, res) => {
        const {
            batchCode,
            prefix,
            startNumber,
            endNumber,
            currentNumber,
            status,
            assignedTo,
            assignedUserId,
            notes = ''
        } = req.body;

        console.log('📥 Creating new OR batch:', { batchCode, startNumber, endNumber });

        // Get current user from auth middleware
        const user = req.user || {};
        
        // Validate required fields
        if (!batchCode || !startNumber || !endNumber || !assignedTo) {
            return res.status(400).json(apiResponse(
                false,
                'Missing required fields: batchCode, startNumber, endNumber, assignedTo'
            ));
        }

        // Convert to numbers
        const startNum = parseInt(startNumber);
        const endNum = parseInt(endNumber);
        const currentNum = currentNumber ? parseInt(currentNumber) : startNum;

        // Validation
        if (isNaN(startNum) || isNaN(endNum) || isNaN(currentNum)) {
            return res.status(400).json(apiResponse(false, 'Number fields must be valid numbers'));
        }

        if (endNum <= startNum) {
            return res.status(400).json(apiResponse(false, 'End number must be greater than start number'));
        }

        if (currentNum < startNum || currentNum > endNum + 1) {
            return res.status(400).json(apiResponse(
                false,
                `Current number must be between ${startNum} and ${endNum + 1}`
            ));
        }

        // Check if batch code already exists
        const existingBatchCode = await ORRegistry.findOne({ 
            batchCode: batchCode.toUpperCase() 
        });
        
        if (existingBatchCode) {
            return res.status(409).json(apiResponse(false, 'Batch code already exists'));
        }

        // 🚨 CRITICAL: Check for overlapping number ranges
        const overlappingBatches = await ORRegistry.find({
            $or: [
                { startNumber: { $lte: startNum }, endNumber: { $gte: startNum } },
                { startNumber: { $lte: endNum }, endNumber: { $gte: endNum } },
                { startNumber: { $gte: startNum }, endNumber: { $lte: endNum } },
                { startNumber: { $gte: startNum, $lte: endNum } },
                { endNumber: { $gte: startNum, $lte: endNum } }
            ],
            isDeleted: { $ne: true }
        });

        if (overlappingBatches.length > 0) {
            const overlappingDetails = overlappingBatches.map(batch => 
                `${batch.batchCode} (${batch.prefix || ''}${batch.startNumber}-${batch.prefix || ''}${batch.endNumber})`
            ).join(', ');
            
            return res.status(409).json(apiResponse(
                false,
                `Number range overlaps with existing batch(es): ${overlappingDetails}`,
                {
                    overlappingBatches: overlappingBatches.map(b => ({
                        batchCode: b.batchCode,
                        range: `${b.prefix || ''}${b.startNumber} - ${b.prefix || ''}${b.endNumber}`,
                        status: b.status
                    }))
                }
            ));
        }

        // ✅ All checks passed, create new batch
        const newBatch = new ORRegistry({
            batchCode: batchCode.toUpperCase(),
            prefix: prefix || 'OR-',
            startNumber: startNum,
            endNumber: endNum,
            currentNumber: currentNum,
            status: status || 'pending',
            assignedTo,
            assignedUserId: assignedUserId || user.id,
            entryBy: user.name || 'System',
            entryUserId: user.id || new mongoose.Types.ObjectId(),
            notes
        });

        // orList will be automatically initialized by the model's pre-save middleware
        await newBatch.save();

        // Add virtual properties for response
        const responseBatch = newBatch.toObject();
        responseBatch.totalNumbers = newBatch.totalNumbers;
        responseBatch.usedNumbers = newBatch.usedNumbers;
        responseBatch.availableNumbers = newBatch.availableNumbers;
        responseBatch.orRange = newBatch.orRange;
        responseBatch.nextORNumber = newBatch.nextORNumber;
        responseBatch.orListStats = newBatch.orListStats; // New: Include orList stats
        responseBatch.availableORs = newBatch.availableORs; // New: Available ORs from orList

        console.log('✅ Batch created successfully:', responseBatch.batchCode, 'OR List initialized with', responseBatch.orListStats.total, 'items');
        
        res.status(201).json(apiResponse(
            true,
            'OR batch created successfully',
            responseBatch
        ));
    });

    // ✅ READ: Get all batches with pagination and filters
    static getAllBatches = asyncHandler(async (req, res) => {
        const {
            status,
            assignedTo,
            search,
            page = 1,
            limit = 10,
            sortBy = 'dateCreated',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = { isDeleted: { $ne: true } };
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (assignedTo && assignedTo !== 'all') {
            query.assignedTo = assignedTo;
        }
        
        if (search) {
            query.$or = [
                { batchCode: { $regex: search, $options: 'i' } },
                { assignedTo: { $regex: search, $options: 'i' } },
                { entryBy: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);
        
        // Sorting
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const [batches, total] = await Promise.all([
            ORRegistry.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            ORRegistry.countDocuments(query)
        ]);

        // Add virtual properties to each batch
        const enhancedBatches = batches.map(batch => ({
            ...batch,
            totalNumbers: batch.endNumber - batch.startNumber + 1,
            usedNumbers: batch.currentNumber - batch.startNumber,
            availableNumbers: Math.max(0, batch.endNumber - batch.currentNumber + 1),
            orRange: `${batch.prefix || ''}${batch.startNumber} - ${batch.prefix || ''}${batch.endNumber}`,
            nextORNumber: batch.currentNumber <= batch.endNumber 
                ? `${batch.prefix || ''}${batch.currentNumber}` 
                : null,
            isExhausted: batch.currentNumber > batch.endNumber,
            // New: Add orList related data
            orListStats: {
                total: batch.orList?.length || 0,
                available: batch.orList?.filter(item => item.status === 'available').length || 0,
                issued: batch.orList?.filter(item => item.status === 'issued').length || 0,
                cancelled: batch.orList?.filter(item => item.status === 'cancelled').length || 0,
                voided: batch.orList?.filter(item => item.status === 'voided').length || 0,
                reserved: batch.orList?.filter(item => item.status === 'reserved').length || 0
            },
            nextAvailableOR: batch.orList?.find(item => item.status === 'available') || null
        }));

        res.json(apiResponse(
            true,
            'Batches retrieved successfully',
            {
                batches: enhancedBatches,
                pagination: {
                    page: parseInt(page),
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                },
                filters: { status, assignedTo, search }
            }
        ));
    });

    // ✅ READ: Get batch by ID with orList details
    static getBatchById = asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(apiResponse(false, 'Invalid batch ID'));
        }

        const batch = await ORRegistry.findById(id);
        
        if (!batch || batch.isDeleted) {
            return res.status(404).json(apiResponse(false, 'OR batch not found'));
        }

        // Convert to object and add virtual properties
        const batchObj = batch.toObject();
        batchObj.totalNumbers = batch.totalNumbers;
        batchObj.usedNumbers = batch.usedNumbers;
        batchObj.availableNumbers = batch.availableNumbers;
        batchObj.orRange = batch.orRange;
        batchObj.nextORNumber = batch.nextORNumber;
        batchObj.isExhausted = batch.isExhausted;
        batchObj.percentageUsed = batch.percentageUsed;
        
        // New: Add orList data
        batchObj.orList = batch.orList || [];
        batchObj.orListStats = batch.orListStats;
        batchObj.availableORs = batch.availableORs;
        batchObj.issuedORs = batch.issuedORs;
        batchObj.cancelledORs = batch.cancelledORs;

        res.json(apiResponse(true, 'Batch retrieved successfully', batchObj));
    });

    // ✅ UPDATE: Update batch
    static updateBatch = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(apiResponse(false, 'Invalid batch ID'));
        }

        const batch = await ORRegistry.findById(id);
        
        if (!batch || batch.isDeleted) {
            return res.status(404).json(apiResponse(false, 'OR batch not found'));
        }

        // Prevent updating certain fields
        const disallowedFields = ['batchCode', '_id', 'entryBy', 'entryUserId', 'dateCreated', 'createdAt', 'orList'];
        disallowedFields.forEach(field => delete updates[field]);

        // Validate number updates
        if (updates.startNumber || updates.endNumber || updates.currentNumber) {
            const startNum = updates.startNumber ? parseInt(updates.startNumber) : batch.startNumber;
            const endNum = updates.endNumber ? parseInt(updates.endNumber) : batch.endNumber;
            const currentNum = updates.currentNumber ? parseInt(updates.currentNumber) : batch.currentNumber;

            if (endNum <= startNum) {
                return res.status(400).json(apiResponse(false, 'End number must be greater than start number'));
            }

            if (currentNum < startNum || currentNum > endNum + 1) {
                return res.status(400).json(apiResponse(
                    false,
                    `Current number must be between ${startNum} and ${endNum + 1}`
                ));
            }
        }

        // Apply updates
        Object.keys(updates).forEach(key => {
            batch[key] = updates[key];
        });

        await batch.save();

        // Return updated batch with virtual properties
        const updatedBatch = batch.toObject();
        updatedBatch.totalNumbers = batch.totalNumbers;
        updatedBatch.usedNumbers = batch.usedNumbers;
        updatedBatch.availableNumbers = batch.availableNumbers;
        updatedBatch.orRange = batch.orRange;
        updatedBatch.nextORNumber = batch.nextORNumber;
        updatedBatch.orListStats = batch.orListStats; // New

        res.json(apiResponse(true, 'Batch updated successfully', updatedBatch));
    });

    // ✅ DELETE: Hard delete batch
    static deleteBatch = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { reason = 'No reason provided' } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(apiResponse(false, 'Invalid batch ID'));
        }

        const batch = await ORRegistry.findById(id);
        
        if (!batch) {
            return res.status(404).json(apiResponse(false, 'OR batch not found'));
        }

        // Validate batch can be deleted
        if (batch.currentNumber > batch.startNumber) {
            return res.status(400).json(apiResponse(false, 
                'Cannot delete batch with issued OR numbers. Mark as completed instead.'));
        }

        if (batch.status === 'active') {
            return res.status(400).json(apiResponse(false, 
                'Cannot delete active batch. Change status to inactive first.'));
        }

        try {
            // Log deletion details
            console.log('Batch deletion:', {
                batchId: batch._id,
                batchCode: batch.batchCode,
                deletedBy: req.user?.name || 'System',
                reason: reason,
                orListStats: batch.orListStats
            });

            // Perform hard delete
            await ORRegistry.deleteOne({ _id: id });

            res.json(apiResponse(true, 'Batch permanently deleted from database', {
                deleted: true,
                batchCode: batch.batchCode,
                timestamp: new Date(),
                orListStats: batch.orListStats
            }));

        } catch (error) {
            console.error('Delete error:', error);
            res.status(500).json(apiResponse(false, 'Failed to delete batch from database'));
        }
    });

    // ✅ ISSUE OR: Issue next OR number from batch (updated for orList)
    static issueOR = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { 
            purpose = 'Payment',
            amount,
            paymentId,
            paymentID, // For orList
            customerName,
            remarks = '',
            specificOR // Optional: Issue specific OR number instead of next
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(apiResponse(false, 'Invalid batch ID'));
        }

        const batch = await ORRegistry.findById(id);
        
        if (!batch || batch.isDeleted) {
            return res.status(404).json(apiResponse(false, 'OR batch not found'));
        }

        // Check if batch is active
        if (batch.status !== 'active') {
            return res.status(400).json(apiResponse(
                false,
                `Cannot issue OR from ${batch.status} batch`
            ));
        }

        // Check if batch is exhausted
        if (batch.isExhausted) {
            return res.status(400).json(apiResponse(
                false,
                'No more OR numbers available in this batch'
            ));
        }

        // Prepare usage data
        const user = req.user || {};
        const usageData = {
            usedBy: user.name || 'System',
            userId: user.id || new mongoose.Types.ObjectId(),
            paymentId: paymentId || null,
            paymentID: paymentID || '', // For orList
            issuedTo: customerName || user.name || 'Customer',
            purpose: purpose || 'Payment',
            amount: amount ? parseFloat(amount) : undefined,
            remarks: remarks || ''
        };

        try {
            let result;
            
            if (specificOR) {
                // Issue specific OR number
                result = batch.issueSpecificOR(specificOR, usageData);
            } else {
                // Issue next available OR
                result = batch.issueNextOR(usageData);
            }
            
            await batch.save();

            res.json(apiResponse(
                true,
                specificOR ? `OR ${specificOR} issued successfully` : 'OR number issued successfully',
                {
                    orNumber: result.orNumber,
                    batchCode: batch.batchCode,
                    nextAvailable: batch.nextORNumber,
                    usageRecord: result.usageRecord,
                    orItem: result.orItem, // New: orList item details
                    batchStatus: batch.status,
                    orListStats: batch.orListStats // New: Updated stats
                }
            ));
        } catch (error) {
            res.status(400).json(apiResponse(false, error.message));
        }
    });

    // ✅ CANCEL OR: Cancel an issued OR (new method for orList)
    static cancelOR = asyncHandler(async (req, res) => {
        const { id, orNumber } = req.params;
        const { reason, cancelledBy } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(apiResponse(false, 'Invalid batch ID'));
        }

        if (!orNumber) {
            return res.status(400).json(apiResponse(false, 'OR number is required'));
        }

        const batch = await ORRegistry.findById(id);
        
        if (!batch || batch.isDeleted) {
            return res.status(404).json(apiResponse(false, 'OR batch not found'));
        }

        const cancelData = {
            reason: reason || 'No reason provided',
            cancelledBy: cancelledBy || req.user?.name || 'System'
        };

        try {
            const cancelledItem = batch.cancelOR(orNumber, cancelData);
            await batch.save();

            res.json(apiResponse(
                true,
                `OR ${orNumber} cancelled successfully`,
                {
                    orItem: cancelledItem,
                    batchCode: batch.batchCode,
                    orListStats: batch.orListStats
                }
            ));
        } catch (error) {
            res.status(400).json(apiResponse(false, error.message));
        }
    });

    // ✅ VOID OR: Void an issued OR number (updated for orList)
    static voidOR = asyncHandler(async (req, res) => {
        const { id, orNumber } = req.params;
        const { reason, voidBy } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(apiResponse(false, 'Invalid batch ID'));
        }

        if (!orNumber) {
            return res.status(400).json(apiResponse(false, 'OR number is required'));
        }

        const batch = await ORRegistry.findById(id);
        
        if (!batch || batch.isDeleted) {
            return res.status(404).json(apiResponse(false, 'OR batch not found'));
        }

        const voidData = {
            reason: reason || 'No reason provided',
            voidBy: voidBy || req.user?.name || 'System'
        };

        try {
            const voidedRecord = batch.voidOR(orNumber, voidData);
            await batch.save();

            res.json(apiResponse(
                true,
                `OR ${orNumber} voided successfully`,
                {
                    voidedRecord,
                    orListStats: batch.orListStats // New
                }
            ));
        } catch (error) {
            res.status(400).json(apiResponse(false, error.message));
        }
    });

    // ✅ GET OR DETAILS: Get specific OR details from orList
    static getORDetails = asyncHandler(async (req, res) => {
        const { id, orNumber } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(apiResponse(false, 'Invalid batch ID'));
        }

        if (!orNumber) {
            return res.status(400).json(apiResponse(false, 'OR number is required'));
        }

        const batch = await ORRegistry.findById(id);
        
        if (!batch || batch.isDeleted) {
            return res.status(404).json(apiResponse(false, 'OR batch not found'));
        }

        const orItem = batch.getORByNumber(orNumber);
        
        if (!orItem) {
            return res.status(404).json(apiResponse(false, `OR ${orNumber} not found in this batch`));
        }

        // Find corresponding usage record if exists
        const usageRecord = batch.usage.find(record => 
            record.orNumber === orNumber
        );

        res.json(apiResponse(
            true,
            'OR details retrieved',
            {
                batchCode: batch.batchCode,
                batchStatus: batch.status,
                orItem,
                usageRecord,
                formattedOR: `${batch.prefix || ''}${orItem.orNumber}`
            }
        ));
    });

    // ✅ GET ORS BY STATUS: Get all ORs with specific status
    static getORsByStatus = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(apiResponse(false, 'Invalid batch ID'));
        }

        const validStatuses = ['available', 'issued', 'cancelled', 'voided', 'reserved'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json(apiResponse(
                false,
                `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            ));
        }

        const batch = await ORRegistry.findById(id);
        
        if (!batch || batch.isDeleted) {
            return res.status(404).json(apiResponse(false, 'OR batch not found'));
        }

        let ors;
        if (status) {
            ors = batch.getORsByStatus(status);
        } else {
            ors = batch.orList || [];
        }

        res.json(apiResponse(
            true,
            status ? `ORs with status: ${status}` : 'All ORs retrieved',
            {
                batchCode: batch.batchCode,
                status: batch.status,
                total: ors.length,
                ors: ors.map(item => ({
                    ...item,
                    formattedOR: `${batch.prefix || ''}${item.orNumber}`
                })),
                stats: batch.orListStats
            }
        ));
    });

    // ✅ STATISTICS: Get system statistics (updated for orList)
    static getStatistics = asyncHandler(async (req, res) => {
        const stats = await ORRegistry.aggregate([
            {
                $match: { isDeleted: { $ne: true } }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalNumbers: { 
                        $sum: { 
                            $add: [
                                { $subtract: ['$endNumber', '$startNumber'] },
                                1
                            ]
                        }
                    },
                    usedNumbers: {
                        $sum: {
                            $subtract: ['$currentNumber', '$startNumber']
                        }
                    }
                }
            },
            {
                $project: {
                    status: '$_id',
                    count: 1,
                    totalNumbers: 1,
                    usedNumbers: 1,
                    availableNumbers: {
                        $subtract: ['$totalNumbers', '$usedNumbers']
                    },
                    _id: 0
                }
            },
            {
                $sort: { status: 1 }
            }
        ]);

        // Calculate overall totals
        const totals = stats.reduce((acc, stat) => ({
            totalBatches: acc.totalBatches + stat.count,
            totalNumbers: acc.totalNumbers + stat.totalNumbers,
            usedNumbers: acc.usedNumbers + stat.usedNumbers,
            availableNumbers: acc.availableNumbers + stat.availableNumbers
        }), {
            totalBatches: 0,
            totalNumbers: 0,
            usedNumbers: 0,
            availableNumbers: 0
        });

        // Get active batch details
        const activeBatches = await ORRegistry.find({
            status: 'active',
            isDeleted: { $ne: true }
        }).select('batchCode prefix currentNumber endNumber assignedTo orList');

        // Add virtual properties with orList data
        const enhancedActiveBatches = activeBatches.map(batch => {
            const availableORs = batch.orList?.filter(item => item.status === 'available') || [];
            const nextAvailableOR = availableORs.length > 0 ? availableORs[0] : null;
            
            return {
                batchCode: batch.batchCode,
                assignedTo: batch.assignedTo,
                currentOR: batch.currentNumber <= batch.endNumber 
                    ? `${batch.prefix || ''}${batch.currentNumber}` 
                    : null,
                nextAvailable: nextAvailableOR ? 
                    `${batch.prefix || ''}${nextAvailableOR.orNumber}` : null,
                available: Math.max(0, batch.endNumber - batch.currentNumber + 1),
                isExhausted: batch.currentNumber > batch.endNumber,
                orListStats: {
                    total: batch.orList?.length || 0,
                    available: availableORs.length,
                    issued: batch.orList?.filter(item => item.status === 'issued').length || 0,
                    cancelled: batch.orList?.filter(item => item.status === 'cancelled').length || 0
                }
            };
        });

        res.json(apiResponse(
            true,
            'Statistics retrieved successfully',
            {
                byStatus: stats,
                totals,
                activeBatches: enhancedActiveBatches
            }
        ));
    });

    // ✅ NEXT OR: Get the very next available OR number for the logged-in user
    static getNextOR = asyncHandler(async (req, res) => {
        try {
            const user = req.user;

            if (!user || !user.fullName) {
                return res.status(401).json(apiResponse(false, 'Authentication error: User not found'));
            }
            
            // Get active batches for the current user
            const batches = await ORRegistry.find({
                status: 'active',
                assignedTo: user.fullName,
                isDeleted: { $ne: true }
            }).sort({ startNumber: 1 });

            if (!batches.length) {
                return res.status(404).json(apiResponse(
                    false,
                    'No active batches found for the current user'
                ));
            }

            let nextBatch = null;
            let nextAvailableOR = null;
            let orToUse = null
            // Find the first batch that has an available OR
            for (const batch of batches) {
                orToUse = batch.currentNumber;
                const available = batch.orList?.find(item => item.status === 'available');
                if (available) {
                    nextBatch = batch;
                    nextAvailableOR = available;
                    break;
                }
            }

            if (!nextBatch || !nextAvailableOR) {
                return res.status(404).json(apiResponse(
                    false,
                    'No available OR numbers found in any of your active batches'
                ));
            }

            const nextOR =  orToUse; //`${nextBatch.prefix || ''}${nextAvailableOR.orNumber}`;
            const remaining = nextBatch.orList?.filter(item => item.status === 'available').length || 0;

            res.json(apiResponse(
                true,
                'Next available OR number',
                {
                    orNumber: nextOR,
                    batchCode: nextBatch.batchCode,
                    assignedTo: nextBatch.assignedTo,
                    isYourBatch: true,
                    status: nextBatch.status,
                    remainingAvailable: remaining,
                    nextAvailableAfterThis: remaining > 1 ? 
                        `${nextBatch.prefix || ''}${nextAvailableOR.orNumber + 1}` : null,
                    batchDetails: {
                        currentNumber: nextBatch.currentNumber,
                        endNumber: nextBatch.endNumber,
                        orListStats: nextBatch.orListStats
                    }
                }
            ));

        } catch (error) {
            console.error('Get next OR error:', error);
            res.status(500).json(apiResponse(false, 'Server error retrieving next OR'));
        }
    });

    // ✅ BATCH USAGE: Get usage history for a batch
    static getBatchUsage = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(apiResponse(false, 'Invalid batch ID'));
        }

        const batch = await ORRegistry.findById(id).select('usage orList');
        
        if (!batch || batch.isDeleted) {
            return res.status(404).json(apiResponse(false, 'OR batch not found'));
        }

        // Combine usage records with orList data
        const combinedUsage = batch.usage.map(usage => {
            const orItem = batch.orList?.find(item => 
                `${batch.prefix || ''}${item.orNumber}` === usage.orNumber
            );
            
            return {
                ...usage.toObject(),
                orItem: orItem || null
            };
        });

        // Paginate usage array
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsage = combinedUsage.slice(startIndex, endIndex);

        // Sort by date used (newest first)
        paginatedUsage.sort((a, b) => new Date(b.dateUsed) - new Date(a.dateUsed));

        res.json(apiResponse(
            true,
            'Usage history retrieved',
            {
                usage: paginatedUsage,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: combinedUsage.length,
                    pages: Math.ceil(combinedUsage.length / parseInt(limit))
                },
                orListStats: batch.orListStats
            }
        ));
    });

    // ✅ SEARCH OR: Search for specific OR number across all batches (updated for orList)
    static searchOR = asyncHandler(async (req, res) => {
        const { orNumber } = req.query;

        if (!orNumber) {
            return res.status(400).json(apiResponse(false, 'OR number is required'));
        }

        // Search across all batches
        const batches = await ORRegistry.find({
            isDeleted: { $ne: true }
        }).select('batchCode prefix orList usage');

        // Flatten and filter results from orList
        const results = [];
        batches.forEach(batch => {
            const matchingORs = batch.orList?.filter(item => {
                const fullOR = `${batch.prefix || ''}${item.orNumber}`;
                return fullOR.includes(orNumber) || item.orNumber.toString().includes(orNumber);
            }) || [];
            
            matchingORs.forEach(orItem => {
                // Find corresponding usage record
                const usageRecord = batch.usage.find(record => 
                    record.orNumber === `${batch.prefix || ''}${orItem.orNumber}`
                );
                
                results.push({
                    orNumber: `${batch.prefix || ''}${orItem.orNumber}`,
                    batchCode: batch.batchCode,
                    status: orItem.status,
                    paymentID: orItem.paymentID,
                    issuedAt: orItem.issuedAt,
                    issuedTo: orItem.issuedTo,
                    cancelledAt: orItem.cancelledAt,
                    cancelledBy: orItem.cancelledBy,
                    cancellationReason: orItem.cancellationReason,
                    usageRecord: usageRecord || null
                });
            });
        });

        // Sort by issuedAt or cancelledAt (newest first)
        results.sort((a, b) => {
            const dateA = a.issuedAt || a.cancelledAt;
            const dateB = b.issuedAt || b.cancelledAt;
            return new Date(dateB || 0) - new Date(dateA || 0);
        });

        res.json(apiResponse(
            true,
            'Search completed',
            {
                results,
                total: results.length
            }
        ));
    });

    // ✅ BATCH ACTIVATE/DEACTIVATE: Change batch status
    static changeBatchStatus = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(apiResponse(false, 'Invalid batch ID'));
        }

        const validStatuses = ['active', 'inactive', 'pending', 'completed', 'hold'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json(apiResponse(
                false,
                `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            ));
        }

        const batch = await ORRegistry.findById(id);
        
        if (!batch || batch.isDeleted) {
            return res.status(404).json(apiResponse(false, 'OR batch not found'));
        }

        batch.status = status;
        await batch.save();

        res.json(apiResponse(
            true,
            `Batch status changed to ${status}`,
            {
                batchCode: batch.batchCode,
                status: batch.status,
                dateActivated: batch.dateActivated,
                dateCompleted: batch.dateCompleted,
                orListStats: batch.orListStats // New
            }
        ));
    });

    // ✅ GET BATCH ORLIST: Get full orList for a batch
    static getBatchORList = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { 
            page = 1, 
            limit = 50,
            status,
            sortBy = 'orNumber',
            sortOrder = 'asc'
        } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(apiResponse(false, 'Invalid batch ID'));
        }

        const batch = await ORRegistry.findById(id).select('batchCode prefix orList');
        
        if (!batch || batch.isDeleted) {
            return res.status(404).json(apiResponse(false, 'OR batch not found'));
        }

        let orList = batch.orList || [];

        // Filter by status if provided
        if (status) {
            orList = orList.filter(item => item.status === status);
        }

        // Sort
        orList.sort((a, b) => {
            if (sortBy === 'orNumber') {
                return sortOrder === 'asc' ? a.orNumber - b.orNumber : b.orNumber - a.orNumber;
            } else if (sortBy === 'status') {
                return sortOrder === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
            }
            return 0;
        });

        // Paginate
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedList = orList.slice(startIndex, endIndex);

        // Format OR numbers with prefix
        const formattedList = paginatedList.map(item => ({
            ...item,
            formattedOR: `${batch.prefix || ''}${item.orNumber}`
        }));

        res.json(apiResponse(
            true,
            'OR list retrieved',
            {
                batchCode: batch.batchCode,
                orList: formattedList,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: orList.length,
                    pages: Math.ceil(orList.length / parseInt(limit))
                },
                filters: { status },
                stats: batch.orListStats
            }
        ));
    });
}

module.exports = ORRegistryController;