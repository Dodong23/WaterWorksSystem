// public/js/clientProfile.js

// Configuration constants
const CONFIG = {
    BARANGAYS: {
        0: 'Select Barangay',
        1: 'Poblacion I',
        2: 'Poblacion II',
        3: 'East Poblacion',
        4: 'Punta Blanca',
        5: 'Patunan',
        6: 'Polot',
        7: 'Dequis',  
        8: 'Palaranan',
        9: 'Don Jose Aguirre',
       10: 'San Antonio',
       11: 'Lyndieville Subdivision',
       12: 'Loquilos',
       13: 'San Vicente',
       14: 'Market',
    },
    PAYMENT_METHODS: [
        { value: 'Cash', label: 'Cash' },
        { value: 'Check', label: 'Check' },
        { value: 'Card', label: 'Card' },
        { value: 'Online', label: 'Online' }
    ]
};

function formatMonthYear(inputDate) {
const input = inputDate + '-20'
    try {
        if (!input) return '';
        const d = (input instanceof Date) ? input : new Date(input);
        if (isNaN(d)) return String(input);
        return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } catch (e) {
        return String(input);
    }
}

function parseCurrency(value) {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value !== 'string') {
        return parseFloat(String(value || 0));
    }
    // Remove currency symbol and commas, then parse
    const cleanedValue = value.replace(/[₱,]/g, '');
    return parseFloat(cleanedValue || 0);
}

function formatCurrency(value) {
    const n = parseCurrency(value);
    if (!isFinite(n)) return '₱0.00';
    return '₱' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const getBarangayName = (barangayValue) =>
    CONFIG.BARANGAYS[barangayValue] || 'Unknown Barangay';

const CLASSIFICATIONS = {
    0: 'Unknown',
    1: 'Residential',
    2: 'Institutional',
    3: 'Commercial',
    4: 'Industrial'
};

function getClassificationName(val) {
    if (val === undefined || val === null) return CLASSIFICATIONS[0];
    return CLASSIFICATIONS[val] || String(val);
}

class MiscFeeService {
    static async fetchMiscFeesByClientId(clientId) {
        try {
            const response = await fetch(`/api/misc-fees/client/${clientId}/unpaid`, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const fees = await response.json();
            return fees.map(fee => ({
                id: fee._id,
                code: fee.miscId,
                description: fee.name,
                lessAmount: 0,
                amount: fee.amount,
                discount: 0, // Assuming no discount for misc fees for now
                payment: fee.paidAmount || 0,
                balance: fee.amount - (fee.paidAmount || 0),
                originalData: fee,
                type: 'misc'
            }));
        } catch (error) {
            console.error('Fetch misc fees error:', error);
            throw error;
        }
    }
}
 
class BillingService {
    static async fetchBillingsByClientId(clientId) {
        console.log('Fetching billings for client:', clientId);
        try {
            const response = await fetch(`/api/billings/client/${clientId}/unpaid`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success === false) {
                console.error('Error fetching billings:', result.message);
                return [];
            }

            // Normalize response data
            const billingsData = this.normalizeBillingsData(result);
            
            // Transform to frontend format
             console.log("Billings: ", billingsData);
            return billingsData.map(billing => ({
                id: billing.id || billing._id || billing.billingID,
                code: billing.billingID,
                description: formatMonthYear(billing.sortableDate),
                amount: billing.currentBilling,
                lessAmount: billing.lessAmount,
                discount: billing.discount || 0,
                payment: billing.paidAmount || 0,
                balance: billing.remainingBalance,
                meterNum: billing.meterNum || '',
                readDate: billing.readDate || '',
                currentReading: billing.curReading,
                prevReading: billing.prevReading || 0,
                consumed: billing.consumed || 0,
                originalData: billing, // Keep original data for reference
                type: 'billings'
            }));
           
        } catch (error) {
            console.error('Fetch billings error:', error);
            throw error;
        }
    }

    static normalizeBillingsData(result) {
        if (Array.isArray(result)) return result;
        if (result.data && Array.isArray(result.data)) return result.data;
        if (result.billings && Array.isArray(result.billings)) return result.billings;
        return [];
    }

    static async createPayment(paymentData) {
      console.log('Creating payment with data:', paymentData);
        try {
            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Payment failed with status: ${response.status}`);
            }

            if (!result.success) {
                throw new Error(result.message || 'Payment creation failed');
            }

            return result.data;
        } catch (error) {
            console.error('Create payment error:', error);
            throw error;
        }
    }
}

// UI Components
class PaymentView {
    constructor(clientId, clientData, primaryMainContent) {
        this.clientId = clientId;
        this.client = clientData;
        this.primaryMainContent = primaryMainContent;
        this.selectedItems = new Map();
        this.paymentData = null;
        this.billings = [];
        this.miscFees = [];
        this.orNumber = null;
        this.batchCode = null;
        this.currentView = 'billings'; // 'billings' or 'misc'
    }

    async initialize() {
        try {
            [this.billings, this.miscFees] = await Promise.all([
                BillingService.fetchBillingsByClientId(this.clientId),
                MiscFeeService.fetchMiscFeesByClientId(this.clientId)
            ]);
            await this.fetchNextOR();
        } catch (error) {
            console.warn('Using fallback data due to fetch error:', error);
            this.billings = this.getFallbackBillings();
            this.miscFees = [];
        }
        
        this.render();
        this.attachEventListeners();
    }

    getFallbackBillings() {
        return [
            { 
                id: 'fallback-1',
                code: 'BIL-001', 
                description: 'Water Consumption', 
                amount: 1500, 
                discount: 0, 
                payment: 1500, 
                balance: 0 
            }
        ];
    }

    async fetchNextOR() {
        try {
            const response = await fetch('/api/or-registry/batches/next-or');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch next OR number' }));
                throw new Error(errorData.message || 'Failed to fetch next OR number');
            }
            const result = await response.json();
            if (result.success && result.data) {
                this.orNumber = result.data.orNumber;
                this.batchCode = result.data.batchCode;
                const orDisplay = document.getElementById('or-number-display');
                if (orDisplay) {
                    orDisplay.textContent = this.orNumber;
                }
            } else {
                throw new Error(result.message || 'Could not retrieve a valid OR number.');
            }
        } catch (error) {
            console.error('Error fetching next OR number:', error);
            this.showToast(error.message, 'error');
            this.orNumber = null;
            this.batchCode = null;
            const orDisplay = document.getElementById('or-number-display');
            if (orDisplay) {
                orDisplay.textContent = 'N/A';
            }
        }
    }

    render() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('main-content element not found');
            return;
        }

        mainContent.innerHTML = this.generateHTML();
    }

    generateHTML() {
        const client = this.client;
        const totalBalance = this.calculateTotalBalance();
        
        return `
        <div class="d-flex gap-3" style="height: 100vh; overflow: hidden;">
            <!-- Left Column: Account Info + Payment Selection -->
            <div style="flex: 1; overflow-y: auto; padding-right: 10px;">
                <div class="d-flex align-items-center mb-4">
                    <button type="button" class="btn btn-light me-3" id="close-payment-view" title="Go back">
                        <i class="bi bi-arrow-left"></i>
                    </button>
                    <h4 class="fw-bold text-secondary mb-0">Payment Management</h4>
                </div>
                
                <!-- Account Info -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <div class="info-label fw-bold text-muted small">Account Name:</div>
                                <div class="info-value fw-semibold">${client.name || 'N/A'}</div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="info-label fw-bold text-muted small">Account Number:</div>
                                <div class="info-value fw-semibold">${client.clientId || 'N/A'}</div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <div class="info-label fw-bold text-muted small">Address/Area:</div>
                                <div class="info-value">
                                    ${getBarangayName(client.barangay) || ''}
                                    ${client.sitio ? `, ${client.sitio}` : ''}
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="info-label fw-bold text-muted small">Classification:</div>
                                <div class="info-value">${getClassificationName(client.classification) || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Payment Selection -->
                <div class="card">
                    <div class="card-header">
                        <ul class="nav nav-tabs card-header-tabs" id="payable-tabs">
                            <li class="nav-item">
                                <a class="nav-link active" aria-current="true" href="#" data-view="billings">Monthly Billings</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="misc">Miscellaneous Fees</a>
                            </li>
                        </ul>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                            <table class="table table-sm table-hover">
                                <thead class="table-light" style="position: center; top: 0;">
                                    <tr>
                                        <th style="width: 40px;">
                                            <input type="checkbox" id="select-all-items" class="form-check-input">
                                        </th>
                                        <th>Code</th>
                                        <th>Billing</th>
                                        <th class="text-end">Amount</th>
                                        <th class="text-end">Discount</th>
                                        <th class="text-end">Amount to Pay</th>
                                        <th class="text-end">Balance</th>
                                    </tr>
                                </thead>
                                <tbody id="payable-items-list">
                                    ${this.generatePayableRows()}
                                </tbody>
                            </table>
                        </div>
                        <div class="row mt-3 g-2">
                            <div class="col-12">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="fw-bold">Gross:</span>
                                    <span class="fs-5 fw-bold" id="total-gross-left">₱0.00</span>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="d-flex justify-content-between align-items-center text-danger">
                                    <span class="fw-bold">Discount:</span>
                                    <span class="fs-5 fw-bold" id="total-discount-left">₱0.00</span>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="fw-bold">Amount Due:</span>
                                    <span class="fs-5 fw-bold text-danger" id="total-due-left">₱0.00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Payment Panel -->
            <div style="width: 400px; flex-shrink: 0;">
                ${this.generatePaymentPanel()}
            </div>
        </div>`;
    }

    generatePayableRows() {
        const items = this.currentView === 'billings' ? this.billings : this.miscFees;

        if (!items.length) {
            return `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-receipt me-2"></i>No unpaid ${this.currentView === 'billings' ? 'billings' : 'fee'} records found.
                </td>
            </tr>`;
        }

        return items
            .filter(item => parseCurrency(item.balance) > 0)
            .map((item, idx) => {
                const originalData = item.originalData || {};
                let discount = item.discount || 0;
                let lessAmount = item.lessAmount;
                let lessType = "";
                if (item.type === 'billings' && originalData.sortableDate) {
                    const [year, month] = originalData.sortableDate.split('-').map(Number);
                    const dueDate = new Date(year, month, 14);
                    const currentDate = new Date();

                    // if (currentDate <= dueDate) {
                    //     discount = item.paidAmount > 0 ? 0 : parseCurrency(item.amount) * 0.10;
                    // }
                }
                discount = discount + lessAmount;
                item.discount = discount;
                
                const balance = parseCurrency(item.balance - discount);
                const amountToPay = balance > 0 ? balance: 0;

                return `
            <tr data-item-id="${item.id}" data-type="${item.type}">
                <td>
                    <input type="checkbox" class="item-checkbox form-check-input" 
                           data-index="${idx}"
                           data-balance="${balance}"
                           data-lessAmount="${lessAmount}"
                           data-lessType="${lessType}"
                           data-discount="${discount}">
                </td>
                <td><span class="badge bg-secondary">${item.code}</span></td>
                <td>${item.description}</td>
                <td class="text-end">${formatCurrency(item.amount)}</td>
                <td class="text-end">${formatCurrency(discount)}</td>
                <td>
                    <input type="number" 
                           class="form-control form-control-sm payment-amount text-end" 
                           data-index="${idx}"
                           data-max-amount="${item.amount - discount}"
                           value="${amountToPay.toFixed(2)}" 
                           min="0" 
                           max="${item.amount - discount}"
                           step="0.01"
                           style="width: 120px; margin-left: auto;">
                </td>
                <td class="text-end fw-semibold ${balance > 0 ? 'text-danger' : 'text-success'}">
                    ${formatCurrency(balance)}
                </td>
            </tr>`;
            })
            .join('');
    }

    generatePaymentPanel() {
    return `
    <div class="card h-100 border-primary shadow-sm">

        <!-- Header -->
        <div class="card-header bg-primary text-white d-flex align-items-center">
            <i class="bi bi-cash-coin me-2 fs-5"></i>
            <h6 class="fw-bold mb-0">Cashier Payment</h6>
        </div>

        <!-- Payment Process -->
        <div class="card-body d-flex flex-column" id="payment-process-details">

            <!-- OR Number -->
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-semibold text-muted">OR Number</span>
                <span class="fs-5 fw-bold text-primary" id="or-number-display">
                    ${this.orNumber || 'Fetching...'}
                </span>
            </div>

            <hr class="my-2">

            <!-- Payment Summary -->
            <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-semibold">Total Amount Due</span>
                    <span class="fs-4 fw-bold text-danger" id="total-due">₱0.00</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-semibold">Change</span>
                    <span class="fs-4 fw-bold text-success" id="change-amount">₱0.00</span>
                </div>
            </div>

            <!-- Amount Tendered -->
            <div class="mb-3">
                <label class="form-label fw-semibold">Amount Tendered</label>
                <div class="input-group input-group-lg">
                    <span class="input-group-text">₱</span>
                    <input
                        type="number"
                        class="form-control text-end"
                        id="amount-tendered"
                        min="0"
                        step="0.01"
                        value="0.00"
                        placeholder="0.00"
                    >
                    <button class="btn btn-outline-primary" type="button" id="exact-amount-btn">
                        <i class="bi bi-check-lg me-1"></i>Exact
                    </button>
                </div>
            </div>

            <!-- Payment Method -->
            <div class="mb-3">
                <label class="form-label fw-semibold">Payment Method</label>
                <select class="form-select" id="payment-method">
                    ${CONFIG.PAYMENT_METHODS.map(method =>
                        `<option value="${method.value}">${method.label}</option>`
                    ).join('')}
                </select>
            </div>

            <!-- Remarks -->
            <div class="mb-4">
                <label class="form-label fw-semibold">Remarks</label>
                <textarea
                    class="form-control"
                    id="payment-remarks"
                    rows="2"
                    placeholder="Optional notes..."
                ></textarea>
            </div>

            <!-- Actions -->
            <div class="d-grid gap-2">
                <button type="button" class="btn btn-success btn-lg" id="process-payment">
                    <i class="bi bi-check-circle me-2"></i>Process Payment
                </button>
                <button type="button" class="btn btn-outline-secondary" id="toggle-payment-history">
                    <i class="bi bi-clock-history me-2"></i>View Payment History
                </button>
            </div>
        </div>

        <!-- Payment History -->
        <div class="card-body d-none" id="payment-history-section">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="fw-bold mb-0">Payment History</h6>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="close-payment-history">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div id="payment-history-content" class="border rounded p-3 bg-light flex-grow-1 overflow-auto">
                <div class="text-center text-muted py-3">
                    <i class="bi bi-hourglass-split me-2"></i>
                    Loading payment history...
                </div>
            </div>
        </div>

    </div>
    `;
}
   attachEventListeners() {
    const paymentDetails = document.getElementById('payment-process-details');
    const paymentHistory = document.getElementById('payment-history-section');
    const toggleHistoryBtn = document.getElementById('toggle-payment-history');
    const closeHistoryBtn = document.getElementById('close-payment-history');

    // Close Payment View
    document.getElementById('close-payment-view')?.addEventListener('click', () => {
        if (window.renderAccountsSection) {
            const mainContent = document.getElementById('main-content');
            window.renderAccountsSection(mainContent, this.primaryMainContent);
        } else {
            window.history.back();
        }
    });

    // Tab Switching
    document.querySelectorAll('#payable-tabs .nav-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();

            this.currentView = tab.dataset.view;

            document
                .querySelectorAll('#payable-tabs .nav-link')
                .forEach(t => t.classList.remove('active'));

            tab.classList.add('active');

            this.refreshPayablesList();
            this.updateTotalDue();
        });
    });

    this.attachPayableListListeners();

    // Amount Tendered
    document.getElementById('amount-tendered')
        ?.addEventListener('input', () => this.calculateChange());

    // Exact Amount
    document.getElementById('exact-amount-btn')?.addEventListener('click', () => {
        const totalDue = parseCurrency(
            document.getElementById('total-due')?.textContent
        );

        const input = document.getElementById('amount-tendered');
        if (!input) return;

        input.value = totalDue.toFixed(2);
        this.calculateChange();
    });

    // Process Payment
    document.getElementById('process-payment')
        ?.addEventListener('click', () => this.processPayment());

    // Print Receipt
    document.getElementById('print-receipt')
        ?.addEventListener('click', () => this.printReceipt());

    // View Payment History
    toggleHistoryBtn?.addEventListener('click', () => {
        if (!paymentDetails || !paymentHistory) return;

        paymentDetails.classList.add('d-none');
        paymentHistory.classList.remove('d-none');

        toggleHistoryBtn.classList.add('active');

        this.loadPaymentHistory();
    });

    // Close Payment History
    closeHistoryBtn?.addEventListener('click', () => {
        if (!paymentDetails || !paymentHistory) return;

        paymentHistory.classList.add('d-none');
        paymentDetails.classList.remove('d-none');

        toggleHistoryBtn?.classList.remove('active');
    });
}


    attachPayableListListeners() {
        // Select All Items
        document.getElementById('select-all-items')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.item-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            this.updateTotalDue();
        });

        // Individual Item Checkboxes
        document.querySelectorAll('.item-checkbox').forEach(cb => {
            cb.addEventListener('change', () => this.updateTotalDue());
        });

        // Payment Amount Inputs
        document.querySelectorAll('.payment-amount').forEach(input => {
            input.addEventListener('input', (e) => {
                this.validatePaymentAmount(e.target);
                this.updateTotalDue();
            });
            input.addEventListener('change', (e) => this.validatePaymentAmount(e.target));
        });
    }

    validatePaymentAmount(input) {
        const maxAmount = parseCurrency(input.dataset.maxAmount);
        let value = parseCurrency(input.value);

        if (value > maxAmount) {
            input.value = maxAmount.toFixed(2);
            this.showToast('Payment amount cannot exceed bill amount', 'warning');
        }

        if (value < 0) {
            input.value = '0.00';
        }

        // Update the corresponding checkbox
        const index = input.dataset.index;
        const checkbox = document.querySelector(`.item-checkbox[data-index="${index}"]`);
        if (value > 0) {
            checkbox.checked = true;
        }
    }

    updateTotalDue() {
        let totalNet = 0;
        let totalGross = 0;
        let totalDiscount = 0;
        const checkboxes = document.querySelectorAll('.item-checkbox:checked');

        checkboxes.forEach(cb => {
            const index = cb.dataset.index;
            const amountInput = document.querySelector(`.payment-amount[data-index="${index}"]`);
            
            const netAmount = parseCurrency(amountInput?.value);
            const balance = parseCurrency(cb.dataset.balance);
            const discount = parseCurrency(cb.dataset.discount);

            totalNet += netAmount;
            
            totalGross += balance;
            totalDiscount += discount;
        });

        // Update displays
        const totalDueSpan = document.getElementById('total-due');
        const totalDueLeftSpan = document.getElementById('total-due-left');
        const totalGrossLeftSpan = document.getElementById('total-gross-left');
        const totalDiscountLeftSpan = document.getElementById('total-discount-left');
        
        if (totalDueSpan) totalDueSpan.textContent = formatCurrency(totalNet);
        if (totalDueLeftSpan) totalDueLeftSpan.textContent = formatCurrency(totalNet);
        if (totalGrossLeftSpan) totalGrossLeftSpan.textContent = formatCurrency(totalGross);
        if (totalDiscountLeftSpan) totalDiscountLeftSpan.textContent = formatCurrency(totalDiscount);

        // Enable/disable process button
        const processBtn = document.getElementById('process-payment');
        if (processBtn) {
            processBtn.disabled = totalNet <= 0;
        }

        this.calculateChange();
    }

    calculateChange() {
        const tendered = parseCurrency(document.getElementById('amount-tendered')?.value);
        const due = parseCurrency(document.getElementById('total-due')?.textContent);
        const change = Math.max(0, tendered - due);
        const changeSpan = document.getElementById('change-amount');
        
        if (changeSpan) {
            changeSpan.textContent = formatCurrency(change);
            changeSpan.classList.toggle('text-danger', change < 0);
        }
    }

    calculateTotalBalance() {
        const items = this.currentView === 'billings' ? this.billings : this.miscFees;
        return items.reduce((total, item) => total + parseCurrency(item.balance), 0);
    }

    refreshPayablesList() {
        const payableList = document.getElementById('payable-items-list');
        if (payableList) {
            payableList.innerHTML = this.generatePayableRows();
            this.attachPayableListListeners();
        }
    }

 async processPayment() {
    const totalDue = parseCurrency(document.getElementById('total-due')?.textContent);
    const tendered = parseCurrency(document.getElementById('amount-tendered')?.value);
    
    if (!this.orNumber || !this.batchCode) {
        this.showToast('Cannot process payment: No available OR number. Please check OR registry.', 'error');
        return;
    }

    if (totalDue <= 0) {
        this.showToast('Please select items to pay', 'warning');
        return;
    }

    if (tendered < totalDue) {
        this.showToast(`Insufficient payment. Required: ${formatCurrency(totalDue)}`, 'error');
        return;
    }

    // Prepare allocation array - MUST match allocationSchema structure
    const allocation = [];
    
    document.querySelectorAll('.item-checkbox:checked').forEach(cb => {
        const tableRow = cb.closest('tr');
        if (!tableRow) return;

        const type = this.currentView === 'billings' ? 'billing' : 'misc';
        const cells = tableRow.querySelectorAll('td');
        if (cells.length < 7) return;
        
        const code = cells[1].textContent.trim();
        const description = cells[2].textContent.trim();
        const amountInput = tableRow.querySelector('.payment-amount');
        const payableCell = cells[3];
        const payable = parseCurrency(payableCell.textContent);
        const amount = parseCurrency(amountInput?.value);
        const discountCell = cells[4];
        let discount = parseCurrency(discountCell.textContent);
        
        if (amount > 0) {
            allocation.push({
                code: code,
                description: description,
                amount: amount,
                isPaidFull: payable - (amount + discount) <= 0? 1 : 0,
                discount: discount,
                type: type // 'billing' or 'misc'
            });
        }
    });

    if (allocation.length === 0) {
        this.showToast('No valid items selected for payment', 'warning');
        return;
    }

    console.log('Allocation being sent:', allocation);

    const clientAddress = [getBarangayName(this.client.barangay), this.client.sitio].filter(Boolean).join(', ');
       console.log("payment type:", this.currentView);
    const paymentData = {
        clientId: this.clientId,
        payor: this.client.name,
        address: clientAddress,
        batch: this.batchCode,
        orNumber: this.orNumber,
        type: this.currentView,
        paymentDate: new Date().toISOString().split('T')[0],
        totalAmount: totalDue,
        currency: 'PHP',
        paymentMethod: document.getElementById('payment-method')?.value || 'Cash',
        allocation: allocation,
        notes: document.getElementById('payment-remarks')?.value || ''
    };

    const totalAllocation = allocation.reduce((sum, item) => sum + item.amount, 0);
    if (Math.abs(totalDue - totalAllocation) > 0.01) {
        this.showToast(`Payment validation error: Total (${totalDue}) doesn't match allocation sum (${totalAllocation})`, 'error');
        return;
    }

    console.log('Payment data being sent:', {
        paymentData,
        allocationCount: allocation.length,
        allocationTotal: totalAllocation,
        totalDue: totalDue
    });

    try {
        const processBtn = document.getElementById('process-payment');
        const originalText = processBtn.innerHTML;
        processBtn.innerHTML = '<i class="bi bi-arrow-repeat spin me-2"></i>Processing...';
        processBtn.disabled = true;

        const savedPayment = await BillingService.createPayment(paymentData);

        console.log('Payment created successfully:', savedPayment);

        this.paymentData = {
            ...paymentData,
            id: savedPayment._id || savedPayment.id,
            batch: "",
            accountName: this.client.name,
            clientId: this.client.clientId,
            amountTendered: tendered,
            change: tendered - totalDue,
            date: new Date().toLocaleString('en-PH', { 
                timeZone: 'Asia/Manila',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            items: allocation.map(item => ({
                code: item.code,
                description: item.description,
                amount: item.amount,
                isPaidFull: item.isPaidFull,
                discount: item.discount
            })),
            savedPayment: savedPayment
        };

        const printBtn = document.getElementById('print-receipt');
        if (printBtn) printBtn.disabled = false;

        this.showPaymentSuccessPopup(savedPayment.orNumber);

        processBtn.innerHTML = originalText;
        processBtn.disabled = false;

        await this.refreshPayables();

        await this.fetchNextOR();

        this.clearPaymentForm();

    } catch (error) {
        console.error('Payment error:', error);
        
        let errorMessage = error.message;
        if (error.message.includes('validation failed')) {
            errorMessage = 'Payment validation failed. Please check the selected items.';
        } else if (error.message.includes('allocation')) {
            errorMessage = 'Please ensure at least one item is selected for payment.';
        } else if (error.message.includes('totalAmount')) {
            errorMessage = 'Payment amount validation error. Please try again.';
        }
        
        this.showToast(`Payment failed: ${errorMessage}`, 'error');
        
        const processBtn = document.getElementById('process-payment');
        if (processBtn) {
            processBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Process Payment';
            processBtn.disabled = false;
        }
    }
}

async refreshPayables() {
    try {
        [this.billings, this.miscFees] = await Promise.all([
            BillingService.fetchBillingsByClientId(this.clientId),
            MiscFeeService.fetchMiscFeesByClientId(this.clientId)
        ]);
        this.refreshPayablesList();
        this.updateTotalDue();
    } catch (error) {
        console.error('Failed to refresh payables:', error);
        this.showToast('Failed to refresh records.', 'error');
    }
}

// Add this helper method to clear the form after successful payment
clearPaymentForm() {
    document.querySelectorAll('.item-checkbox:checked').forEach(cb => {
        cb.checked = false;
    });
    
    document.querySelectorAll('.payment-amount').forEach(input => {
        const index = input.dataset.index;
        const items = this.currentView === 'billings' ? this.billings : this.miscFees;
        const item = items[index];
        if (item) {
            const balance = parseCurrency(item.balance || 0);
            const discount = parseCurrency(item.discount || 0);
            input.value = (balance - discount > 0 ? balance-discount: 0).toFixed(2);
        }
    });
    
    const amountTendered = document.getElementById('amount-tendered');
    if (amountTendered) amountTendered.value = '0.00';
    
    const remarks = document.getElementById('payment-remarks');
    if (remarks) remarks.value = '';
    
    this.updateTotalDue();
    this.calculateChange();
}

// Update the success popup method to use the actual OR number from backend
showPaymentSuccessPopup(orNumber) {
    const payment = this.paymentData;
    
    // Remove existing popup if any
    document.getElementById('payment-success-popup')?.remove();

    const popup = document.createElement('div');
    popup.id = 'payment-success-popup';
    popup.className = 'modal fade show d-block';
    popup.setAttribute('tabindex', '-1');
    popup.style.backgroundColor = 'rgba(0,0,0,0.5)';

    popup.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-success text-white">
                <h5 class="modal-title">
                    <i class="bi bi-check-circle-fill me-2"></i>Payment Successful
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="text-center mb-4">
                    <i class="bi bi-check-circle-fill text-success display-1"></i>
                </div>
                
                <div class="text-center mb-4">
                    <h4>Official Receipt</h4>
                    <h2 class="text-primary">${orNumber}</h2>
                    <small class="text-muted">${payment.date}</small>
                </div>
                
                <div class="border rounded p-3 mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Payor:</span>
                        <strong>${payment.accountName}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Account Number:</span>
                        <span>${payment.clientId || 'N/A'}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Payment Method:</span>
                        <span class="badge bg-info">${payment.paymentMethod}</span>
                    </div>
                </div>
                
                <div class="border-top pt-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Total Amount:</span>
                        <strong>${formatCurrency(payment.totalAmount)}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Amount Tendered:</span>
                        <span>${formatCurrency(payment.amountTendered)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Change:</span>
                        <span class="text-success fw-bold">${formatCurrency(payment.change)}</span>
                    </div>
                </div>
                
                <div class="alert alert-success mt-3">
                    <i class="bi bi-database-check me-2"></i>
                    Payment has been recorded in the system.
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="bi bi-x-circle me-2"></i>Close
                </button>
                <button type="button" class="btn btn-primary" id="popup-print-receipt">
                    <i class="bi bi-printer me-2"></i>Print Receipt
                </button>
                <button type="button" class="btn btn-success" id="popup-new-payment">
                    <i class="bi bi-plus-circle me-2"></i>New Payment
                </button>
            </div>
        </div>
    </div>`;

    document.body.appendChild(popup);

        // Add Bootstrap modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);

        // Event listeners
        const closeButtons = popup.querySelectorAll('[data-bs-dismiss="modal"], .btn-secondary');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                popup.remove();
                backdrop.remove();
            });
        });

        popup.querySelector('#popup-print-receipt').addEventListener('click', () => {
            this.printReceipt();
            popup.remove();
            backdrop.remove();
        });
    }

    printReceipt() {
        if (!this.paymentData) {
            this.showToast('No payment data available to print', 'warning');
            return;
        }

        // Use the existing printPaymentReceipt function
        if (typeof window.printPaymentReceipt === 'function') {
            window.printPaymentReceipt(this.paymentData);
        } else {
            // Fallback print function
            this.fallbackPrintReceipt();
        }
    }

    fallbackPrintReceipt() {
        const receiptWindow = window.open('', '_blank');
        if (!receiptWindow) {
            this.showToast('Please allow popups to print receipt', 'warning');
            return;
        }

        const payment = this.paymentData;
        const receiptContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Official Receipt - ${payment.orNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .receipt { max-width: 300px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .details { margin: 15px 0; }
                    .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { border-top: 1px solid #000; padding-top: 10px; margin-top: 15px; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h2>OFFICIAL RECEIPT</h2>
                        <p><strong>OR#:</strong> ${payment.orNumber}</p>
                        <p><strong>Date:</strong> ${payment.date}</p>
                    </div>
                    
                    <div class="details">
                        <p><strong>Payor:</strong> ${payment.accountName}</p>
                        <p><strong>Meter No:</strong> ${payment.meterNumber}</p>
                    </div>
                    
                    <div class="items">
                        <h4>Payment Details:</h4>
                        ${payment.items.map(item => {
                            const grossAmount = (parseCurrency(item.amount) + parseCurrency(item.discount));
                            let itemHtml = `
                                <div class="item-row">
                                    <span>${item.description}</span>
                                    <span>${formatCurrency(grossAmount)}</span>
                                </div>
                            `;
                            if (item.discount && parseCurrency(item.discount) > 0) {
                                itemHtml += `
                                    <div class="item-row">
                                        <span style="padding-left: 15px;">Less: Discount</span>
                                        <span>(${formatCurrency(item.discount)})</span>
                                    </div>
                                `;
                            }
                            return itemHtml;
                        }).join('')}
                    </div>
                    
                              <div class="total">
                                <div class="item-row">
                                  <strong>Total Amount:</strong>
                                  <strong>${formatCurrency(parseCurrency(payment.totalAmount))}</strong>
                                d_stringiv>
                                <div class="item-row">
                                  <span>Amount Tendered:</span>
                                  <span>${formatCurrency(parseCurrency(payment.amountTendered))}</span>
                                </div>
                                <div class="item-row">
                                  <span>Change:</span>
                                  <span>${formatCurrency(parseCurrency(payment.change))}</span>
                                </div>
                              </div>                    
                    <div class="footer">
                        <p>Thank you for your payment!</p>
                        <p>Payment Method: ${payment.paymentMethod}</p>
                        <p>Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    }
                </script>
            </body>
            </html>
        `;
        receiptWindow.document.write(receiptContent);
    }

    async loadPaymentHistory() {
        const content = document.getElementById('payment-history-content');
        if (!content) return;

        content.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading payment history...</p>
            </div>`;

        try {
            if (!this.clientId) {
                throw new Error('Could not resolve a valid client ID for payment history.');
            }

            const res = await fetch(`/api/payments/client/${encodeURIComponent(this.clientId)}`);
            if (!res.ok) throw new Error(`Failed to fetch payments: ${res.status}`);
            const body = await res.json();
            let payments = (body && body.data && body.data.items) ? body.data.items : [];
            payments = payments.filter(payment => payment.status !== "cancelled");

            console.log('Fetched payments:', payments);

            if (!payments.length) {
                content.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-receipt display-6 mb-3"></i>
                        <p>No payment history found</p>
                    </div>`;
                return;
            }

            content.innerHTML = `
                <div class="table-responsive" style="max-height: 700px; overflow-y: auto;">
                    <table class="table table-sm">
                        <thead class="table-light sticky-top">
                            <tr>
                                <th>OR Number</th>
                                <th>Date</th>
                                <th class="text-end">Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.map(payment => `
                                <tr>
                                    <td><span class="badge bg-light text-dark">${payment.orNumber || ''}</span></td>
                                    <td>${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : ''}</td>
                                    <td class="text-end">${formatCurrency(parseCurrency(payment.totalAmount || payment.amount || 0))}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary view-payment-details" 
                                                data-or="${payment.orNumber || ''}" data-id="${payment._id || ''}">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;

            // Add event listeners to view and reprint buttons
            content.querySelectorAll('.view-payment-details').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnEl = e.currentTarget;
                    const orNumber = btnEl.dataset.or;
                    const id = btnEl.dataset.id;
                    console.log("This is payment ID:", id);
                    this.showPaymentDetails(id);
                });
            });

            content.querySelectorAll('.reprint-payment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.reprintPaymentById(id);
                });
            });

        } catch (error) {
            console.error('loadPaymentHistory error', error);
            content.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Failed to load payment history: ${error.message}
                </div>`;
        }
    }

    async showPaymentDetails(paymentId) {
        if (!paymentId) {
            this.showToast('Invalid payment ID.', 'error');
            return;
        }

        try {
            const res = await fetch(`/api/payments/${paymentId}`);
            if (!res.ok) {
                throw new Error(`Failed to fetch payment details: ${res.status}`);
            }
            const body = await res.json();
            const payment = body.data;

            if (!payment) {
                this.showToast('Payment details not found.', 'error');
                return;
            }

            // Create and show the modal
            this._createPaymentDetailModal(payment);

        } catch (error) {
            console.error('showPaymentDetails error', error);
            this.showToast(error.message, 'error');
        }
    }

    _createPaymentDetailModal(payment) {
        // Remove existing modal if any
        document.getElementById('payment-detail-modal')?.remove();
        const backdrop = document.querySelector('.modal-backdrop');
        if(backdrop) backdrop.remove();

        const modal = document.createElement('div');
        modal.id = 'payment-detail-modal';
        modal.className = 'modal fade show d-block';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Payment Details (OR# ${payment.orNumber})</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Payor:</strong> ${payment.payor}</p>
                        <p><strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}</p>
                        <h6>Allocations:</h6>
                        <div class="allocation-details" style="font-size: 0.9rem;">
                            ${payment.allocation.map(alloc => {
                                const grossAmount = (parseCurrency(alloc.amount) || 0) + (parseCurrency(alloc.discount) || 0);
                                let itemHtml = `
                                    <div class="d-flex justify-content-between pt-2">
                                        <span>${alloc.description}</span>
                                        <span>${formatCurrency(grossAmount)}</span>
                                    </div>
                                `;
                                if (alloc.discount && parseCurrency(alloc.discount) > 0) {
                                    itemHtml += `
                                        <div class="d-flex justify-content-between">
                                            <span class="text-muted ps-3">Less: Discount</span>
                                            <span class="text-muted">(${formatCurrency(alloc.discount)})</span>
                                        </div>
                                    `;
                                }
                                return itemHtml;
                            }).join('')}
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between fw-bold">
                            <span>Total Amount Paid:</span>
                            <span>${formatCurrency(parseCurrency(payment.totalAmount))}</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="modal-print-receipt">Print</button>
                        <button type="button" class="btn btn-danger" id="modal-cancel-payment">Cancel Payment</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add backdrop
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(modalBackdrop);

        // Event listeners
        const closeModal = () => {
            modal.remove();
            modalBackdrop.remove();
        };

        modal.querySelector('[data-bs-dismiss="modal"]').addEventListener('click', closeModal);
        modal.querySelector('.btn-secondary').addEventListener('click', closeModal);

        modal.querySelector('#modal-print-receipt').addEventListener('click', () => {
            // Reconstruct payment data for printing
            const printablePaymentData = {
                ...payment,
                accountName: payment.payor,
                // These fields might not be available directly on the payment object
                // and may need to be fetched or reconstructed differently if required.
                meterNumber: this.client.meterNumber, 
                amountTendered: payment.totalAmount, // Assuming tendered is total, change will be 0
                change: 0,
                date: new Date(payment.paymentDate).toLocaleString(),
                items: payment.allocation
            };
            this.paymentData = printablePaymentData;
            this.printReceipt();
        });

        modal.querySelector('#modal-cancel-payment').addEventListener('click', async () => {
            if (confirm('Are you sure you want to cancel this payment? This action cannot be undone.')) {
                await this.cancelPayment(payment.orNumber, payment.batch); // Pass orNumber and batchCode
                closeModal();
            }
        });
    }

    async cancelPayment(orNumber, batchCode) { // Accept orNumber and batchCode
        try {
            const res = await fetch(`/api/payments/cancel-payment`, { // New endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orNumber, batchCode}), // Send in body
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to cancel payment');
            }

            const result = await res.json();

            if (result.success) {
                this.showToast('Payment cancelled successfully.', 'success');
                await this.loadPaymentHistory(); // Refresh the history view
                await this.refreshPayables(); // Also refresh unpaid bills
                await this.fetchNextOR(); // Refresh OR number
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('cancelPayment error', error);
            this.showToast(error.message, 'error');
        }
    }


    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>`;

        document.body.appendChild(toast);

        // Initialize and show toast
        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();
    }
}

// Main function to render payment view
window.renderPaymentView = async function(clientId, clientData, primaryMainContent) {


    try {
        const paymentView = new PaymentView(clientId, clientData, primaryMainContent);
        await paymentView.initialize();
    } catch (error) {
        console.error('Failed to render payment view:', error);
        
        // Show error state
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Error Loading Payment View</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-outline-danger" onclick="window.location.reload()">
                        <i class="bi bi-arrow-clockwise"></i> Retry
                    </button>
                </div>`;
        }
    }
};

    function printReceipt() {
      try {
        const receiptData = Object.assign({}, officialReceiptTemplate);
        receiptData.items = receiptData.items || [];
        receiptData.paymentMethod = receiptData.paymentMethod || 'cash';
        receiptData.municipality = "Manukan";
        printPaymentReceipt(receiptData);
      } catch (error) {
        console.error('Print error:', error);
        alert('⚠️ Error generating receipt. Please try again.');
      }
    }

    // Print payment receipt
    function printPaymentReceipt(receiptData) {
      receiptData = receiptData || officialReceiptTemplate || {};
      // Correctly calculate total amount as the sum of net amounts paid
      const totalAmount = (receiptData.items || []).reduce((s, it) => s + parseCurrency(it.amount), 0);

      function escapeHtml(str) {
        if (!str && str !== 0) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }

      function formatCurrencyPrint(v) { 
        const n = parseCurrency(v);
        return n ? '₱' + formatAmount(n.toFixed(2)) : '';
      }
      
      function formatDateShort(d) {
        if (!d) return '';
        const dt = new Date(d);
        if (isNaN(dt)) return String(d);
        const mm = String(dt.getMonth()+1).padStart(2,'0');
        const dd = String(dt.getDate()).padStart(2,'0');
        const yy = dt.getFullYear();
        return mm + '/' + dd + '/' + yy;
      }

      function generateItemRows(recieptData, c) {
        const items = recieptData.items || [];
        let currentTop1 = c.itemsStart.top + 0 * c.itemLineHeight;
        let rows = '';
        let lineIndex = 0;
        const maxLines = 11; // Total available lines for items

        if (recieptData.type === 'billings') {
         rows += `
                <div class="abs" style="top:${currentTop1}mm; left:${c.itemsStart.leftDesc}mm; width:60mm; overflow:hidden; font-size:12px;">
                  ${'Payment of water service for'}
                </div>
                <div class="abs" style="top:${currentTop1}mm; left:${c.itemsStart.leftAcct}mm; width:18mm; text-align:center; font-size:12px">
                </div>
                <div class="abs amt" style="top:${currentTop1}mm; left:${c.itemsStart.leftAmt}mm; width:22mm; text-align:right; font-size:12px">
                </div>
            `;
            lineIndex++;
        }
let leading = '';
        for (const it of items) {
            if (lineIndex >= maxLines) break;
            let currentTop = c.itemsStart.top + lineIndex * c.itemLineHeight;
            const grossAmount = (parseCurrency(it.amount) || 0) + (parseCurrency(it.discount) || 0);
            const desc = escapeHtml(it.description || '');
            const acct = escapeHtml(it.accountCode || receiptData.accountCode || '115');  // account code
            const amt = formatCurrencyPrint(grossAmount);
if (recieptData.type === 'billings') {
            leading = lineIndex > 1? (it.code.includes("2025-12")? it.isPaidFull === 1? '(Full payment)Prev. month/s bill': '(Partial payment)Prev. month/s bill' : it.isPaidFull === 1? `(Full payment)${desc}` : `(Partial payment)${desc}`) : (it.code.includes("2025-12")? it.isPaidFull === 1? '(Full payment)Prev. month/s bill': '(Par. payment)Prev. month/s bill' : it.isPaidFull === 1? `(Full payment)${desc}` : `(Partial payment)${desc}`);
     } else { 
            leading = desc;
           }
            rows += `
                <div class="abs" style="top:${currentTop}mm; left:${c.itemsStart.leftDesc}mm; width:60mm; overflow:hidden; font-size:12px;">
                  ${leading}
                </div>
                <div class="abs" style="top:${currentTop}mm; left:${c.itemsStart.leftAcct}mm; width:18mm; text-align:center; font-size:12px">
                  ${acct}
                </div>
                <div class="abs amt" style="top:${currentTop}mm; left:${c.itemsStart.leftAmt}mm; width:22mm; text-align:right; font-size:12px">
                  ${amt}
                </div>
            `;
            lineIndex++;

            if (it.discount && parseCurrency(it.discount) > 0 && lineIndex < maxLines) {
                currentTop = c.itemsStart.top + lineIndex * c.itemLineHeight;
                const discountDesc = "10% Discount";
                const discountAmtFormatted = `(${formatCurrencyPrint(it.discount)})`;

                rows += `
                <div class="abs" style="top:${currentTop}mm; left:${c.itemsStart.leftDesc}mm; width:60mm; overflow:hidden; font-size:12px;">
                  ${discountDesc}
                </div>
                <div class="abs" style="top:${currentTop}mm; left:${c.itemsStart.leftAcct}mm; width:18mm; text-align:center; font-size:12px">
                  ${""}
                </div>
                <div class="abs amt" style="top:${currentTop}mm; left:${c.itemsStart.leftAmt}mm; width:22mm; text-align:right; font-size:12px">
                  ${discountAmtFormatted}
                </div>
            `;
                lineIndex++;
            }
        }
        return rows;
      }

      function formatAmount(value) {
        const num = parseCurrency(value);
        return num.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }

      function numberToWordsCheckFormat(amount) {
        amount = parseCurrency(amount);
        function numberToWords(num) {
          const belowTwenty = [
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
            "Sixteen", "Seventeen", "Eighteen", "Nineteen"
          ];

          const tens = [
            "", "", "Twenty", "Thirty", "Forty", "Fifty",
            "Sixty", "Seventy", "Eighty", "Ninety"
          ];

          const thousands = ["", "Thousand", "Million", "Billion", "Trillion"];

          function helper(n) {
            if (n === 0) return "";
            else if (n < 20) return belowTwenty[n] + " ";
            else if (n < 100) return tens[Math.floor(n / 10)] + " " + helper(n % 10);
            else return belowTwenty[Math.floor(n / 100)] + " Hundred " + helper(n % 100);
          }

          if (num === 0) return "Zero";

          let word = "";
          let i = 0;

          while (num > 0) {
            if (num % 1000 !== 0) {
              word = helper(num % 1000) + thousands[i] + " " + word;
            }
            num = Math.floor(num / 1000);
            i++;
          }

          return word.trim();
        }

        const [pesoPart, centPart] = amount.toString().split(".");
        const pesos = parseInt(pesoPart);
        const cents = parseInt((centPart || "0").padEnd(2, "0").slice(0, 2));

        let result = numberToWords(pesos) + " Pesos";

        if (cents > 0) {
          result += " and " + cents.toString().padStart(2, "0") + "/100";
        }

        return result + " Only";
      }

      const coords = {
        municipality: { top: 12, left: 28, width: 64, align: 'left' },
        date: { top: 39, left: 5 },
        agency: { top: 47, left: 5, width: 90 },
        payor: { top: 55, left: 5, width: 90 },
        itemsStart: { top: 71, leftDesc: 1, leftAcct: 41, leftAmt: 60 },
        itemLineHeight: 5.7,
        total: { top: 135, leftAmt: 18 },
        wordAmount: { top: 144, leftAmt: 1 },
        methodCash: { top: 155, left: 1 },
        methodCheck: { top: 165, left: 1 },
        cashier: { top: 183, left: 41, width: 40 }
      };

      const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>OR ${escapeHtml(receiptData.number || '')}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #f8f9fa;
      font-family: "Segoe UI", Arial, sans-serif;
    }

    .page {
      width: 4in;
      height: 8.5in;
      position: relative;
      background: #ffffff;
      margin: 20px auto;
      padding: 10px;
      box-shadow: 0 0 8px rgba(0,0,0,0.15);
      border-radius: 6px;
      box-sizing: border-box;
    }

    .abs { position: absolute; white-space: nowrap; }
    .amt { font-variant-numeric: tabular-nums; }
    .print-btns button { margin-right: 6px; }

    @media print {
      body, .page {
        margin: 0;
        padding: 0;
        box-shadow: none !important;
        border-radius: 0 !important;
        background: #fff;
      }
      .no-print { display: none !important; }
    }
}
  </style>
</head>

<body>
  <div class="page">
    <div class="no-print print-btns position-absolute" style="top:8in; left:35mm; z-index:999;">
      
    </div>

    <div class="abs fw-bold" 
         style="top:${coords.municipality.top}mm; left:${coords.municipality.left}mm; width:${coords.municipality.width}mm; font-size:17px;">
      ${escapeHtml(receiptData.municipality || 'Manukan')}
    </div>

    <div class="abs" 
         style="top:${coords.date.top}mm; left:${coords.date.left}mm; font-size:14px;">
      ${new Date(receiptData.date || '').toLocaleDateString()}
    </div>

    <div class="abs" 
         style="top:${coords.agency.top}mm; left:${coords.agency.left}mm; width:${coords.agency.width}mm; font-size:14px;">
      ${escapeHtml('LGU')}
    </div>

    <div class="abs" 
         style="top:${coords.payor.top}mm; left:${coords.payor.left}mm; width:${coords.payor.width}mm; font-size:14px;">
      ${escapeHtml(receiptData.payor || '')}
    </div>

    ${generateItemRows(receiptData || [], coords)}

    <div class="abs amt fw-bold text-end"
         style="top:${coords.total.top}mm; right:${coords.total.leftAmt}mm; font-size:15px;">
      ${formatAmount(totalAmount).replace('₱', ' ')}
    </div>

    ${(() => {
      const text = numberToWordsCheckFormat(totalAmount) || '';
      const maxChars = 115;
      const lines = [];
      for (let i = 0; i < text.length; i += maxChars) {
        lines.push(text.substring(i, i + maxChars));
      }
      return lines.map((ln, idx) => `
        <div class="abs" style="
          top:${coords.wordAmount.top + idx * 6}mm;
          left:${coords.wordAmount.leftAmt}mm;
          font-size:14px;
          white-space:normal;
          width:3.5in;
          line-height: 12px;
        ">
          ${escapeHtml(ln).trim()}
        </div>
      `).join('');
    })()}

    <div class="abs" style="top:${coords.methodCash.top}mm; left:${coords.methodCash.left}mm;">
      ${receiptData.paymentMethod?.toLowerCase().includes('cash') ? '&#10003;' : ''}
    </div>

    <div class="abs" style="top:${coords.methodCheck.top}mm; left:${coords.methodCheck.left}mm;">
      ${receiptData.paymentMethod?.toLowerCase().includes('check') ? '&#10003;' : ''}
    </div>

    <div class="abs text-center"
         style="top:${coords.cashier.top}mm; left:${coords.cashier.left}mm; width:${coords.cashier.width}mm;">
      ${escapeHtml(receiptData.cashier || '')}
    </div>
  </div>

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
  <script>
    window.addEventListener('load', () => {
      window.print();
      setTimeout(() => window.close(), 100);
    });
  </script>
</body>
</html>
`;

      try {
        const w = window.open('', '_blank');
        if (!w) {
          alert('⚠️ Popup blocked. Please allow popups and try again.');
          return;
        }
        w.document.write(html);
        w.document.close();
        w.focus();
      } catch (error) {
        console.error('Print window error:', error);
        alert('⚠️ Error opening print preview. Please check browser settings.');
      }
    }

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
    .spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
    }
`;
document.head.appendChild(style);