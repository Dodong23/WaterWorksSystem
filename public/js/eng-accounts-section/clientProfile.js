// public/js/clientProfile.js
// Handles rendering and editing of the client profile card
// Assumes barangayNumberToWord and classificationNumberToWord are loaded globally

// Store event listeners references for cleanup
let feeEventListeners = [];
let formEventListeners = [];
let modalEventListeners = [];

// Fetch client from server
async function fetchClientData(id) {
    try {
        const response = await fetch(`/water/clients/client-id/${id}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Fetched client data:", result.data);

        return result.data;

    } catch (error) {
        console.error('Error loading client:', error);
        return null;
    }
}


window.renderClientProfile = async function(clientId, primaryMainContent) {
  console.log("Rendering client profile for ID:", clientId);
  const client = await fetchClientData(clientId);
  const mainContent = document.getElementById('main-content');
  
  // Cleanup existing event listeners
  cleanupEventListeners();

  // Helper to render the form in view or edit mode
  function renderForm(editMode = false) {
    let readonly = editMode ? '' : 'readonly';
    let disabled = editMode ? '' : 'disabled';
    let profileHtml = `
      <div class="row justify-content-center">
        <div class="col-12 col-lg-9 col-xl-7">
          <div class="card shadow-lg mb-4 border-0 position-relative rounded-4">
            <button type="button" class="btn-close position-absolute top-0 end-0 m-3" aria-label="Close" id="close-profile-panel"></button>
            <div class="card-body p-4">
              <h2 class="mb-3 fw-bold text-primary">Account Details</h2>
              <form id="client-profile-form">
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label">Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="name" value="${client.name || ''}" maxlength="100" required ${readonly} />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Contact</label>
                    <input type="text" class="form-control" name="contact" value="${client.contact || ''}" ${readonly} />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Meter Number</label>
                    <input type="text" class="form-control" name="meterNumber" value="${client.meterNumber || ''}" ${readonly} />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Barangay <span class="text-danger">*</span></label>
                    <select class="form-select" name="barangay" required ${disabled}>
                      <option value="0" ${client.barangay==0?'selected':''}>Select Barangay</option>
                      <option value="1" ${client.barangay==1?'selected':''}>Poblacion I</option>
                      <option value="2" ${client.barangay==2?'selected':''}>Poblacion II</option>
                      <option value="3" ${client.barangay==3?'selected':''}>East Poblacion</option>
                      <option value="4" ${client.barangay==4?'selected':''}>Punta Blanca</option>
                      <option value="5" ${client.barangay==5?'selected':''}>Patunan</option>
                      <option value="6" ${client.barangay==6?'selected':''}>Polot</option>
                      <option value="7" ${client.barangay==7?'selected':''}>Dequis</option>
                      <option value="8" ${client.barangay==8?'selected':''}>Palaranan</option>
                      <option value="9" ${client.barangay==9?'selected':''}>Don Jose Aguirre</option>
                      <option value="10" ${client.barangay==10?'selected':''}>San Antonio</option>
                      <option value="11" ${client.barangay==11?'selected':''}>Lyndieville Subdivision</option>
                      <option value="12" ${client.barangay==12?'selected':''}>Loquilos</option>
                      <option value="13" ${client.barangay==13?'selected':''}>San Vicente</option>
                      <option value="14" ${client.barangay==14?'selected':''}>Market</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Sitio</label>
                    <input type="text" class="form-control" name="sitio" value="${client.sitio || ''}" maxlength="50" ${readonly} />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Status <span class="text-danger">*</span></label>
                    <select class="form-select" name="status" required ${disabled}>
                      <option value="0" ${client.status==0?'selected':''}>Disconnected</option>
                      <option value="1" ${client.status==1?'selected':''}>Pending</option>
                      <option value="2" ${client.status==2?'selected':''}>New</option>
                      <option value="3" ${client.status==3?'selected':''}>Active</option>
                      <option value="4" ${client.status==4?'selected':''}>Temporarily Disconnected</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Classification</label>
                    <select class="form-select" name="classification" ${disabled}>
                      <option value="1" ${client.classification==1?'selected':''}>Residential</option>
                      <option value="2" ${client.classification==2?'selected':''}>Institutional</option>
                      <option value="3" ${client.classification==3?'selected':''}>Commercial</option>
                      <option value="4" ${client.classification==4?'selected':''}>Industrial</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Last Read Date</label>
                    <input type="date" 
  class="form-control" 
  name="lastReadDate" 
  value="${client.lastReadDate ? (function(d){
      const date = new Date(d);
      if (isNaN(date)) return '';
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
  })(client.lastReadDate) : ''}" 
  maxlength="55" 
  ${readonly} 
/>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Last Read Value</label>
                    <input type="number" class="form-control" name="lastReadValue" value="${client.lastReadValue || 0}" min="0" ${readonly} />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Register Note</label>
                    <input type="text" class="form-control" name="registerNote" value="${client.registerNote || ''}" maxlength="250" ${readonly} />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Balance</label>
                    <input type="number" class="form-control" name="balance" value="${client.balance || 0}" min="0" step="0.01" ${readonly} />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Free Cubic</label>
                    <input type="number" class="form-control" name="freeCubic" value="${client.freeCubic || 0}" min="0" step="0.01" ${readonly} />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Less Amount</label>
                    <input type="number" class="form-control" name="lessAmount" value="${client.lessAmount || 0}" min="0" step="0.01" ${readonly} />
                  </div>
                </div>
                <div class="mt-4 text-end">
  <button type="button" class="btn btn-outline-secondary px-4 me-2" id="close-profile-btn">
    Close
  </button>

  ${editMode
    ? `
        <button type="submit" class="btn btn-success px-4">
          Save Changes
        </button>
      `
    : `
        <button type="button" class="btn btn-primary px-4" id="edit-profile-btn">
          Edit
        </button>
        <button type="button" class="btn btn-danger px-4" id="delete-profile-btn">
          Delete
        </button>
      `}
</div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div class="row justify-content-center">
        <div class="col-12 col-lg-9 col-xl-7">
            <div id="misc-fees-section" class="card shadow-lg mb-4 border-0 rounded-4">
                
            </div>
        </div>
      </div>

       <!-- Add Fee Modal -->
        <div class="modal fade" id="addFeeModal" tabindex="-1" aria-labelledby="addFeeModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="addFeeModalLabel">Add Miscellaneous Fee</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="add-fee-form">
                    <input type="hidden" name="clientId" value="${client.clientId}">
                    <div class="mb-3">
                        <label for="fee-select" class="form-label">Fee</label>
                        <select class="form-select" id="fee-select" name="fee" required>
                            <option value="">Loading fees...</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="fee-amount" class="form-label">Amount</label>
                        <input type="number" class="form-control" id="fee-amount" name="amount" min="0" step="0.01" required readonly>
                    </div>
                     <div class="mb-3">
                        <label for="fee-date" class="form-label">Date</label>
                        <input type="date" class="form-control" id="fee-date" name="dateCreated" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="submit" class="btn btn-primary">Add Fee</button>
                    </div>
                </form>
            </div>
            </div>
        </div>
        </div>
    `;
    mainContent.innerHTML = profileHtml;
    
    // Add navigation event listeners
    const closeProfileBtn = document.getElementById('close-profile-btn');
    const closeProfilePanel = document.getElementById('close-profile-panel');
    
    if (closeProfileBtn) {
      const closeHandler = () => {
        if (window.renderAccountsSection) window.renderAccountsSection(mainContent, primaryMainContent);
      };
      closeProfileBtn.addEventListener('click', closeHandler);
      formEventListeners.push({ element: closeProfileBtn, event: 'click', handler: closeHandler });
    }
    
    if (closeProfilePanel) {
      const panelCloseHandler = () => {
        if (window.renderAccountsSection) window.renderAccountsSection(mainContent, primaryMainContent);
      };
      closeProfilePanel.addEventListener('click', panelCloseHandler);
      formEventListeners.push({ element: closeProfilePanel, event: 'click', handler: panelCloseHandler });
    }

    if (!editMode) {
      const editProfileBtn = document.getElementById('edit-profile-btn');
      if (editProfileBtn) {
        const editHandler = () => {
          renderForm(true);
        };
        editProfileBtn.addEventListener('click', editHandler);
        formEventListeners.push({ element: editProfileBtn, event: 'click', handler: editHandler });
      }

      const deleteProfileBtn = document.getElementById('delete-profile-btn');
      if (deleteProfileBtn) {
        const deleteHandler = () => {
          if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
            fetch(`/water/clients/${client.clientId}`, {
              method: 'DELETE',
            })
            .then(async response => {
              if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Delete failed');
              }
              // It's a DELETE request, so we might not get a JSON body.
              // If the response is ok, we can assume deletion was successful.
              return response.status === 204 ? null : response.json();
            })
            .then(() => {
              alert('Client deleted successfully!');
              if (window.renderAccountsSection) window.renderAccountsSection(mainContent, primaryMainContent);
            })
            .catch(err => {
              alert('Failed to delete client: ' + err.message);
            });
          }
        };
        deleteProfileBtn.addEventListener('click', deleteHandler);
        formEventListeners.push({ element: deleteProfileBtn, event: 'click', handler: deleteHandler });
      }
    } else {
      const clientProfileForm = document.getElementById('client-profile-form');
      if (clientProfileForm) {
        const submitHandler = function(e) {
          e.preventDefault();
          const formData = new FormData(this);
          const updatedClient = {};
          for (let [key, value] of formData.entries()) {
            if (["balance","freeCubic","lessAmount","lastReadValue","classification","barangay","status"].includes(key)) {
              value = value === '' ? 0 : Number(value);
            }
            if (key === 'lastReadDate' && value) {
              const parts = value.split('-');
              if (parts.length === 3) {
                value = `${parts[1]}/${parts[2]}/${parts[0]}`;
              }
            }
            updatedClient[key] = value;
          }
          updatedClient._id = client._id;
          console.log("Submitting updated client data:", updatedClient);
          fetch(`/water/clients/${updatedClient._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedClient)
          })
          .then(async response => {
            if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || 'Update failed');
            }
            return response.json();
          })
          .then(data => {
            alert('Profile updated successfully!');
            if (window.renderClientProfile) window.renderClientProfile(data.clientId);
          })
          .catch(err => {
            alert('Failed to update profile: ' + err.message);
          });
        };
        clientProfileForm.addEventListener('submit', submitHandler);
        formEventListeners.push({ element: clientProfileForm, event: 'submit', handler: submitHandler });
      }
    }
    renderMiscFeesSection(client.clientId);
  }

  function renderMiscFeesSection(clientId) {
    const container = document.getElementById('misc-fees-section');
    container.innerHTML = '<h5>Loading fees...</h5>';

    fetch(`/api/misc-fees/client/${clientId}`)
        .then(response => response.json())
        .then(fees => {
            let feesHtml = `
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="fw-bold text-secondary">Miscellaneous Fees</h4>
                        <button class="btn btn-sm btn-primary" id="add-fee-btn" data-bs-toggle="modal" data-bs-target="#addFeeModal">
                            <i class="bi bi-plus-circle"></i> Add Fee
                        </button>
                    </div>
                    <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (fees.length > 0) {
                fees.forEach(miscFee => {
                    feesHtml += `
                        <tr>
                            <td>${miscFee.name || 'N/A'}</td>
                            <td>${miscFee.amount.toFixed(2)}</td>
                            <td>${new Date(miscFee.dateCreated).toLocaleDateString()}</td>
                            <td><span class="badge bg-${miscFee.status === 'Paid' ? 'success' : (miscFee.status === 'Cancelled' ? 'danger' : 'warning')}">${miscFee.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-danger delete-fee-btn" data-fee-id="${miscFee._id}" ${miscFee.status !== 'Unpaid' ? 'disabled' : ''}>Delete</button>
                                <button class="btn btn-sm btn-outline-secondary cancel-fee-btn" data-fee-id="${miscFee._id}" ${miscFee.status !== 'Unpaid' ? 'disabled' : ''}>Cancel</button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                feesHtml += '<tr><td colspan="5" class="text-center">No miscellaneous fees found.</td></tr>';
            }

            feesHtml += `
                        </tbody>
                    </table>
                    </div>
                </div>
            `;
            container.innerHTML = feesHtml;
            attachActionListeners(clientId);
        });
    }

    function barangayNumberToWord(barangay) {
        const map = {
            '01': 'Poblacion I',
            '02': 'Poblacion II',
            '03': 'East Poblacion',
            '04': 'Punta Blanca',
            '05': 'Patunan',
            '06': 'Polot',
            '07': 'Dequis',
            '08': 'Palaranan',
            '09': 'Don Jose Aguirre',
            '10': 'San Antonio',
            '11': 'Lyndieville Subdivision',
            '12': 'Loquilos',
            '13': 'San Vicente',
            '14': 'Market',
        };
        if (!barangay) return 'Not set';
        let key = barangay.toString().padStart(2, '0');
        return map[key] || 'Not set';
    }

    function attachActionListeners(clientId) {
        // Remove any existing fee listeners first
        feeEventListeners.forEach(listener => {
            listener.element.removeEventListener(listener.event, listener.handler);
        });
        feeEventListeners = [];
        
        // Add delete fee listeners
        document.querySelectorAll('.delete-fee-btn').forEach(btn => {
            const deleteHandler = (e) => {
                const feeId = e.target.dataset.feeId;
                if (confirm('Are you sure you want to delete this fee?')) {
                    fetch(`/api/misc-fees/${feeId}`, { method: 'DELETE' })
                        .then(() => renderMiscFeesSection(clientId));
                }
            };
            btn.addEventListener('click', deleteHandler);
            feeEventListeners.push({ element: btn, event: 'click', handler: deleteHandler });
        });

        // Add cancel fee listeners
        document.querySelectorAll('.cancel-fee-btn').forEach(btn => {
            const cancelHandler = (e) => {
                const feeId = e.target.dataset.feeId;
                if (confirm('Are you sure you want to cancel this fee?')) {
                    fetch(`/api/misc-fees/${feeId}/cancel`, { method: 'PUT' })
                        .then(() => renderMiscFeesSection(clientId));
                }
            };
            btn.addEventListener('click', cancelHandler);
            feeEventListeners.push({ element: btn, event: 'click', handler: cancelHandler });
        });
        
        // Setup modal event (only once)
        const addFeeModal = document.getElementById('addFeeModal');
        if (addFeeModal && !modalEventListeners.find(l => l.element === addFeeModal)) {
            const modalShowHandler = () => populateFeesDropdown();
            addFeeModal.addEventListener('show.bs.modal', modalShowHandler);
            modalEventListeners.push({ element: addFeeModal, event: 'show.bs.modal', handler: modalShowHandler });
        }

        // Add fee form submit handler (only once)
        const addFeeForm = document.getElementById('add-fee-form');
        if (addFeeForm && !modalEventListeners.find(l => l.element === addFeeForm)) {
            const submitHandler = (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                data.clientName = client.name;
                data.address = barangayNumberToWord(client.barangay) + ', ' + (client.sitio ? client.sitio : '');
                data.clientId = clientId;
                data.meterNumber = client.meterNumber;
                
                fetch('/api/misc-fees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).then(response => {
                    if (response.ok) {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('addFeeModal'));
                        if (modal) modal.hide();
                        renderMiscFeesSection(clientId);
                        // Reset form
                        e.target.reset();
                    } else {
                        alert('Failed to add fee.');
                    }
                });
            };
            addFeeForm.addEventListener('submit', submitHandler);
            modalEventListeners.push({ element: addFeeForm, event: 'submit', handler: submitHandler });
        }
    }
    
    function cleanupEventListeners() {
        // Remove all form event listeners
        formEventListeners.forEach(listener => {
            listener.element.removeEventListener(listener.event, listener.handler);
        });
        formEventListeners = [];
        
        // Remove all fee event listeners
        feeEventListeners.forEach(listener => {
            listener.element.removeEventListener(listener.event, listener.handler);
        });
        feeEventListeners = [];
        
        // Note: modalEventListeners are kept since modals persist in DOM
    }
    
    function populateFeesDropdown() {
        const select = document.getElementById('fee-select');
        const amountInput = document.getElementById('fee-amount');
        
        // Clear previous options
        select.innerHTML = '<option value="">Loading fees...</option>';
        
        fetch('/api/fees')
            .then(res => res.json())
            .then(fees => {
                select.innerHTML = '<option value="">Select a fee...</option>';
                fees.forEach(fee => {
                    const option = document.createElement('option');
                    option.value = fee._id;
                    option.textContent = fee.name;
                    option.dataset.amount = fee.amount;
                    select.appendChild(option);
                });
            });

        // Add change listener for fee select
        const changeHandler = (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            amountInput.value = selectedOption.dataset.amount || '';
        };
        
        select.addEventListener('change', changeHandler);
        modalEventListeners.push({ element: select, event: 'change', handler: changeHandler });
    }

    renderForm(false);
}