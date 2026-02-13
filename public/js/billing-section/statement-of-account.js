export function renderStatementOfAccount(clientIdFromAccountSection) {
    console.log('Rendering Statement of Account Modal for Client ID:', clientIdFromAccountSection);
    // Remove existing modal if present to ensure fresh render
    const existingModal = document.getElementById('soaModal');
    if (existingModal) {
        existingModal.remove();
    }

    const currentYear = new Date().getFullYear();

    const modalHtml = `
        <div class="modal fade" id="soaModal" tabindex="-1" aria-hidden="true" style="background-color: #dcdcdc;">
            <div class="modal-dialog modal-xl">
                <div class="modal-content" style="border: none; background-color: #dcdcdc;">
                    <div class="modal-header bg-primary text-white py-2">
                        <h5 class="modal-title mb-0">
                            <i class="bi bi-printer me-2"></i>Printable Statement of Account
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-3">
                        <!-- Print Selection Controls -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="d-flex align-items-center">
                                    <label class="me-3 fw-bold">SOA Year Coverage:</label>
                                    <select class="form-select form-select-sm" id="soaYear" style="width: 120px;">
                                        ${[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map(year => `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`).join('')}
                                    </select>
                                    <button class="btn btn-sm btn-secondary ms-2" id="btnFilter">
                                        <i class="bi bi-funnel me-1"></i>Filter
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="d-flex align-items-center justify-content-end">
                                    <label class="me-3 fw-bold">Print page selection:</label>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="radio" name="pageSelection" id="page1Only" checked>
                                        <label class="form-check-label" for="page1Only">Page 1 only</label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="radio" name="pageSelection" id="page2Only">
                                        <label class="form-check-label" for="page2Only">Page 2 only</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Printable Pages Container -->
                        <div class="printable-container">
                            <!-- Page 1: Billing Statement -->
                            <div class="printable-page page-1" id="page1Content">
                                <!-- Content will be loaded dynamically -->
                                <div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p>Loading statement...</p></div>
                            </div>
                            
                            <!-- Page 2: Notice of Disconnection -->
                            <div class="printable-page page-2" id="page2Content" style="margin-top: 20px;">
                                <!-- Content will be loaded dynamically -->
                                <div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p>Loading notice...</p></div>
                            </div>
                        </div>
                        
                        <!-- Page Labels -->
                        <div class="d-flex justify-content-between mt-2">
                            <div style="width: 468px; text-align: center; font-weight: bold;">Page 1</div>
                            <div style="width: 468px; text-align: center; font-weight: bold;">Page 2</div>
                        </div>
                    </div>
                    
                    <div class="modal-footer py-2">
                        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Close
                        </button>
                        <button type="button" class="btn btn-warning btn-sm" id="btnPrint">
                            <i class="bi bi-printer me-1"></i>Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Append modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modalElement = document.getElementById('soaModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Initial fetch and render
    fetchAndRenderStatementData(clientIdFromAccountSection, currentYear);


    // Clean up on hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });

    // Print functionality
    document.getElementById('btnPrint').addEventListener('click', () => {
        printStatementOfAccount();
    });

    // Filter functionality
    document.getElementById('btnFilter').addEventListener('click', () => {
        const year = document.getElementById('soaYear').value;
        fetchAndRenderStatementData(clientIdFromAccountSection, year);
    });

    // Page selection functionality
    document.querySelectorAll('input[name="pageSelection"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const page1 = document.getElementById('page1Content');
            const page2 = document.getElementById('page2Content');
            
            if (e.target.id === 'page1Only') {
                page1.style.display = 'block';
                page2.style.display = 'none';
            } else if (e.target.id === 'page2Only') {
                page1.style.display = 'none';
                page2.style.display = 'block';
            }
        });
    });
}

async function fetchAndRenderStatementData(clientId, year) {
    const page1ContentDiv = document.getElementById('page1Content');
    const page2ContentDiv = document.getElementById('page2Content');

    if (!page1ContentDiv || !page2ContentDiv) return;

    page1ContentDiv.innerHTML = loadingHtml('Loading statement...');
    page2ContentDiv.innerHTML = loadingHtml('Loading notice...');

    try {
        const response = await fetch(`/api/billings/statement-data?clientId=${clientId}&year=${year}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();

        if (!result.success || !result.data) {
            throw new Error('Invalid response structure');
        }

        const {
    client,
    statementItems = [],
    balanceForwarded = 0,
    previousPaymentTotal = 0,
} = result.data;


        const { tableHtml, finalBalance } =
            generateBillingTableRows(statementItems, balanceForwarded, previousPaymentTotal);

        page1ContentDiv.innerHTML =
            generatePage1Html(client, tableHtml, finalBalance);

        page2ContentDiv.innerHTML =
            generatePage2Html(client, generateNoticeContent(client, finalBalance));

    } catch (error) {
        console.error('Error fetching statement data:', error);
        page1ContentDiv.innerHTML = errorHtml('Failed to load statement data.');
        page2ContentDiv.innerHTML = errorHtml('Failed to load notice data.');
    }
}

function loadingHtml(text) {
    return `
        <div class="text-center p-5">
            <div class="spinner-border text-primary"></div>
            <p>${text}</p>
        </div>
    `;
}

function errorHtml(text) {
    return `
        <div class="text-center p-5 text-danger">
            <i class="bi bi-x-circle fs-3"></i>
            <p>${text}</p>
        </div>
    `;
}

function tableRow({
    particulars = '',
    date = '',
    prev = '',
    pres = '',
    usage = '',
    amount = '',
    orNo = '',
    discount = '',
    balance = '',
    monoFont = "'Courier New', monospace",
    italic = false,
    bold = false,
    amountColor = '#000'
}) {
    const fontStyle = italic ? 'italic' : 'normal';
    const fontWeight = bold ? 'bold' : 'normal';

    const displayAmount =
        amount === '' || amount === null || isNaN(amount)
            ? ''
            : (amount < 0
                ? `-${formatCurrency(Math.abs(amount))}`
                : formatCurrency(amount));

    const displayDiscount =
        discount === '' || discount === null || isNaN(discount)
            ? ''
            : (discount < 0
                ? `-${formatCurrency(Math.abs(discount))}`
                : formatCurrency(discount));

    return `
        <div style="display:flex;border-bottom:1px solid #eee;font-style:${fontStyle};font-weight:${fontWeight};">
            <div style="width:70px;padding:2px;border-right:1px solid #eee;">${particulars}</div>
            <div style="width:80px;padding:2px;border-right:1px solid #eee;">${date}</div>
            <div style="width:25px;padding:2px;border-right:1px solid #eee;text-align:center;">${prev ?? ''}</div>
            <div style="width:25px;padding:2px;border-right:1px solid #eee;text-align:center;">${pres ?? ''}</div>
            <div style="width:30px;padding:2px;border-right:1px solid #eee;text-align:center;">${usage ?? ''}</div>
            <div style="width:40px;padding:2px;border-right:1px solid #eee;text-align:right;color:${amountColor};">
                ${displayAmount}
            </div>
            <div style="width:50px;padding:2px;border-right:1px solid #eee;text-align:center;">
                ${orNo ?? ''}
            </div>
            <div style="width:40px;padding:2px;border-right:1px solid #eee;text-align:right;color:${amountColor};">
                ${displayDiscount}
            </div>
            <div style="width:30px;padding:2px;border-right:1px solid #eee;"></div>
            <div style="width:50px;padding:2px;text-align:right;font-family:${monoFont};">
                ${formatCurrency(balance)}
            </div>
        </div>
    `;
}


function generatePage1Html(client, tableHtml, finalBalance) {
    // Using a base font size and a consistent font family for a polished look.
    const baseFontFamily = "Arial, sans-serif";
    const monoFontFamily = "'Courier New', monospace";

    return `
    <div class="page-inner" style="background: white; border: 1px solid #ccc; position: relative; padding: 10px; font-family: ${baseFontFamily};">
        
        <!-- Header Section -->
        <div style="border: 1px solid black; padding: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <!-- Logos -->
                <div style="width: 84px; height: 88px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center;">
                   
                </div>
                
                <!-- Header Text -->
                <div style="text-align: center;">
                    <div style="font-size: 10px;">Republic of the Philippines</div>
                    <div style="font-size: 10px; font-weight: bold;">PROVINCE OF ZAMBOANGA DEL NORTE</div>
                    <div style="font-size: 10px;">Municipality of Manukan</div>
                    <div style="font-size: 9px; font-style: italic; color: #555;">Email: lgumanukanzanorte@gmail.com</div>
                    <div style="font-size: 11px; font-weight: bold; margin-top: 8px;">MANUKAN WATERWORKS SYSTEM</div>
                    <div style="font-size: 12px; font-weight: bold; margin-top: 5px; border: 1px solid #000; padding: 2px 4px;">STATEMENT OF ACCOUNT</div>
                </div>

                <div style="width: 84px; height: 88px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center;">
                  
                </div>
            </div>
            <!-- Account Details -->
            <div style="margin-top: 10px; font-size: 11px;">
                <div style="display: flex; margin-bottom: 2px;">
                    <span style="min-width: 120px;"><i>CONCESSIONAIRE:</i></span>
                    <span style="font-weight: bold;">${client.name || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <div>
                        <span style="min-width: 60px;">Address:</span>
                        <span style="font-weight: bold; border-bottom: 1px solid black; padding-bottom: 1px;">
                            ${barangayNumberToWord(client.barangay) || 'N/A'}
                        </span>
                    </div>
                    <div>
                        <span>Meter Number:</span>
                        <span style="font-family: ${monoFontFamily}; font-weight: bold; border: 1px solid #000; padding: 1px 4px; background: #f0f0f0;">
                            ${client.meterNumber || 'N/A'}
                        </span>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 8px; border-top: 1px solid #eee; padding-top: 5px;">
                    <span style="font-size: 12px; font-weight: bold;">Total Balance Due:</span>
                    <span style="font-family: ${baseFontFamily}; font-size: 14px; font-weight: bold; margin-left: 10px; color: #d9534f;">
                        ₱ ${formatCurrency(finalBalance)}
                    </span>
                </div>
            </div>
        </div>

        <!-- Billing Table -->
        <div style="margin-top: 10px; border: 1px solid black;">
            <div style="font-size: 9px;">
                <!-- Table Header -->
                <div style="display: flex; border-bottom: 1px solid black; background-color: #f0f0f0; font-weight: bold; text-align: center;">
                    <div style="width: 70px; padding: 2px; border-right: 1px solid black;">Particulars</div>
                    <div style="width: 80px; padding: 2px; border-right: 1px solid black;">Date</div>
                    <div style="width: 25px; padding: 2px; border-right: 1px solid black;">Prev</div>
                    <div style="width: 25px; padding: 2px; border-right: 1px solid black;">Pres</div>
                    <div style="width: 30px; padding: 2px; border-right: 1px solid black;">Usage</div>
                    <div style="width: 40px; padding: 2px; border-right: 1px solid black;">Amount</div>
                    <div style="width: 50px; padding: 2px; border-right: 1px solid black;">OR No.</div>
                    <div style="width: 40px; padding: 2px; border-right: 1px solid black;">Discount</div>
                    <div style="width: 50px; padding: 2px;">Balance</div>
                </div>
                <!-- Table Content -->
                <div style="max-height: 340px; overflow-y: auto;">
                    ${tableHtml}
                </div>
            </div>
        </div>
        
        <!-- Signatures -->
        <div style="margin-top: 20px; display: flex; justify-content: space-around; text-align: center; font-size: 10px;">
            <div>
                <div>Prepared by:</div>
                <div style="font-weight: bold; margin-top: 30px;">CHRISTIAN B. ALIA</div>
                <div style="font-style: italic; border-top: 1px solid black; padding-top: 2px;">AA-1/Water Billing In-Charge</div>
            </div>
            <div>
                <div>Noted by:</div>
                <div style="font-weight: bold; margin-top: 30px;">FLORILYN R. DECIERDO</div>
                <div style="font-style: italic; border-top: 1px solid black; padding-top: 2px;">Acting Municipal Treasurer</div>
            </div>
        </div>
    </div>
    `;
}

function generatePage2Html(client, noticeHtml) {
    const baseFontFamily = "Arial, sans-serif";
    const monoFontFamily = "'Courier New', monospace";
    return `
    <div class="page-inner" style="background: white; border: 1px solid #ccc; position: relative; padding: 10px; font-family: ${baseFontFamily};">
        <!-- Header Section -->
        <div style="border: 1px solid black; padding: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                 <!-- Logos -->
                 <div style="width: 84px; height: 88px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center;">
                    <i class="bi bi-bank" style="font-size: 2rem;"></i>
                    <span style="font-size: 9px; margin-top: 5px;">MUNICIPALITY</span>
                </div>
                
                <!-- Header Text -->
                <div style="text-align: center;">
                    <div style="font-size: 10px;">Republic of the Philippines</div>
                    <div style="font-size: 10px; font-weight: bold;">PROVINCE OF ZAMBOANGA DEL NORTE</div>
                    <div style="font-size: 10px;">Municipality of Manukan</div>
                    <div style="font-size: 9px; font-style: italic; color: #555;">Email: lgumanukanzanorte@gmail.com</div>
                    <div style="font-size: 11px; font-weight: bold; margin-top: 8px;">MANUKAN WATERWORKS SYSTEM</div>
                    <div style="font-size: 12px; font-weight: bold; margin-top: 5px; border: 1px solid #000; padding: 2px 4px; background: #d9534f; color: white;">NOTICE OF DISCONNECTION</div>
                </div>

                <div style="width: 84px; height: 88px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center;">
                    <i class="bi bi-slash-circle" style="font-size: 2rem; color: red;"></i>
                    <span style="font-size: 9px; margin-top: 5px;">NO SMOKING</span>
                </div>
            </div>
            
            <!-- Account Details -->
            <div style="margin-top: 10px; font-size: 11px;">
                <div style="display: flex; margin-bottom: 2px;">
                    <span style="min-width: 120px;"><i>CONCESSIONAIRE:</i></span>
                    <span style="font-weight: bold;">${client.name || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <div>
                        <span style="min-width: 60px;">Address:</span>
                        <span style="font-weight: bold; border-bottom: 1px solid black; padding-bottom: 1px;">
                            ${client.barangay || 'N/A'}
                        </span>
                    </div>
                    <div>
                        <span>Meter Number:</span>
                        <span style="font-family: ${monoFontFamily}; font-weight: bold; border: 1px solid #000; padding: 1px 4px; background: #f0f0f0;">
                            ${client.meterNumber || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Notice Content -->
        <div style="margin-top: 20px; padding: 15px; font-size: 11px; line-height: 1.6;">
            <div style="white-space: pre-line;">${noticeHtml}</div>
        </div>
        
        <!-- Footer Message -->
        <div style="text-align: center; font-family: ${baseFontFamily}; font-size: 11px; margin-top: 20px; font-style: italic;">
            Please disregard this notice if payment has already been made.
        </div>

        <!-- Signatures -->
        <div style="margin-top: 30px; display: flex; justify-content: space-around; text-align: center; font-size: 10px;">
             <div>
                <div>Noted by:</div>
                <div style="font-weight: bold; margin-top: 30px; border-top: 1px solid black; padding-top: 2px;">ENGR. JOSEPHINE T. PAO</div>
                <div style="font-style: italic;">Municipal Engineer</div>
            </div>
            <div>
                <div>Noted by:</div>
                <div style="font-weight: bold; margin-top: 30px; border-top: 1px solid black; padding-top: 2px;">FLORILYN R. DECIERDO</div>
                <div style="font-style: italic;">Acting Municipal Treasurer</div>
            </div>
        </div>
    </div>
    `;
}

function generateBillingTableRows(statementItems = [], balanceForwarded = 0, previousPaymentTotal = 0) {
    let rowsHtml = '';
    let runningBalance = previousPaymentTotal + balanceForwarded;
    const monoFont = "'Courier New', monospace";

    // Balance Forwarded row
    rowsHtml += tableRow({
        particulars: 'Balance Fwd',
        balance: runningBalance,
        monoFont,
        bold: true
    });

    if (!Array.isArray(statementItems)) {
        console.warn('statementItems is not an array:', statementItems);
        return { tableHtml: rowsHtml, finalBalance: runningBalance };
    }
    statementItems.forEach(item => {
        const date = formatSoaDate(item.date);

        if (item.type === 'billing') {
            runningBalance += Number(item.amount || 0);

            rowsHtml += tableRow({
                particulars: 'Billing',
                date,
                prev: item.previousReading,
                pres: item.presentReading,
                usage: item.usage,
                amount: item.amount,
                discount: '',
                balance: runningBalance,
                monoFont,
                amountColor: '#5cb85c'
            });
        }

        if (item.type === 'payment') {
            runningBalance -= Number((item.amount || 0) + (item.discount || 0));

            rowsHtml += tableRow({
                particulars: 'Payment',
                date,
                amount: item.amount,
                orNo: item.reference,
                balance: runningBalance,
                monoFont,
                discount: item.discount,
                italic: true,
                amountColor: '#d9534f'
            });
        }
    });

    return {
        tableHtml: rowsHtml,
        finalBalance: runningBalance
    };
}


function formatSoaDate(dateValue) {
    if (!dateValue) return '';

    // Handle "YYYY/M/D"
    if (typeof dateValue === 'string' && dateValue.includes('/')) {
        const [y, m, d] = dateValue.split('/').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US');
    }

    // Handle ISO date or Date object
    return new Date(dateValue).toLocaleDateString('en-US');
}


function generateNoticeContent(client, balance) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).replace(',', '');

    return `${formattedDate}

Sir/Madam:

Please be informed that your water service will be disconnected on
_________________ due to an outstanding balance of  [ ₱ ${balance.toFixed(2)} ]  as of date.

Attached is a statement of your account detailing the outstanding balance.
To avoid disconnection, kindly settle the full amount before
the scheduled date.

For inquiries or to arrange payment, please visit our office at Manukan
Municipal Hall, Nat'l Highway Pob. Manukan Z.N.

Thank you for your immediate attention to this matter.

Sincerely,

CHRISTIAN B. ALIA
AA-1/Water Billing In-Charge`;
}

function printStatementOfAccount() {
    const page1Only = document.getElementById('page1Only').checked;
    const page2Only = document.getElementById('page2Only').checked;
    
    let printContent = '';
    
    const page1Html = document.getElementById('page1Content').innerHTML;
    const page2Html = document.getElementById('page2Content').innerHTML;

    if (page1Only) {
        printContent = `<div class="printable-page">${page1Html}</div>`;
    } else if (page2Only) {
        printContent = `<div class="printable-page">${page2Html}</div>`;
    } else {
        // Print both pages
        printContent = `
            <div class="printable-page" style="page-break-after: always;">${page1Html}</div>
            <div class="printable-page">${page2Html}</div>
        `;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Statement of Account</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
            <style>

@page {
    size: A4 portrait;
    margin: 10mm;
}

/* screen preview */
body{
    background:#ccc;
}

/* the actual paper */
.print-page{
    width: 190mm;
    min-height: 277mm;
    background:white;
    margin:auto;
    box-shadow:0 0 6px rgba(0,0,0,.2);
    padding:10mm;
    box-sizing:border-box;
}

/* PRINT MODE */
@media print {

    body{
        background:white !important;
    }

    .print-page{
        width:100%;
        min-height:auto;
        margin:0;
        box-shadow:none;
        padding:0;
    }

    *{
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    .no-print{
        display:none !important;
    }

    /* VERY IMPORTANT */
    .no-break{
        page-break-inside: avoid;
        break-inside: avoid;
    }

}
</style>

        </head>
        <body onload="window.print(); setTimeout(window.close, 100);">
            ${printContent}
        </body>
        </html>
    `);
    printWindow.document.close();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}
