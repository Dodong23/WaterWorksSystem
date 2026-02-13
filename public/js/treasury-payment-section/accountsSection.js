// public/js/treasury-payment-section/accountsSection.js
/**
 * Handles rendering and logic for the Accounts section
 * Assumes barangayNumberToWord, classificationNumberToWord, and renderClientProfile are loaded globally
 */
window.renderAccountsSection = function(mainContent, primaryMainContent) {
    // HTML Template
    const html = `
    <h3 class="mb-2 fw-bold text-primary">Accounts</h3>
    <div id="alertContainer" class="mt-4" style="position: relative; top: 0; padding: 0px"></div>
    
    <form id="client-search-form" class="mb-4">
        <div class="row g-3 align-items-end">
            <div class="col-md-6">
                <label for="client-search-input" class="form-label">Search</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="client-search-input" 
                  placeholder="Search by name, Acc No., or Meter No. ...">
            </div>
            <div class="col-md-4">
                <label for="client-status-filter" class="form-label">Status</label>
                <select id="client-status-filter" class="form-select">
                    <option value="all" selected>All</option>
                    <option value="3">Active</option>
                    <option value="0">Inactive</option>
                    <option value="1">On Process</option>
                    <option value="4">Temp. Disconnected</option>
                </select>
            </div>
            <div class="col-md-2">
                <button class="btn btn-primary w-100" type="submit">Load</button>
            </div>
        </div>
    </form>
    
    <div class="table-responsive">
        <table class="table table-hover align-middle table-bordered rounded-3 overflow-hidden shadow-sm" id="accounts-table">
            <thead class="table-light">
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Area</th>
                    <th scope="col">Classification</th>
                    <th scope="col">Meter Number</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody id="accounts-table-body">
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        Please use the filters and click "Load" to display client data.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <div id="clientProfileContainer" class="mt-4" style="position: relative; top: 0; padding: 2px"></div>
  `;

    if (primaryMainContent) {
        mainContent.innerHTML = primaryMainContent;
    } else {
        mainContent.innerHTML = html;
    }

    setTimeout(() => {
        const alert = document.getElementById("autoAlert");
        if (alert) {
            alert.remove();
        }
    }, 5000);

    initializeEventListeners();

    function getStatusBadge(status) {
        const statusMap = {
            0: { class: 'danger', text: 'Disconnected' },
            1: { class: 'warning text-dark', text: 'On Process' },
            3: { class: 'success', text: 'Active' },
            4: { class: 'secondary', text: 'Temp. Disconnected' }
        };

        const statusConfig = statusMap[status] || { class: 'light text-dark', text: 'Unknown' };
        return `<span class="badge bg-${statusConfig.class}">${statusConfig.text}</span>`;
    }

    function renderTableRows(clients) {
        const tbody = document.getElementById('accounts-table-body');
        if (!tbody) return;

        if (!Array.isArray(clients) || clients.length === 0) {
            tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            No client data found.
          </td>
        </tr>
      `;
            return;
        }

        const rowsHtml = clients.map((client, index) => {
            const address = `${client.sitio ? client.sitio + ', ' : ''}${barangayNumberToWord(client.barangay)}`;
            return `
        <tr>
          <td>${client.clientId}</td>
          <td><span class="fw-semibold text-primary">${client.name || 'No Name'}</span></td>
          <td>${address}</td>
          <td>${classificationNumberToWord(client.classification)}</td>
          <td>${client.meterNumber || 'N/A'}</td>
          <td>${getStatusBadge(client.status)}</td>
          <td>
            <div class="btn-group btn-group-sm">
              <button 
                class="btn btn-outline-secondary view-account-btn" 
                data-client-id="${client.clientId}" 
                title="View Payables"
                aria-label="View Payables">
                View Account
              </button>
            </div>
          </td>
        </tr>
      `;
        }).join('');

        tbody.innerHTML = rowsHtml;
        // attachRowEventListeners(clients);
        initializeEventListeners();
        initializeDelegatedAccountView();

    }
    
    async function fetchAndRenderClients(status, search) {
        const tbody = document.getElementById('accounts-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <div class="spinner-border spinner-border-sm me-2"></div>
                        Loading clients...
                    </td>
                </tr>
            `;
        }

        try {
            const response = await fetch(`/water/clients?status=${status}&search=${search}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const clients = await response.json();
            renderTableRows(clients);
        } catch (error) {
            console.error('Error loading clients:', error);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-danger py-4">
                            <i class="bi bi-exclamation-triangle fs-4 me-2"></i>
                            Failed to load client data. Please try again later.
                        </td>
                    </tr>
                `;
            }
        }
    }
    
async function handleAccountView(clientId, allClients) {
  const profileContainer = document.getElementById('clientProfileContainer');
  if (!profileContainer) return;

  try {
    console.log('Fetching client details...', clientId);

    const clientResponse = await fetch(`/water/clients/client-id/${clientId}`);
    if (!clientResponse.ok) throw new Error('Unable to fetch client');

    const client = await clientResponse.json();
    const clientData = client && client.data; // Ensure client and client.data exist
    if (clientData && window.renderPaymentView) {
      profileContainer.innerHTML = window.renderPaymentView(
        clientId,
        clientData,
        mainContent.innerHTML
      );
    } else {
      showNoRecordAlert('No record found for the selected client. The client ID might be invalid or deleted.');
    }

  } catch (error) {
    console.error('Error loading client details:', error);
    showNoRecordAlert('Failed to load client details due to a server error. Please try again.');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showNoRecordAlert(message = 'No record found for the selected client.') {
  const alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) {
    console.warn('Alert container not found for displaying message:', message);
    return;
  }

  alertContainer.innerHTML = `
    <div id="autoAlert" class="alert alert-warning">
      <i class="bi bi-exclamation-triangle me-2"></i>
      ${message}
    </div>
  `;

  setTimeout(() => {
    document.getElementById('autoAlert')?.remove();
  }, 5000);
}


    // function attachRowEventListeners(clients) {
    //     document.querySelectorAll('.view-account-btn').forEach(btn => {
    //         btn.addEventListener('click', () => {
    //             const clientId = btn.getAttribute('data-client-id');
    //             console.log('Client ID:', clientId);
    //             handleAccountView(clientId, clients);
    //         });
    //     });
    // }

function initializeDelegatedAccountView() {
  if (window.__accountViewDelegated) return;
  window.__accountViewDelegated = true;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-account-btn');
    if (!btn) return;

    const clientId = btn.dataset.clientId;
    console.log('View Account clicked:', clientId);

    handleAccountView(clientId);
  });
 }

    function initializeEventListeners() {
        const searchForm = document.getElementById('client-search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const search = document.getElementById('client-search-input').value.trim();
                const status = document.getElementById('client-status-filter').value;
                fetchAndRenderClients(status, search);
            });
        }
    }
};