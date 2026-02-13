export function renderBillingRecords(container) {
    const billingRecordsHTML = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Billing Records</h1>
            <div class="btn-toolbar mb-2 mb-md-0">
                <button type="button" class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#billingManagementModal">
                    <i class="bi bi-gear"></i> Billing Management
                </button>
            </div>
        </div>
        <div class="row">
            <div class="col-md-3">
                <div class="form-group">
                    <label for="monthFilter">Filter by Month</label>
                     <div class="input-group mb-2">
                        <span class="input-group-text"><i class="bi bi-calendar"></i></span>
                        <select class="form-select" id="yearFilter"></select>
                        <select class="form-select" id="monthSelectFilter">
                            <option value="01">January</option>
                            <option value="02">February</option>
                            <option value="03">March</option>
                            <option value="04">April</option>
                            <option value="05">May</option>
                            <option value="06">June</option>
                            <option value="07">July</option>
                            <option value="08">August</option>
                            <option value="09">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                     </div>
                    <button class="btn btn-primary btn-sm" id="applyMonthFilter"><i class="bi bi-funnel"></i> Apply Filter</button>
                </div>
            </div>
            <div class="col-md-3">
                <div class="form-group">
                    <label for="searchByName">Search by Name</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control" id="searchByName" placeholder="Enter client name">
                    </div>
                </div>
            </div>
        </div>

        <div class="table-responsive">
            <table class="table table-striped table-sm">
                <thead>
                    <tr>
                        <th>Billing ID</th>
                        <th>Client ID</th>
                        <th>Name</th>
                        <th>Meter #</th>
                        <th>Period</th>
                        <th>Consumption</th>
                        <th>Current Billing</th>
                        <th>Remaining Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="billingTableBody">
                    <!-- Billing records will be inserted here -->
                </tbody>
            </table>
        </div>

        <!-- Edit Billing Modal -->
        <div class="modal fade" id="editBillingModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Billing Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="editBillingId">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Client Name</label>
                                <input type="text" class="form-control" id="editClientName" readonly>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Client ID</label>
                                <input type="text" class="form-control" id="editClientId" readonly>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Meter Number</label>
                                <input type="text" class="form-control" id="editMeterNum" readonly>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Previous Reading</label>
                                <input type="number" class="form-control" id="editPrevious">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Current Reading</label>
                                <input type="number" class="form-control" id="editCurrent">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Read Date</label>
                                <input type="date" class="form-control" id="editReadDate">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Less Amount</label>
                                <input type="number" class="form-control" id="editLessAmount">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Discount</label>
                                <input type="number" class="form-control" id="editDiscount">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Free Cubic</label>
                                <input type="number" class="form-control" id="editFreeCubic">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-info" id="printSingleBillBtn">Print Bill</button>
                        <button type="button" class="btn btn-primary" id="saveBillingChanges">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = billingRecordsHTML;

    // Populate year filter
    const yearFilter = document.getElementById('yearFilter');
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearFilter.appendChild(option);
    }

    let currentBillingInModal = null;

    // Function to fetch and render billing records
    const fetchBillingData = async () => {
        const tbody = document.getElementById('billingTableBody');
        const month = document.getElementById('monthSelectFilter').value;
        const year = document.getElementById('yearFilter').value;
        const search = document.getElementById('searchByName').value.toLowerCase();

        tbody.innerHTML = '<tr><td colspan="10" class="text-center"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

        try {
            // Use sortableDate for backend filtering (YYYY-MM)
            const response = await fetch(`/api/billings?sortableDate=${year}-${month}`);
            if (!response.ok) throw new Error('Failed to fetch data');
            const result = await response.json();
            let data = result.data || [];

            // Client-side filtering for search if API doesn't support 'search' param for this endpoint
            if (search) {
                data = data.filter(item => 
                    (item.name && item.name.toLowerCase().includes(search)) ||
                    (item.billingID && item.billingID.toLowerCase().includes(search))
                );
            }
            
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" class="text-center">No records found</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(item => `
                <tr>
                    <td>${item.billingID || item.billingNo || '-'}</td>
                    <td>${item.clientId || '-'}</td>
                    <td>${item.name || item.clientName || '-'}</td>
                    <td>${item.meterNum || item.meterNumber || '-'}</td>
                    <td>${item.sortableDate || item.period || `${month}/${year}`}</td>
                    <td>${item.consumption !== undefined ? item.consumption : 0}</td>
                    <td>${(item.currentBilling || item.amount || 0).toFixed(2)}</td>
                    <td>${(item.remainingBalance || item.balance || 0).toFixed(2)}</td>
                    <td>${item.isRead === 1 ? '<span class="text-success">Read</span>' : '<span class="text-danger">Unread</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-billing-btn" data-id="${item._id}">View</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error fetching billing records:', error);
            tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Failed to load data</td></tr>';
        }
    };

    document.getElementById('applyMonthFilter').addEventListener('click', fetchBillingData);
    document.getElementById('searchByName').addEventListener('keyup', (e) => { if (e.key === 'Enter') fetchBillingData(); });

    // Handle View button click (delegated event)
    document.getElementById('billingTableBody').addEventListener('click', async (e) => {
        if (e.target.classList.contains('view-billing-btn')) {
            const id = e.target.getAttribute('data-id');
            try {
                const response = await fetch(`/api/billings/${id}`);
                const result = await response.json();
                if (result.success && result.data) {
                    currentBillingInModal = result.data;
                    const billing = result.data;
                    console.log('Fetched billing details:', billing.readDate);
                    document.getElementById('editBillingId').value = billing._id;
                    document.getElementById('editClientName').value = billing.name || '';
                    document.getElementById('editClientId').value = billing.clientId || '';
                    document.getElementById('editMeterNum').value = billing.meterNum || '';
                    document.getElementById('editCurrent').value = billing.currentReading || '';
                    document.getElementById('editPrevious').value = billing.previousReading || '';
                    document.getElementById('editLessAmount').value = billing.lessAmount || 0;
                    document.getElementById('editDiscount').value = billing.discount || 0;
                    document.getElementById('editFreeCubic').value = billing.freeCubic || 0;
                    document.getElementById('editReadDate').value = formatDateForInput(billing.readDate);

                    const modal = new bootstrap.Modal(document.getElementById('editBillingModal'));
                    modal.show();
                } else {
                    alert('Billing record not found.');
                }
            } catch (error) {
                console.error('Error fetching billing details:', error);
                alert('An error occurred while fetching billing details.');
            }
        }
    });
function formatDateForInput(dbDate){
    if(!dbDate) return '';

    const [year, month, day] = dbDate.split('/');

    const mm = month.padStart(2, '0');
    const dd = day.padStart(2, '0');

    return `${year}-${mm}-${dd}`;
}
function sanitizeDate(dateStr){
    if(!dateStr) return null;
    const [month, day, year] = dateStr.split('-');
    return `${year}/${month}/${day}`;
}
    // Handle Save Changes button click in modal
    document.getElementById('saveBillingChanges').addEventListener('click', async () => {
        const billingId = document.getElementById('editBillingId').value;
        console.log('Saving changes for billing ID:', document.getElementById('editReadDate').value);
        const updatedData = {
            currentReading: parseFloat(document.getElementById('editCurrent').value),
            previousReading: parseFloat(document.getElementById('editPrevious').value),
            lessAmount: parseFloat(document.getElementById('editLessAmount').value),
            discount: parseFloat(document.getElementById('editDiscount').value),
            freeCubic: parseFloat(document.getElementById('editFreeCubic').value),
            readDate: sanitizeDate(document.getElementById('editReadDate').value),
        };
        try {
            const response = await fetch(`/api/billings/${billingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const result = await response.json();
            if (result.success) {
                alert(result.message);
                currentBillingInModal = result.data;
                fetchBillingData(); // Refresh table
            } else {
                alert(`Error updating billing: ${result.message}`);
            }
        } catch (error) {
            console.error('Error updating billing:', error);
            alert('An error occurred while updating the billing record.');
        }
    });

    // Print single bill from modal
    document.getElementById('printSingleBillBtn').addEventListener('click', () => {
        if (!currentBillingInModal) {
            alert('No billing data available to print.');
            return;
        }
        const bill = currentBillingInModal;
        const totalDue = (bill.currentBilling || 0) + (bill.prevBal || 0);
        const discounted = totalDue - (totalDue * 0.10);
        const printWindow = window.open('', '_blank');
printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>Water Billing Statement</title>
    <style>
        /* PRINT SETUP - HALF LEGAL SIZE */
        @page { 
            size: legal portrait; 
            margin: 0; 
        }
        
        html, body {
            width: 8.5in; 
            height: 13in;
            margin: 0; 
            padding: 0;
            background: #fff;
            font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
            font-size: 10px; 
            color: #1a202c;
            line-height: 1.3;
        }
        
        * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            box-sizing: border-box; 
        }
        
        /* TWO BILLS PER PAGE */
        .page-container {
            width: 8.5in;
            height: 13in;
            position: relative;
        }
        
        .bill {
            position: relative;
            width: 4.25in;
            height: 6.5in;
            display: flex;
            flex-direction: column;
        }
        
        /* FIRST BILL POSITION */
        .bill:nth-child(1) {
            top: 0;
            left: 0;
        }
        
        /* SECOND BILL POSITION */
        .bill:nth-child(2) {
            top: 6.5in;
            left: 0;
        }
        
        /* HEADER SECTION - COMPACT */
        .header {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 2px solid #2c5282;
        }
        
        .govt-line {
            font-size: 9px;
            font-weight: 600;
            color: #2d3748;
            margin: 1px 0;
            letter-spacing: 0.3px;
        }
        
        .province {
            font-size: 10px;
            font-weight: 700;
            color: #2c5282;
            margin: 2px 0;
        }
        
        .municipality {
            font-size: 9px;
            font-style: italic;
            color: #4a5568;
            margin: 1px 0;
        }
        
        .waterworks-title {
            font-size: 13px;
            font-weight: 800;
            color: #2c5282;
            margin: 4px 0 2px 0;
            padding: 3px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .statement-title {
            font-size: 11px;
            font-weight: 700;
            color: #1a202c;
            margin: 2px 0 4px 0;
        }
        
        /* SECTION ORGANIZATION */
        .section-group {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 6px;
        }
        
        .section {
            margin-bottom: 5px;
        }
        
        .section-header {
            font-size: 9px;
            font-weight: 700;
            color: #2c5282;
            margin-bottom: 3px;
            padding-bottom: 2px;
            border-bottom: 1px solid #e2e8f0;
            text-transform: uppercase;
        }
        
        /* DATA ROWS - COMPACT */
        .data-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2px;
            min-height: 12px;
        }
        
        .data-label {
            font-size: 9px;
            color: #4a5568;
            font-weight: 500;
            flex: 0 0 55%;
            padding-right: 5px;
        }
        
        .data-value {
            font-size: 9.5px;
            font-weight: 600;
            color: #1a202c;
            text-align: right;
            flex: 0 0 45%;
            word-break: break-word;
        }
        
        .highlight {
            color: #2c5282;
            font-weight: 700;
        }
        
        /* READING SECTION - TWO COLUMNS */
        .reading-section {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 6px;
            margin: 6px 0;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4px 10px;
        }
        
        .reading-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
        }
        
        /* TOTAL BOX - PROMINENT */
        .total-section {
            margin: 8px 0;
        }
        
        .total-box {
            background: linear-gradient(to right, #2c5282, #3182ce);
            color: white;
            padding: 8px 10px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .total-label {
            font-size: 10px;
            letter-spacing: 0.3px;
        }
        
        .total-amount {
            font-size: 14px;
            font-weight: 800;
        }
        
        /* PAYMENT SECTION - COMPACT */
        .payment-section {
            margin: 6px 0;
        }
        
        .payment-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 6px;
            margin-bottom: 3px;
            border-radius: 3px;
            font-size: 9px;
        }
        
        .due-date {
            background: #fffaf0;
            border-left: 3px solid #ed8936;
        }
        
        .early-payment {
            background: #f0fff4;
            border-left: 3px solid #38a169;
        }
        
        .late-payment {
            background: #fff5f5;
            border-left: 3px solid #e53e3e;
        }
        
        .payment-label {
            font-weight: 600;
            color: #2d3748;
        }
        
        .payment-amount {
            font-weight: 700;
            color: #1a202c;
        }
        
        /* FOOTER - COMPACT */
        .footer {
            margin-top: auto;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
        }
        
        .reader-info {
            text-align: center;
            padding: 4px 0;
            margin: 4px 0;
        }
        
        .reader-title {
            font-size: 9px;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 2px;
        }
        
        .reader-name {
            font-weight: 700;
            font-size: 10px;
            color: #2c5282;
            margin: 2px 0;
        }
        
        .reader-contact {
            font-size: 8.5px;
            color: #718096;
        }
        
        .warning-note {
            background: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 3px;
            padding: 4px;
            text-align: center;
            font-size: 8.5px;
            font-weight: 700;
            color: #c53030;
            margin: 5px 0;
        }
        
        .print-info {
            text-align: center;
            font-size: 8px;
            color: #a0aec0;
            margin-top: 4px;
            border-top: 1px dashed #e2e8f0;
            padding-top: 3px;
        }
        
        /* FOR SINGLE BILL PRINT PREVIEW */
        .single-bill .bill {
            position: absolute;
            top: 0;
            left: 2.125in;
            outline: 1px solid #e2e8f0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            background: white;
        }
        
        /* PREVIEW MODE */
        @media screen {
            body {
                background: #edf2f7;
                display: flex;
                justify-content: left;
                align-items: left;
                min-height: 100vh;
                padding: 20px;
            }
            
            .single-bill {
                width: 8.5in;
                height: 13in;
                position: relative;
                background: white;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                border-radius: 8px;
                overflow: hidden;
            }
        }
        
        @media print {
            html, body {
                margin: -3;
                padding: 0 !important;
                background: white !important;
            }
            
            .single-bill .bill {
                outline: none !important;
                box-shadow: none !important;
                left: 0 !important;
                margin: -3;
            }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="single-bill">
        <div class="bill">
            <!-- HEADER -->
            <div class="header">
                <div class="govt-line">Republic of the Philippines</div>
                <div class="province">PROVINCE OF ZAMBOANGA DEL NORTE</div>
                <div class="municipality">Municipality of Manukan</div>
                <div class="govt-line" style="font-size: 8.5px; color: #718096;">Email: lgmanukan@zonetagmail.com</div>
                
                <div class="waterworks-title">MANUKAN WATERWORKS SYSTEM</div>
                <div class="statement-title">BILLING STATEMENT</div>
            </div>
            
            <!-- ACCOUNT INFO & BILLING PERIOD SIDE BY SIDE -->
            <div class="section-group">
                <!-- ACCOUNT INFORMATION -->
                <div class="section">
                    <div class="section-header">Account Information</div>
                    <div class="data-row">
                        <div class="data-label">Meter Number:</div>
                        <div class="data-value highlight">${bill.meterNum || ''}</div>
                    </div>
                    <div class="data-row">
                        <div class="data-label">Consumer Name:</div>
                        <div class="data-value">${bill.name || ''}</div>
                    </div>
                    <div class="data-row">
                        <div class="data-label">Service Address:</div>
                        <div class="data-value">${bill.area || ''}</div>
                    </div>
                    <div class="data-row">
                        <div class="data-label">Account Type:</div>
                        <div class="data-value">${classificationNumberToWord(bill.classification) || 'Residential'}</div>
                    </div>
                </div>
                
                <!-- BILLING PERIOD -->
                <div class="section">
                    <div class="section-header">Billing Period</div>
                    <div class="data-row">
                        <div class="data-label">Billing Month:</div>
                        <div class="data-value highlight">${monthYear(bill.sortableDate) || ''}</div>
                    </div>
                    <div class="data-row">
                        <div class="data-label">Coverage:</div>
                        <div class="data-value">${toLongDate(bill.prevReadDate) || ''}<br>to ${toLongDate(bill.readDate) || ''}</div>
                    </div>
                </div>
            </div>
            
            <!-- READING DATA -->
            <div class="section">
                <div class="section-header">Consumption Details</div>
                <div class="reading-section">
                    <div class="reading-row">
                        <div class="data-label">Present Reading:</div>
                        <div class="data-value">${bill.currentReading || 0} m³</div>
                    </div>
                    <div class="reading-row">
                        <div class="data-label">Previous Reading:</div>
                        <div class="data-value">${bill.previousReading || 0} m³</div>
                    </div>
                    <div class="reading-row">
                        <div class="data-label">Consumption:</div>
                        <div class="data-value highlight">${bill.consumption || 0} m³</div>
                    </div>
                    <div class="reading-row">
                        <div class="data-label">Current Charge:</div>
                        <div class="data-value">₱ ${Number(bill.currentBilling || 0).toFixed(2)}</div>
                    </div>
                    <div class="reading-row">
                        <div class="data-label">Prev. Balance:</div>
                        <div class="data-value">₱ ${Number(bill.prevBal || 0).toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            <!-- TOTAL AMOUNT -->
            <div class="total-section">
                <div class="total-box">
                    <span class="total-label">TOTAL AMOUNT DUE</span>
                    <span class="total-amount">₱ ${totalDue.toFixed(2)}</span>
                </div>
            </div>
            
            <!-- PAYMENT INFORMATION -->
            <div class="payment-section">
                <div class="section-header">Payment Information</div>
                <div class="payment-row due-date">
                    <span class="payment-label">DUE DATE</span>
                    <span class="payment-amount">${bill.dueDate || ''}</span>
                </div>
                <div class="payment-row early-payment">
                    <span class="payment-label">On/Before Due (10% Disc)</span>
                    <span class="payment-amount">₱ ${discounted.toFixed(2)}</span>
                </div>
                <div class="payment-row late-payment">
                    <span class="payment-label">After Due Date</span>
                    <span class="payment-amount">₱ ${totalDue.toFixed(2)}</span>
                </div>
            </div>
            
            <!-- FOOTER -->
            <div class="footer">
                <div class="reader-info">
                    <div class="reader-title">READING IN-CHARGE</div>
                    <div class="reader-name">${bill.reader || 'CHRISTIAN B. ALIA'}</div>
                    <div class="reader-contact">${bill.readerContact || '09053148536 / 09092018543'}</div>
                </div>
                
                <div class="warning-note">
                    ⚠️ ACCOUNT SUBJECT TO DISCONNECTION FOR NON-PAYMENT
                </div>
                
                <div class="print-info">
                    Printed: ${new Date().toLocaleString('en-PH', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`);
        printWindow.document.close();
    });
}
