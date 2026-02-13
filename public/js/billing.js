$(document).ready(function() {
    const billingTableBody = $('#billingTableBody');
    const yearFilter = $('#yearFilter');
    const monthSelectFilter = $('#monthSelectFilter');
    const searchByName = $('#searchByName');
    let allBillings = []; // To store all fetched billings for client-side filtering
    let currentBillingInModal = null; // To hold data for the bill in the modal

    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2020; year--) {
        yearFilter.append(new Option(year, year));
    }

    // Function to fetch all billings (or filtered by month)
    const fetchBillings = (month = '') => {
        let url = '/api/billings';
        if (month) {
            url += `?sortableDate=${month}`;
        }

        $.ajax({
            url: url,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data.length > 0) {
                    allBillings = response.data; // Store all fetched billings
                    displayBillings(allBillings);
                } else {
                    allBillings = [];
                    displayBillings([]);
                }
            },
            error: function(err) {
                console.error('Error fetching billings:', err);
                billingTableBody.empty().append('<tr><td colspan="10" class="text-center">Error fetching data.</td></tr>');
            }
        });
    };

    // Function to display billings (and filter by name)
    const displayBillings = (billings) => {
        billingTableBody.empty();
        const nameQuery = searchByName.val().toLowerCase();

        const filteredBillings = billings.filter(billing =>
            billing.name.toLowerCase().includes(nameQuery)
        );

        if (filteredBillings.length > 0) {
            filteredBillings.forEach(billing => {
                const row = `
                    <tr>
                        <td>${billing.billingID}</td>
                        <td>${billing.clientId}</td>
                        <td>${billing.name}</td>
                        <td>${billing.meterNum}</td>
                        <td>${billing.sortableDate}</td>
                        <td>${billing.consumption}</td>
                        <td>${billing.currentBilling}</td>
                        <td>${billing.remainingBalance}</td>
                        <td>${billing.isRead === 0 ? '<span class="text-danger">Unread</span>' : '<span class="text-success">Read</span>'}</td>
                        <td>
                            <button class="btn btn-sm btn-info view-billing-btn" data-id="${billing._id}">View</button>
                        </td>
                    </tr>
                `;
                billingTableBody.append(row);
            });
        } else {
            billingTableBody.append('<tr><td colspan="10" class="text-center">No billing records found.</td></tr>');
        }
    };

    // Set default month to latest month
    const today = new Date();
    yearFilter.val(today.getFullYear());
    monthSelectFilter.val((today.getMonth() + 1).toString().padStart(2, '0'));
    const currentMonth = `${yearFilter.val()}-${monthSelectFilter.val()}`;
    fetchBillings(currentMonth);

    // Filter by month using the Apply Filter button
    $('#applyMonthFilter').on('click', function() {
        const selectedMonth = `${yearFilter.val()}-${monthSelectFilter.val()}`;
        fetchBillings(selectedMonth);
    });

    // Search by Name
    searchByName.on('keyup', function() {
        displayBillings(allBillings); // Re-display with current name filter
    });

    // Handle View button click (delegated event)
    $(document).on('click', '.view-billing-btn', function() {
        const billingId = $(this).data('id');
        viewBilling(billingId);
    });

    // Function to fetch a single billing record and open modal
    window.viewBilling = function(id) {
        $.ajax({
            url: `/api/billings/${id}`, // Assuming this endpoint exists
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    currentBillingInModal = response.data;
                    const billing = response.data;
                    $('#editBillingId').val(billing._id);

                    // Populate client info
                    $('#editClientName').val(billing.name || '');
                    $('#editClientId').val(billing.clientId || '');
                    $('#editMeterNum').val(billing.meterNum || '');
                    $('#editCurrent').val(billing.currentReading || '');
                    $('#editPrevious').val(billing.previousReading || '');
                    $('#editLessAmount').val(billing.lessAmount || 0);
                    $('#editDiscount').val(billing.discount || 0);
                    $('#editFreeCubic').val(billing.freeCubic || 0);
                    
                    // Show the modal
                    const editBillingModal = new bootstrap.Modal(document.getElementById('editBillingModal'));
                    editBillingModal.show();
                } else {
                    alert('Billing record not found.');
                }
            },
            error: function(err) {
                console.error('Error fetching billing details:', err);
                alert('An error occurred while fetching billing details.');
            }
        });
    };

    // Handle Save Changes button click in modal
    $('#saveBillingChanges').on('click', function() {
        const billingId = $('#editBillingId').val();
        const updatedData = {
            currentReading: parseFloat($('#editCurrent').val()),
            previousReading: parseFloat($('#editPrevious').val()),
            lessAmount: parseFloat($('#editLessAmount').val()),
            discount: parseFloat($('#editDiscount').val()),
            freeCubic: parseFloat($('#editFreeCubic').val())
        };

        $.ajax({
            url: `/api/billings/${billingId}`, // Assuming PUT endpoint exists for updates
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedData),
            success: function(response) {
                if (response.success) {
                    alert(response.message);
                    currentBillingInModal = response.data; // Update data for printing

                    // Update the record in allBillings array
                    const index = allBillings.findIndex(b => b._id === currentBillingInModal._id);
                    if (index !== -1) {
                        allBillings[index] = currentBillingInModal;
                    }
                    displayBillings(allBillings); // Re-render table
                } else {
                    alert(`Error updating billing: ${response.message}`);
                }
            },
            error: function(err) {
                console.error('Error updating billing:', err);
                alert('An error occurred while updating the billing record.');
            }
        });
     });

    // Print single bill from modal
// Print single bill from modal (DL ENVELOPE – PORTRAIT)
$('#printSingleBillBtn').on('click', function () {
    if (!currentBillingInModal) {
        alert('No billing data available to print.');
        return;
    }

    const bill = currentBillingInModal;
    const totalDue = (bill.currentBilling || 0) + (bill.remainingBalance || 0);
    const discounted = totalDue - (totalDue * 0.10);

    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>Water Billing Statement</title>

    <style>
        /* DL ENVELOPE – PORTRAIT */
        @page {
            size: 110mm 220mm;
            margin: 0;
        }

        html, body {
            width: 110mm;
            height: 220mm;
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #000;
        }

        body {
            box-sizing: border-box;
        }

        .bill {
            width: 110mm;
            height: 220mm;
            padding: 8mm;
            box-sizing: border-box;
        }

        .center { text-align: center; }

        p { margin: 2px 0; }

        .title {
            font-size: 13px;
            font-weight: bold;
            margin-top: 4px;
        }

        hr {
            border: none;
            border-top: 1px solid #000;
            margin: 6px 0;
        }

        .row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
        }

        .label {
            white-space: nowrap;
        }

        .value {
            font-weight: 600;
            text-align: right;
        }

        .total {
            font-size: 12px;
            font-weight: bold;
            margin-top: 4px;
        }

        .note {
            border-top: 1px dashed #000;
            margin-top: 6px;
            padding-top: 4px;
            font-weight: bold;
            text-align: center;
            color: #b00000;
            font-size: 10px;
        }

        .footer {
            text-align: center;
            font-size: 9px;
            margin-top: 6px;
        }

        .no-print {
            display: none;
        }
    </style>
</head>

<body onload="window.print()">
    <div class="bill">

        <div class="center">
            <p>Republic of the Philippines</p>
            <p><strong>PROVINCE OF ZAMBOANGA DEL NORTE</strong></p>
            <p><em>Municipality of Manukan</em></p>
            <p>Billing & Collection Division</p>

            <p class="title">MANUKAN WATERWORKS SYSTEM</p>
            <p><strong>BILLING STATEMENT</strong></p>
        </div>

        <hr>

        <div>
            <div class="row"><span class="label">Meter No.</span><span class="value">${bill.meterNum || ''}</span></div>
            <div class="row"><span class="label">Name</span><span class="value">${bill.name || ''}</span></div>
            <div class="row"><span class="label">Address</span><span class="value">${bill.address || ''}</span></div>
            <div class="row"><span class="label">Classification</span><span class="value">${bill.classification || 'Residential'}</span></div>
        </div>

        <hr>

        <div>
            <div class="row"><span class="label">Billing Month</span><span class="value">${bill.sortableDate || ''}</span></div>
            <div class="row">
                <span class="label">Period Covered</span>
                <span class="value">${bill.prevReadDate || ''} – ${bill.readDate || ''}</span>
            </div>
        </div>

        <hr>

        <div>
            <div class="row"><span class="label">Present Reading</span><span>${bill.currentReading || 0}</span></div>
            <div class="row"><span class="label">Previous Reading</span><span>${bill.previousReading || 0}</span></div>
            <div class="row"><span class="label">Consumption (m³)</span><span>${bill.consumption || 0}</span></div>
            <div class="row"><span class="label">Current Billing</span><span>₱ ${Number(bill.currentBilling || 0).toFixed(2)}</span></div>
            <div class="row"><span class="label">Previous Balance</span><span>₱ ${Number(bill.remainingBalance || 0).toFixed(2)}</span></div>
        </div>

        <hr>

        <div class="row total">
            <span>TOTAL AMOUNT DUE</span>
            <span>₱ ${totalDue.toFixed(2)}</span>
        </div>

        <hr>

        <div>
            <div class="row"><span class="label">Due Date</span><span class="value">${bill.dueDate || ''}</span></div>
            <div class="row">
                <span class="label">On / Before Due Date (10% Disc.)</span>
                <span>₱ ${discounted.toFixed(2)}</span>
            </div>
            <div class="row">
                <span class="label">After Due Date</span>
                <span>₱ ${totalDue.toFixed(2)}</span>
            </div>
        </div>

        <hr>

        <div class="center">
            <p><strong>Reading In-Charge</strong></p>
            <p><strong>${bill.reader || 'CHRISTIAN B. ALIA'}</strong></p>
            <p>${bill.readerContact || '09053148536 / 09092018543'}</p>
        </div>

        <div class="note">
            NOTE: ACCOUNT IS SUBJECT TO DISCONNECTION AT ANY TIME FOR NON-PAYMENT.
        </div>

        <div class="footer">
            Printed on ${new Date().toLocaleString()}
        </div>

    </div>
</body>
</html>
    `);

    printWindow.document.close();
});


    // end of printable bill
    // --- Start of Integrated Billing Management Code ---
    const configForm = document.getElementById('billing-config-form');
    const generateForm = document.getElementById('generate-billing-form');
    const messageArea = document.getElementById('message-area');

    // Input fields
    const resMin = document.getElementById('res-min');
    const resCubic = document.getElementById('res-cubic');
    const comMin = document.getElementById('com-min');
    const comCubic = document.getElementById('com-cubic');
    const instMin = document.getElementById('inst-min');
    const instCubic = document.getElementById('inst-cubic');
    const indMin = document.getElementById('ind-min');
    const indCubic = document.getElementById('ind-cubic');
    const billingMonth = document.getElementById('billing-month');

    // Fetch existing config when management modal is shown
    const billingManagementModal = document.getElementById('billingManagementModal');
    billingManagementModal.addEventListener('show.bs.modal', () => {
        fetch('/api/billings/config')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const { rates } = result.data;
                    resMin.value = rates.residential.minimum;
                    resCubic.value = rates.residential.perCubic;
                    comMin.value = rates.commercial.minimum;
                    comCubic.value = rates.commercial.perCubic;
                    instMin.value = rates.institutional.minimum;
                    instCubic.value = rates.institutional.perCubic;
                    indMin.value = rates.industrial.minimum;
                    indCubic.value = rates.industrial.perCubic;
                } else {
                    showMessage(result.message, 'danger');
                }
            })
            .catch(err => {
                console.error('Error fetching billing config:', err);
                showMessage('Could not load billing configuration.', 'danger');
            });
    });


    // Handle config form submission
    $('#billing-config-form').on('submit', function(e) {
        e.preventDefault();

        const rates = {
            residential: {
                minimum: parseFloat(resMin.value),
                perCubic: parseFloat(resCubic.value)
            },
            commercial: {
                minimum: parseFloat(comMin.value),
                perCubic: parseFloat(comCubic.value)
            },
            institutional: {
                minimum: parseFloat(instMin.value),
                perCubic: parseFloat(instCubic.value)
            },
            industrial: {
                minimum: parseFloat(indMin.value),
                perCubic: parseFloat(indCubic.value)
            }
        };

        $.ajax({
            url: '/api/billings/config',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ rates }),
            success: function(result) {
                if (result.success) {
                    showMessage(result.message, 'success');
                } else {
                    showMessage(result.message, 'danger');
                }
            },
            error: function(err) {
                console.error('Error updating billing config:', err);
                showMessage('An error occurred while saving the configuration.', 'danger');
            }
        });
    });

    // Handle billing generation form submission
    $('#generate-billing-form').on('submit', function(e) {
        e.preventDefault();
        const month = billingMonth.value;

        if (!month) {
            showMessage('Please select a month to generate billing.', 'danger');
            return;
        }

        $.ajax({
            url: '/api/billings/generate-billing',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ month }),
            success: function(result) {
                if (result.success) {
                    const message = `${result.message} Generated: ${result.generated}, Skipped: ${result.skipped}.`;
                    showMessage(message, 'success');
                    fetchBillings(month); // Refresh the table with the newly generated month 
                } else {
                    showMessage(result.message, 'danger');
                }
            },
            error: function(err) {
                console.error('Error generating billing:', err);
                showMessage('An error occurred while generating billing.', 'danger');
            }
        });
    });

    function showMessage(message, type = 'success') {
        messageArea.textContent = message;
        messageArea.className = `alert alert-${type}`;
        messageArea.style.display = 'block';

        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 5000);
    }
    // --- End of Integrated Billing Management Code ---

    // --- Download for Reading ---
    $('#downloadForReadingBtn').on('click', function() {
        const btn = $(this);
        const originalText = btn.html();
        btn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Preparing...').prop('disabled', true);

        $.ajax({
            url: '/api/billings/download-for-reading',
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    const latestMonth = response.latestMonth;
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", `ForReading-${latestMonth}.json`);
                    document.body.appendChild(downloadAnchorNode); // required for firefox
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                    showMessage('Data download started.', 'success');
                } else {
                    showMessage('Error: ' + response.message, 'danger');
                }
            },
            error: function(err) {
                console.error('Error downloading data:', err);
                showMessage('An error occurred while downloading the data.', 'danger');
            },
            complete: function() {
                btn.html(originalText).prop('disabled', false); // Restore button
            }
        });
    });
});