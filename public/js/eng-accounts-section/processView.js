// public/js/clientProfile.js
// Handles rendering and editing of the client profile card
window.renderProcessView = function(data, primaryMainContent) {
  const mainContent = document.getElementById('main-content');

  // Helper: format date
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Status summary at top
  const overallStatus = data.completed
    ? `<span class="badge bg-success">Completed</span>`
    : `<span class="badge bg-warning text-dark">In Progress</span>`;

  // Only show On Process section if there is an active request
  // Tabs always on top
  const tabsHtml = `
  <!-- Tabs -->
  <div class="mb-3" style = "margin: 0px;>
  <!-- Back button -->
  <button type="button" class="btn btn-link p-0 mb-2" id="close-profile-panel" style="color:#1978f5; text-decoration:none;">
    <i class="bi bi-arrow-left"></i> Back
  </button>
  <!-- Title --> 
  <h4 class="fw-bold text-primary mb-0">Service Request</h4>
  <button type="button" class="btn btn-link p-0 mb-2" id="new-service-request" style = "color:#079f20ff; text-decoration:none;">
    <h6 style = "margin-top: 15px;"> +Add</h6>
  </button>
   </div>
    <ul class="nav nav-tabs mb-3" id="processTabs">
      <li class="nav-item">
        <a class="nav-link active" data-bs-toggle="tab" href="#onProcess">On Process</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-bs-toggle="tab" href="#completedReq">Completed</a>
      </li>
    </ul>
  `;
  let profileHtml = `
    ${tabsHtml}
    <div class="profile-card tab-content">
      <div class="tab-pane fade show active" id="onProcess">
        ${
          true  // true for now, to review the on process tab
            ? `
          <!-- Header with gradient -->
          <div class="profile-header p-3 rounded-top" style="background: linear-gradient(135deg, #f8f9fa, #dbeafe); color: #111;">
            <div class="d-flex justify-content-between align-items-start" style="padding: 10px 10px 0 10px;">
              <div class="d-flex align-items-center">
                <div>
                  <h4 class="mb-1">${data.serviceRequestName}</h4>
                  <p class="mb-0 opacity-75">Detailed account information and service process</p>
                </div>
              </div>
              <div class="text-end">
                ${overallStatus}
                <div class="small text-muted">Ref: ${data.requestRef || 'N/A'}</div>
              </div>
            </div>
            <!-- Client Info -->
            <div class="row mt-3">
              <div class="col-md-6">
                <div class="info-label fw-bold">Account Name</div>
                <div class="info-value">${data.accountName || ''}</div>
              </div>
              <div class="col-md-6">
                <div class="info-label fw-bold">Classification</div>
                <div class="info-value">${data.classification || ''}</div>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-md-6">
                <div class="info-label fw-bold">Address</div>
                <div class="info-value">${data.barangay || ''}${data.sitio ? ', ' + data.sitio : ''}</div>
              </div>
              <div class="col-md-6">
                <div class="info-label fw-bold">Meter Number</div>
                <div class="info-value">${data.meterNumber || ''}</div>
              </div>
            </div>
          </div>
          <div class="process-tracker mb-4">
            ${[
              {
                label: 'Service Request',
                done: true,
                badge: data.serviceRequestName ? 'Submitted' : 'Pending',
                badgeClass: data.serviceRequestName ? 'bg-primary' : 'bg-secondary',
                date: data.encodedDate || null
              },
              {
                label: 'Payment',
                done: !!data.treasuryPaid,
                badge: data.treasuryPaid ? 'Paid' : 'Pending',
                badgeClass: data.treasuryPaid ? 'bg-success' : 'bg-secondary',
                date: data.treasuryPaid ? data.accomplishedDate : null
              },
              {
                label: 'Service Delivery',
                done: !!data.engineeringDone,
                badge: data.engineeringDone ? 'Work Done' : 'Waiting',
                badgeClass: data.engineeringDone ? 'bg-warning text-dark' : 'bg-secondary',
                date: data.engineeringDone ? data.accomplishedDate : null
              },
              {
                label: 'Completed',
                done: !!data.completed,
                badge: data.completed ? 'Closed' : 'Pending',
                badgeClass: data.completed ? 'bg-success' : 'bg-secondary',
                date: data.completed ? data.completedDate || null : null
              }
            ].map((step, idx) => `
              <div class="process-step">
                <div class="step-bubble ${step.done ? 'done' : ''}">
                  ${step.done ? '<i class="fas fa-check"></i>' : idx + 1}
                </div>
                <div class="step-text">
                  <div class="step-label">${step.label}</div>
                  ${step.date ? `<div class="step-date">${formatDate(step.date)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <!-- Service Request Section -->
          <h5 class="section-title"><i class="fas fa-file-alt me-2"></i> Service Request Submission</h5>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge ${data.serviceRequestName ? 'bg-primary' : 'bg-secondary'}">
              ${data.serviceRequestName ? 'Submitted' : 'Pending'}
            </span>
            <div style="padding: 20px">
              <div class="text-muted">Municipal Engineering</div>
              <div class="text-muted">${data.encodedDate ? `Submitted: ${formatDate(data.encodedDate)}` : ''}</div>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6"><div class="info-label">Encoded By</div><div class="info-value">${data.encodedBy || ''}</div></div>
            <div class="col-md-6"><div class="info-label">Encoder Position</div><div class="info-value">${data.encoderPosition || ''}</div></div>
          </div>
          <hr>
          <!-- Treasury Section -->
          <h5 class="section-title"><i class="fas fa-coins me-2"></i> Payment</h5>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge ${data.treasuryPaid ? 'bg-success' : 'bg-secondary'}">
              ${data.treasuryPaid ? 'Paid' : 'Pending'}
            </span>
            <div class="text-muted">
              ${data.treasuryPaid && data.accomplishedDate ? `Completed: ${formatDate(data.accomplishedDate)}` : ''}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6"><div class="info-label">O.R. Number</div><div class="info-value">${data.orNumber || ''}</div></div>
            <div class="col-md-6"><div class="info-label">Amount Paid</div><div class="info-value">${data.amountPaid || ''}</div></div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6"><div class="info-label">Processed by</div><div class="info-value">${data.treasurerName || ''}</div></div>
            <div class="col-md-6"><div class="info-label">Position</div><div class="info-value">${data.treasurerPosition || ''}</div></div>
          </div>
          <hr>
          <!-- Engineering Section -->
          <h5 class="section-title"><i class="fas fa-hard-hat me-2"></i> Service Delivery</h5>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge ${data.engineeringDone ? 'bg-warning text-dark' : 'bg-secondary'}">
              ${data.engineeringDone ? 'Work Done' : 'Pending'}
            </span>
            <div class="text-muted">
              ${
                data.engineeringDone && data.accomplishedDate
                  ? `Completed: ${formatDate(data.accomplishedDate)}`
                  : (data.accomplishedDate ? `Scheduled: ${formatDate(data.accomplishedDate)}` : '')
              }
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6"><div class="info-label">Assigned Personnel</div><div class="info-value">${data.engineeringPersonnel || ''}</div></div>
            <div class="col-md-6"><div class="info-label">Designation</div><div class="info-value">${data.engineeringDesignation || ''}</div></div>
          </div>
          <div class="row">
            <div class="col-md-12"><div class="info-label">Work Description</div><div class="info-value">${data.workDescription || ''}</div></div>
          </div>
          `
            : `
          <div class="alert alert-info text-center my-5">
            No active request.
          </div>
          `
        }
        <!-- Footer -->
        <div class="card-footer bg-light d-flex justify-content-between p-3">
          <button class="btn btn-outline-secondary">
            <i class="fas fa-print me-2"></i> Print
          </button>
        </div>
      </div>
      <div class="tab-pane fade" id="completedReq">
        <h5 class="fw-bold">Completed Service Requests</h5>
        <table class="table table-bordered table-striped mt-3">
          <thead>
            <tr>
              <th>Service Request</th>
              <th>Date Completed</th>
              <th>Processed By</th>
            </tr>
          </thead>
          <tbody>
            ${data.completed ? `
              <tr>
                <td>${data.serviceRequestName}</td>
                <td>${formatDate(data.completedDate)}</td>
                <td>${data.engineeringPersonnel || data.treasurerName || 'N/A'}</td>
              </tr>
            ` : `
              <tr><td colspan="3" class="text-center text-muted">No completed requests yet.</td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  mainContent.innerHTML = profileHtml;

  document.getElementById('close-profile-panel')?.addEventListener('click', () => {
    if (window.renderAccountsSection) window.renderAccountsSection(mainContent, primaryMainContent);
  });
};
