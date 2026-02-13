// public/js/clientProfile.js
// Handles rendering and editing of the client profile card
// Assumes barangayNumberToWord and classificationNumberToWord are loaded globally
window.renderClientProfile = function(client, primaryMainContent) {
  const mainContent = document.getElementById('main-content');

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
                    <input type="date" class="form-control" name="lastReadDate" value="${client.lastReadDate ? (function(d){
                      // Try to parse MM/DD/YYYY or DD/MM/YYYY to YYYY-MM-DD
                      const parts = d.split('/');
                      if(parts.length === 3) {
                        // If year is 4 digits, assume MM/DD/YYYY, else DD/MM/YYYY
                        let y = parts[2].length === 4 ? parts[2] : parts[0];
                        let m = parts[2].length === 4 ? parts[0] : parts[1];
                        let day = parts[2].length === 4 ? parts[1] : parts[2];
                        return `${y}-${m.padStart(2,'0')}-${day.padStart(2,'0')}`;
                      }
                      return '';
                    })(client.lastReadDate) : ''}" maxlength="55" ${readonly} />
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
                  <button type="button" class="btn btn-outline-secondary px-4 me-2" id="close-profile-btn">Cancel</button>
                  ${editMode
                    ? '<button type="submit" class="btn btn-success px-4">Save Changes</button>'
                    : '<button type="button" class="btn btn-primary px-4" id="edit-profile-btn">Edit</button>'}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    mainContent.innerHTML = profileHtml;

    document.getElementById('close-profile-btn')?.addEventListener('click', () => {
     if (window.renderAccountsSection) window.renderAccountsSection(mainContent, primaryMainContent);
    });
    document.getElementById('close-profile-panel')?.addEventListener('click', () => {
     if (window.renderAccountsSection) window.renderAccountsSection(mainContent, primaryMainContent);
    });

    if (!editMode) {
      document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
        renderForm(true);
      });
    } else {
      document.getElementById('client-profile-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const updatedClient = {};
        for (let [key, value] of formData.entries()) {
          if (["balance","freeCubic","lessAmount","lastReadValue","classification","barangay","status"].includes(key)) {
            value = value === '' ? 0 : Number(value);
          }
          // Convert lastReadDate from YYYY-MM-DD to MM/DD/YYYY before saving
          if (key === 'lastReadDate' && value) {
            const parts = value.split('-');
            if (parts.length === 3) {
              value = `${parts[1]}/${parts[2]}/${parts[0]}`;
            }
          }
          updatedClient[key] = value;
        }
        updatedClient._id = client._id;
        // Always send PATCH request to /water/clients/:id
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
          if (window.renderClientProfile) window.renderClientProfile(data);
        })
        .catch(err => {
          alert('Failed to update profile: ' + err.message);
        });
      });
    }
  }

  renderForm(false);
}
