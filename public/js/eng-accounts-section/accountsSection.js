// public/js/eng-accounts-section/accountsSection.js
/**
 * Handles rendering and logic for the Accounts section
 * Assumes barangayNumberToWord, classificationNumberToWord, and renderClientProfile are loaded globally
 */
window.renderAccountsSection = function(mainContent, primaryMainContent) {
    // HTML Template
    const html = `
    <h3 class="mb-4 fw-bold text-primary">Accounts</h3>
    <div id="alertContainer" class="mt-4" style="position: relative; top: 0; padding: 2px"></div>
    
    <form id="client-search-form" class="mb-4">
        <div class="row g-3 align-items-end">
            <div class="col-md-5">
                <label for="client-search-input" class="form-label">Search</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="client-search-input" 
                  placeholder="Search by name, Acc No., or Meter No. ...">
            </div>
            <div class="col-md-3">
                <label for="client-status-filter" class="form-label">Status</label>
                <select id="client-status-filter" class="form-select">
                    <option value="all" selected>All</option>
                    <option value="1">On Process</option>
                    <option value="2">For Assessment</option>
                    <option value="0">Inactive</option>
                    <option value="3">Active</option>
                </select>
            </div>
            <div class="col-md-2">
                <button class="btn btn-primary w-100" type="submit">Load</button>
            </div>
            <div class="col-md-2">
                <a class="btn btn-success w-100" href="/eng/client-registration" target="_self" rel="noopener">New Account</a>
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

    let currentClients = []; // To hold the fetched client data for event listeners

    initializeEventListeners();

    function getStatusBadge(status) {
        const statusMap = {
            0: { class: 'danger', text: 'Disconnected' },
            1: { class: 'warning text-dark', text: 'On Process' },
            2: { class: 'info text-dark', text: 'For Assessment' },
            3: { class: 'success', text: 'Active' },
            4: { class: 'secondary', text: 'Temp. Disconnected' }
        };

        const statusConfig = statusMap[status] || { class: 'light text-dark', text: 'Unknown' };
        return `<span class="badge bg-${statusConfig.class}">${statusConfig.text}</span>`;
    }

    function renderTableRows(clients) {
        currentClients = clients; // Store for event delegation
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
                    <td>${index + 1}</td>
                    <td><span class="fw-semibold text-primary">${client.name || 'No Name'}</span></td>
                    <td>${address}</td>
                    <td>${classificationNumberToWord(client.classification)}</td>
                    <td>${client.meterNumber || 'N/A'}</td>
                    <td>${getStatusBadge(client.status)}</td>
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-primary view-client-btn" data-client-id="${client.clientId}" title="View Profile"> View Account</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rowsHtml;
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

    function handleClientView(clientId, allClients) {
        const client = allClients.find(c => c.clientId == clientId);
        console.log("Handling view for client ID:", client);
        const profileContainer = document.getElementById('clientProfileContainer');
        if (!profileContainer) return;
        if (client && window.renderClientProfile) {
            profileContainer.innerHTML = window.renderClientProfile(clientId, mainContent.innerHTML);
        } 
        // else {
        //     profileContainer.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>Client data not found.</div>`;
        // }
        profileContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function handleProcessView(clientId, allClients) {
        const client = allClients.find(c => c.clientId == clientId);
        const profileContainer = document.getElementById('clientProfileContainer');
        if (!profileContainer) return;
        if (client && client.serviceRequests && client.serviceRequests.length > 0) {
            if (window.renderProcessView) {
                profileContainer.innerHTML = window.renderProcessView(client, mainContent.innerHTML);
            } else {
                profileContainer.innerHTML = `<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Process view functionality is not available.</div>`;
            }
        } else {
            const alertContainer = document.getElementById('alertContainer');
            alertContainer.innerHTML = `<div id="autoAlert" class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>No service requests found for this client.</div>`;
            setTimeout(() => {
                const alert = document.getElementById("autoAlert");
                if (alert) alert.remove();
            }, 5000);
        }
        window.scrollTo({top: 0, behavior: 'smooth'});
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
        
        // Event delegation for action buttons
        mainContent.addEventListener('click', function(event) {
            const target = event.target;
            
            if (target.matches('.view-client-btn')) {
                const clientId = target.getAttribute('data-client-id');
                handleClientView(clientId, currentClients);
            }
        });
    }
};