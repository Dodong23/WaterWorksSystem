// public/js/treasury-payment-section/orRegistrySection.js
window.renderORRegistrySection = function(mainContent, user) {
  // CSS for OR Registry
  const orRegistryCSS = `
    :root {
        --primary-color: #0d6efd;
        --secondary-color: #6c757d;
        --success-color: #198754;
        --warning-color: #ffc107;
        --danger-color: #dc3545;
        --light-color: #f8f9fa;
        --dark-color: #212529;
    }
    
    body {
        background-color: #f8f9fa;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
    }
    
    .card {
        border: none;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
    }
    
    .card-header {
        background: linear-gradient(135deg, var(--primary-color), #0a58ca);
        color: white;
        font-weight: 600;
        border-bottom: none;
        padding: 1rem 1.25rem;
    }
    
    .or-badge {
        font-size: 0.85rem;
        font-family: 'Courier New', monospace;
        padding: 0.25rem 0.5rem;
        background-color: #f8f9fa;
        border-radius: 4px;
    }
    
    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 50px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .status-active {
        background-color: #d1e7dd;
        color: #0f5132;
        border: 1px solid #badbcc;
    }
    
    .status-inactive {
        background-color: #f8d7da;
        color: #842029;
        border: 1px solid #f5c2c7;
    }
    
    .status-pending {
        background-color: #fff3cd;
        color: #664d03;
        border: 1px solid #ffecb5;
    }
    
    .status-completed {
        background-color: #cfe2ff;
        color: #052c65;
        border: 1px solid #9ec5fe;
    }
    
    .status-hold {
        background-color: #e2e3e5;
        color: #2b2f32;
        border: 1px solid #c4c8cb;
    }
    
    .table-hover tbody tr:hover {
        background-color: rgba(13, 110, 253, 0.05);
        transform: scale(1.005);
        transition: transform 0.1s ease;
    }
    
    .form-control:focus, .form-select:focus {
        border-color: #86b7fe;
        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
    }
    
    .btn-primary {
        background: linear-gradient(135deg, var(--primary-color), #0a58ca);
        border: none;
        padding: 0.5rem 1.5rem;
        font-weight: 500;
    }
    
    .btn-primary:hover {
        background: linear-gradient(135deg, #0a58ca, #084298);
        transform: translateY(-1px);
    }
    
    .modal-header {
        background: linear-gradient(135deg, var(--primary-color), #0a58ca);
        color: white;
        padding: 1.25rem 1.5rem;
    }
    
    .pagination .page-item.active .page-link {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
    }
    
    .log-entry {
        border-left: 4px solid var(--primary-color);
        padding-left: 1rem;
        margin-bottom: 1rem;
        background-color: #f8f9fa;
        border-radius: 0 4px 4px 0;
        padding: 0.75rem;
    }
    
    .log-entry.system {
        border-left-color: var(--secondary-color);
    }
    
    .log-entry.warning {
        border-left-color: var(--warning-color);
    }
    
    .log-entry.error {
        border-left-color: var(--danger-color);
    }
    
    .search-box {
        position: relative;
    }
    
    .search-box .form-control {
        padding-right: 2.5rem;
        border-radius: 8px;
    }
    
    .search-box .search-icon {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--secondary-color);
    }
    
    .action-buttons .btn {
        min-width: 40px;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }
    
    .spinner {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @media print {
        .no-print {
            display: none !important;
        }
        
        .card {
            border: 1px solid #dee2e6 !important;
            box-shadow: none !important;
        }
    }
    
    .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
    }
    
    .connection-status {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .connection-status.online {
        background-color: #d1e7dd;
        color: #0f5132;
        border: 1px solid #badbcc;
    }
    
    .connection-status.offline {
        background-color: #f8d7da;
        color: #842029;
        border: 1px solid #f5c2c7;
    }
    
    .stat-card-icon {
        width: 48px;
        height: 48px;
        display: flex;
        alignment: align-items-center;
        justify-content: center;
        border-radius: 12px;
        font-size: 1.5rem;
    }
    
    .stat-card-value {
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1.2;
    }
    
    .stat-card-label {
        font-size: 0.875rem;
        color: #6c757d;
        margin-bottom: 0.25rem;
    }
    
    .badge-current {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
    }
    
    .progress-thin {
        height: 6px;
        border-radius: 3px;
    }
    
    .usage-progress {
        width: 80px;
    }
    
    .batch-code {
        font-family: 'Courier New', monospace;
        font-weight: 600;
        color: var(--dark-color);
    }
    
    .modal-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid #dee2e6;
    }
    
    .form-label {
        font-weight: 500;
        color: #495057;
        margin-bottom: 0.5rem;
    }
    
    .form-text {
        font-size: 0.875rem;
        color: #6c757d;
    }
    
    .current-or-badge {
        font-family: 'Courier New', monospace;
        font-weight: 600;
        background-color: #e7f1ff;
        color: #0a58ca;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        border: 1px solid #86b7fe;
    }
  `;

  // Inject CSS
  if (!document.getElementById('or-registry-style')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'or-registry-style';
    styleEl.textContent = orRegistryCSS;
    document.head.appendChild(styleEl);
  }

  // HTML for OR Registry
  const orRegistryHTML = `
    <div class="container-fluid py-4">
        <!-- Header -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="d-flex align-items-center">
                        <div class="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                            <i class="bi bi-journal-bookmark-fill text-primary fs-3"></i>
                        </div>
                        <div>
                            <h1 class="h2 fw-bold text-primary mb-1">OR Registry Management</h1>
                            <p class="text-muted mb-0">Manage Official Receipt</p>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary no-print" id="new-or-range-btn">
                            <i class="bi bi-plus-circle me-2"></i> New OR Range
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="row g-3 mb-4">
            <div class="col-xl-3 col-md-6">
                <div class="card border-start border-primary border-4 h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-card-label">Active OR Ranges</div>
                                <div class="stat-card-value" id="active-ranges-count">0</div>
                            </div>
                            <div class="stat-card-icon bg-primary bg-opacity-10">
                                <i class="bi bi-journal-check text-primary"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-3 col-md-6">
                <div class="card border-start border-success border-4 h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-card-label">Total OR Numbers</div>
                                <div class="stat-card-value" id="total-or-count">0</div>
                            </div>
                            <div class="stat-card-icon bg-success bg-opacity-10">
                                <i class="bi bi-123 text-success"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-3 col-md-6">
                <div class="card border-start border-warning border-4 h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-card-label">Used OR Numbers</div>
                                <div class="stat-card-value" id="used-or-count">0</div>
                            </div>
                            <div class="stat-card-icon bg-warning bg-opacity-10">
                                <i class="bi bi-check-circle text-warning"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-3 col-md-6">
                <div class="card border-start border-info border-4 h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-card-label">Available OR Numbers</div>
                                <div class="stat-card-value" id="available-or-count">0</div>
                            </div>
                            <div class="stat-card-icon bg-info bg-opacity-10">
                                <i class="bi bi-journal-plus text-info"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Filter -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body p-3">
                        <div class="row g-3 align-items-end">
                            <div class="col-xl-4 col-lg-6 col-md-12">
                                <div class="search-box">
                                    <input type="text" class="form-control" id="search-input" 
                                           placeholder="Search batch code, OR number, or assigned user...">
                                    <i class="bi bi-search search-icon"></i>
                                </div>
                            </div>
                            <div class="col-xl-2 col-lg-3 col-md-6">
                                <select class="form-select" id="status-filter">
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="completed">Completed</option>
                                    <option value="hold">On Hold</option>
                                </select>
                            </div>
                            <div class="col-xl-2 col-lg-3 col-md-6">
                                <select class="form-select" id="user-filter">
                                    <option value="all">All Users</option>
                                </select>
                            </div>
                            <div class="col-xl-4 col-lg-12">
                                <div class="d-flex gap-2">
                                    <button class="btn btn-outline-secondary flex-grow-1" id="clear-filters-btn">
                                        <i class="bi bi-x-circle me-2"></i> Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- OR Registry Table -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="bi bi-table me-2"></i>OR Registry
                        </h5>
                        <span class="badge bg-light text-dark">
                            <span id="total-batches">0</span> batches
                        </span>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0" id="or-registry-table">
                                <thead class="table-light">
                                    <tr>
                                        <th width="50" class="ps-4">#</th>
                                        <th>Batch Code</th>
                                        <th>OR Range</th>
                                        <th>Current OR</th>
                                        <th>Total Numbers</th>
                                        <th>Usage</th>
                                        <th>Status</th>
                                        <th>Assigned To</th>
                                        <th>Entry By</th>
                                        <th>Date Created</th>
                                        <th class="text-center no-print pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="or-registry-body">
                                    <tr>
                                        <td colspan="11" class="text-center py-5">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Loading...</span>
                                            </div>
                                            <p class="mt-2 text-muted">Loading OR registry data...</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Pagination -->
                        <div class="d-flex justify-content-between align-items-center p-3 border-top">
                            <div class="text-muted small">
                                Showing <span id="showing-from">0</span> to <span id="showing-to">0</span> of <span id="showing-total">0</span> entries
                            </div>
                            <nav aria-label="Page navigation">
                                <ul class="pagination justify-content-center mb-0" id="pagination">
                                    <!-- Pagination will be generated here -->
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Activity Log -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="bi bi-clock-history me-2"></i>Recent Activity
                        </h5>
                        <button class="btn btn-sm btn-outline-secondary no-print" id="clear-log-btn">
                            <i class="bi bi-trash me-1"></i> Clear
                        </button>
                    </div>
                    <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                        <div id="activity-log">
                            <div class="log-entry">
                                <div class="d-flex justify-content-between">
                                    <strong>System initialized</strong>
                                    <small class="text-muted">Just now</small>
                                </div>
                                <p class="mb-0 text-muted">OR Registry system loaded successfully</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: New OR Range -->
    <div class="modal fade" id="newOrRangeModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-plus-circle me-2"></i>Add New OR Batch
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="or-range-form" novalidate>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Batch Code *</label>
                                <input type="text" class="form-control" id="batch-code" 
                                       placeholder="e.g., BATCH-2024-01" required
                                       pattern="^[A-Z0-9-]+$"
                                       title="Only uppercase letters, numbers, and hyphens allowed">
                                <div class="form-text">Unique identifier for this batch</div>
                                <div class="invalid-feedback">Batch code is required and must contain only letters, numbers, and hyphens</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Prefix</label>
                                <input type="text" class="form-control" id="or-prefix" 
                                       placeholder="e.g., OR-" value=""
                                       maxlength="10">
                                <div class="form-text">Prefix for OR numbers (max 10 characters)</div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Start Number *</label>
                                <input type="number" class="form-control" id="start-number" 
                                       min="1" value="" required>
                                <div class="invalid-feedback">Start number must be at least 1</div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">End Number *</label>
                                <input type="number" class="form-control" id="end-number" 
                                       min="2" value="" required>
                                <div class="invalid-feedback">End number must be greater than start number</div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Current Number</label>
                                <input type="number" class="form-control" id="current-number" 
                                       min="1" value="">
                                <div class="form-text">Starting point for issuing ORs</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Assigned To *</label>
                                <select class="form-select" id="assigned-to" required>
                                    <option value="">Select User</option>
                                </select>
                                <div class="invalid-feedback">Please select who this batch is assigned to</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Status *</label>
                                <select class="form-select" id="status" required>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="hold">On Hold</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Notes</label>
                                <textarea class="form-control" id="notes" rows="3" 
                                          placeholder="Additional notes about this OR batch..."
                                          maxlength="500"></textarea>
                                <div class="form-text">Optional notes (max 500 characters)</div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="save-or-range">
                        <i class="bi bi-save me-1"></i> Create Batch
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Edit OR Range -->
    <div class="modal fade" id="editOrRangeModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-pencil-square me-2"></i>Edit OR Range
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-or-range-form" novalidate>
                        <input type="hidden" id="edit-id">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Batch Code</label>
                                <input type="text" class="form-control" id="edit-batch-code" readonly>
                                <div class="form-text text-muted">Batch code cannot be modified</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Prefix</label>
                                <input type="text" class="form-control" id="edit-or-prefix" maxlength="10">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Start Number *</label>
                                <input type="number" class="form-control" id="edit-start-number" min="1" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">End Number *</label>
                                <input type="number" class="form-control" id="edit-end-number" min="2" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Current Number</label>
                                <input type="number" class="form-control" id="edit-current-number" min="1">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Assigned To *</label>
                                <select class="form-select" id="edit-assigned-to" required>
                                    <option value="">Select User</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Status *</label>
                                <select class="form-select" id="edit-status" required>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="completed">Completed</option>
                                    <option value="hold">On Hold</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Notes</label>
                                <textarea class="form-control" id="edit-notes" rows="3" maxlength="500"></textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-outline-danger" id="delete-or-range">
                        <i class="bi bi-trash me-1"></i> Delete
                    </button>
                    <button type="button" class="btn btn-primary" id="update-or-range">
                        <i class="bi bi-save me-1"></i> Update
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: View Details -->
    <div class="modal fade" id="viewDetailsModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header no-print">
                    <h5 class="modal-title">
                        <i class="bi bi-info-circle me-2"></i>OR Batch Details
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row mb-4 no-print">
                        <div class="col-md-6">
                            <table class="table table-sm table-borderless">
                                <tr>
                                    <th width="40%">Batch Code:</th>
                                    <td id="detail-batch-code" class="batch-code">-</td>
                                </tr>
                                <tr>
                                    <th>OR Range:</th>
                                    <td id="detail-or-range" class="or-badge">-</td>
                                </tr>
                                <tr>
                                    <th>Current OR:</th>
                                    <td id="detail-current-or" class="current-or-badge">-</td>
                                </tr>
                                <tr>
                                    <th>Total Numbers:</th>
                                    <td id="detail-total-numbers">-</td>
                                </tr>
                                <tr>
                                    <th>Available:</th>
                                    <td id="detail-available">-</td>
                                </tr>
                                <tr>
                                    <th>Used:</th>
                                    <td id="detail-used">-</td>
                                </tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <table class="table table-sm table-borderless">
                                <tr>
                                    <th width="40%">Assigned To:</th>
                                    <td id="detail-assigned-to">-</td>
                                </tr>
                                <tr>
                                    <th>Entry By:</th>
                                    <td id="detail-entry-by">-</td>
                                </tr>
                                <tr>
                                    <th>Date Created:</th>
                                    <td id="detail-date-created">-</td>
                                </tr>
                                <tr>
                                    <th>Last Updated:</th>
                                    <td id="detail-last-updated">-</td>
                                </tr>
                                <tr>
                                    <th>Status:</th>
                                    <td><span class="badge status-badge" id="detail-status">-</span></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <div class="mb-4 no-print">
                        <h6 class="border-bottom pb-2">Notes:</h6>
                        <div class="border rounded p-3 bg-light" id="detail-notes">
                            No notes available.
                        </div>
                    </div>
                    
                    <div>
                    <h5 class="border-bottom pb-2 mb-3">Recent Usage History:</h5>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Date Issued</th>
                                        <th>OR Number</th>
                                        <th>Client Name</th>
                                        <th>Address</th>
                                        <th>Nature of Collection</th>
                                        <th class="text-end">Gross</th>
                                        <th class="text-end">Discount</th>
                                        <th class="text-end">Net Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="detail-usage">
                                    <!-- Will be populated dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="modal-footer no-print">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" id="print-details">
                        <i class="bi bi-printer me-1"></i> Print Details
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Connection Status Indicator -->
    <div id="connection-status" class="connection-status offline no-print" style="display: none;">
        <i class="bi bi-wifi-off me-1"></i> Offline Mode
    </div>
  `;
  mainContent.innerHTML = orRegistryHTML;

    // API Service Class (keeping API calls as is)
    class ORBatchService {
        static async createBatch(batchData) {
            const API_URL = '/api/or-registry/batches';
            
            console.log('Creating OR batch:', batchData);
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(batchData)
                });
                
                console.log('Response status:', response.status, response.statusText);
                
                const responseText = await response.text();
                
                if (!responseText || responseText.trim().length === 0) {
                    console.warn('Server returned empty response body');
                    
                    if (response.ok) {
                        console.log('HTTP status indicates success');
                        return {
                            success: true,
                            message: 'Batch created successfully',
                            data: this._createMockBatch(batchData),
                            isMock: true
                        };
                    } else {
                        throw new Error(`HTTP ${response.status}: Server returned empty response`);
                    }
                }
                
                let parsedResponse;
                try {
                    parsedResponse = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Failed to parse JSON:', parseError.message);
                    
                    if (response.ok) {
                        console.log('Response not JSON but status OK, using mock data');
                        return {
                            success: true,
                            message: 'Batch created successfully',
                            data: this._createMockBatch(batchData),
                            isMock: true
                        };
                    }
                    throw new Error(`Server returned invalid JSON: ${parseError.message}`);
                }
                
                if (!response.ok) {
                    const errorMsg = parsedResponse.message || 
                                   parsedResponse.error || 
                                   `HTTP ${response.status}: ${response.statusText}`;
                    throw new Error(errorMsg);
                }
                
                return {
                    success: parsedResponse.success !== false,
                    message: parsedResponse.message || 'Batch created successfully',
                    data: parsedResponse.data || parsedResponse,
                    timestamp: parsedResponse.timestamp || new Date().toISOString()
                };
                
            } catch (error) {
                console.error('API call failed:', error.message);
                return {
                    success: false,
                    message: `Failed to create batch: ${error.message}`
                };
            }
        }
        
        static async getAllBatches(params = {}) {
            const API_URL = '/api/or-registry/batches';
            
            try {
                const queryString = new URLSearchParams(params).toString();
                const url = `${API_URL}${queryString ? '?' + queryString : ''}`;
                
                console.log('Fetching from:', url);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                const responseText = await response.text();
                
                if (!responseText || responseText.trim().length === 0) {
                    console.warn('Empty response from server, using local data');
                    throw new Error('Server returned empty response');
                }
                
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Failed to parse JSON:', parseError);
                    throw new Error('Invalid JSON response from server');
                }
                
                if (!response.ok) {
                    const errorMsg = result.message || result.error || `HTTP ${response.status}`;
                    throw new Error(errorMsg);
                }
                
                if (!result || !result.success) {
                    throw new Error(result?.message || 'Invalid response format from server');
                }
                
                return {
                    success: true,
                    message: result.message || 'Data loaded successfully',
                    data: {
                        batches: result.data?.batches || result.batches || [],
                        pagination: result.data?.pagination || result.pagination || {
                            page: params.page || 1,
                            limit: params.limit || 10,
                            total: 0,
                            pages: 0
                        }
                    }
                };
                
            } catch (error) {
                console.error('Failed to fetch from API:', error.message);
                
                try {
                    const localData = localStorage.getItem('or_batches');
                    const batches = localData ? JSON.parse(localData) : this._getDefaultData();
                    
                    console.log(`Falling back to local data: ${batches.length} batches`);
                    
                    return {
                        success: true,
                        message: `Using local data (${error.message})`,
                        data: {
                            batches: batches,
                            pagination: {
                                page: params.page || 1,
                                limit: params.limit || 10,
                                total: batches.length,
                                pages: Math.ceil(batches.length / (params.limit || 10))
                            }
                        },
                        isOffline: true
                    };
                    
                } catch (localError) {
                    console.error('Failed to load local data:', localError);
                    
                    return {
                        success: true,
                        message: 'Starting with empty data',
                        data: {
                            batches: [],
                            pagination: {
                                page: 1,
                                limit: 10,
                                total: 0,
                                pages: 0
                            }
                        },
                        isOffline: true
                    };
                }
            }
        }
        
        static _createMockBatch(batchData) {
            return {
                _id: Date.now().toString(),
                ...batchData,
                entryBy: 'Administrator',
                dateCreated: new Date().toISOString().split('T')[0],
                lastUpdated: new Date().toISOString().split('T')[0],
                cancelledORs: [] // Track cancelled OR numbers
            };
        }
        
        static _getDefaultData() {
            return [
                {
                    _id: '1',
                    batchCode: 'BATCH-2024-01',
                    prefix: 'OR-',
                    startNumber: 1001,
                    endNumber: 1100,
                    currentNumber: 1026,
                    status: 'active',
                    assignedTo: 'Cashier 1',
                    entryBy: 'Administrator',
                    dateCreated: '2024-01-15',
                    lastUpdated: '2024-03-20',
                    notes: 'Main cashier batch for Q1 2024',
                    cancelledORs: []
                },
                {
                    _id: '2',
                    batchCode: 'BATCH-2024-02',
                    prefix: 'OR-',
                    startNumber: 2001,
                    endNumber: 2100,
                    currentNumber: 2001,
                    status: 'pending',
                    assignedTo: 'Cashier 2',
                    entryBy: 'Administrator',
                    dateCreated: '2024-02-01',
                    lastUpdated: '2024-02-01',
                    notes: 'Secondary cashier batch',
                    cancelledORs: []
                },
                {
                    _id: '3',
                    batchCode: 'BATCH-2024-03',
                    prefix: 'OR-',
                    startNumber: 3001,
                    endNumber: 3100,
                    currentNumber: 3050,
                    status: 'active',
                    assignedTo: 'Treasurer',
                    entryBy: 'Administrator',
                    dateCreated: '2024-03-01',
                    lastUpdated: '2024-03-18',
                    notes: 'Treasury department batch',
                    cancelledORs: []
                }
            ];
        }
        
        static async updateBatch(id, updateData) {
            try {
                const response = await fetch(`/api/or-registry/batches/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateData)
                });

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || `Failed to update batch: ${response.status}`);
                }

                return result;
            } catch (error) {
                console.error('Update batch error:', error);
                throw error;
            }
        }

        static async deleteBatch(id, reason = '') {
            try {
                const response = await fetch(`/api/or-registry/batches/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ reason })
                });

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || `Failed to delete batch: ${response.status}`);
                }

                return result;
            } catch (error) {
                console.error('Delete batch error:', error);
                throw error;
            }
        }

        static async cancelOR(batchId, cancelData) {
            try {
                const response = await fetch(`/api/or-registry/batches/${batchId}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(cancelData)
                });

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || `Failed to cancel OR: ${response.status}`);
                }

                return result;
            } catch (error) {
                console.error('Cancel OR error:', error);
                throw error;
            }
        }

        static async getBatchUsage(batchCode) { // Now only needs batchCode
            try {
                // Call the new, specific endpoint
                const response = await fetch(`/api/payments/by-batch/${batchCode}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch payments: ${response.statusText}`);
                }
                const result = await response.json();
                if (result.success && Array.isArray(result.data)) {
                    return result.data; // Returns array of payments for the specific batch
                }
                return [];
            } catch (error) {
                console.error(`Error fetching payments for batch ${batchCode}:`, error);
                throw error;
            }
        }
    }

    // Main OR Registry Class
    class ORRegistry {
        constructor() {
            this.data = [];
            this.currentPage = 1;
            this.itemsPerPage = 10;
            this.currentUser = this.getCurrentUser();
            this.initialize();
        }

        getCurrentUser() {
            return {
                id: 1,
                name: 'Administrator',
                role: 'Administrator'
            };
        }

        async populateUserDropdowns() {
            try {
                const response = await fetch('/api/users?officeCode=2');
                if (!response.ok) {
                    throw new Error('Failed to fetch treasury users');
                }
                const users = await response.json();

                const assignedToSelect = document.getElementById('assigned-to');
                const editAssignedToSelect = document.getElementById('edit-assigned-to');
                const userFilterSelect = document.getElementById('user-filter');

                // Clear existing options, keeping the first placeholder
                [assignedToSelect, editAssignedToSelect, userFilterSelect].forEach(select => {
                    if(select){
                        const firstOption = select.options[0];
                        select.innerHTML = '';
                        select.appendChild(firstOption);
                    }
                });

                users.forEach(user => {
                    if (user.fullName) {
                        const option = new Option(user.fullName, user.fullName); // Using fullName for both value and text to match existing logic
                        const editOption = new Option(user.fullName, user.fullName);
                        const filterOption = new Option(user.fullName, user.fullName);
                        
                        if(assignedToSelect) assignedToSelect.add(option);
                        if(editAssignedToSelect) editAssignedToSelect.add(editOption);
                        if(userFilterSelect) userFilterSelect.add(filterOption);
                    }
                });

            } catch (error) {
                console.error('Error populating user dropdowns:', error);
                this.addLog('UI Error', 'Could not load assigned user lists.', 'error');
            }
        }

        initialize() {
            this.setupEventListeners();
            this.loadData();
            this.populateUserDropdowns(); // Call the new function
            this.addLog('System initialized', 'OR Registry loaded successfully', 'system');
        }

        async loadData() {
            try {
                const tbody = document.getElementById('or-registry-body');
                tbody.innerHTML = this.getLoadingTemplate();
                
                const params = {
                    page: this.currentPage,
                    limit: this.itemsPerPage,
                    sortBy: 'dateCreated',
                    sortOrder: 'desc',
                    status: document.getElementById('status-filter')?.value || 'all',
                    assignedTo: document.getElementById('user-filter')?.value || 'all',
                    search: document.getElementById('search-input')?.value || ''
                };
                
                // Clean up params
                if (params.status === 'all') delete params.status;
                if (params.assignedTo === 'all') delete params.assignedTo;
                if (!params.search) delete params.search;
                
                const result = await ORBatchService.getAllBatches(params);
                
                if (result.success) {
                    this.data = result.data.batches || [];
                    this.totalItems = result.data.pagination?.total || this.data.length;
                    
                    if (result.isOffline) {
                        this.addLog('Using Offline Data', `Loaded ${this.data.length} batches from local storage`, 'warning');
                        this.showConnectionStatus(false);
                    } else {
                        this.addLog('Data Loaded', `Loaded ${this.data.length} batches from API`, 'system');
                        this.showConnectionStatus(true);
                    }
                    
                    this.renderTable();
                    this.renderPagination(this.totalItems);
                    this.updateStatistics();
                    this.updateShowingInfo();
                    
                    if (this.data.length === 0) {
                        tbody.innerHTML = this.getEmptyTemplate();
                    }
                    
                } else {
                    throw new Error(result.message || 'Failed to load data from API');
                }
                
            } catch (error) {
                console.error('Load data error:', error);
                this.showErrorInTable(error);
                this.addLog('API Connection Failed', error.message, 'error');
                this.useLocalData();
                this.showConnectionStatus(false);
            }
        }

        getLoadingTemplate() {
            return `
                <tr>
                    <td colspan="11" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2 text-muted">Loading OR registry data...</p>
                    </td>
                </tr>`;
        }

        getEmptyTemplate() {
            return `
                <tr>
                    <td colspan="11" class="text-center py-5">
                        <i class="bi bi-database-slash display-4 text-muted mb-3"></i>
                        <p class="text-muted">No OR batches found</p>
                        <p class="text-muted small">Click "New OR Range" to create your first batch</p>
                    </td>
                </tr>`;
        }

        showErrorInTable(error) {
            const tbody = document.getElementById('or-registry-body');
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-5">
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <strong>Connection Issue</strong>
                            <p class="mb-2">Could not connect to server. Using local data.</p>
                            <div class="small text-muted mb-3">Error: ${error.message}</div>
                            <div class="d-flex gap-2 justify-content-center">
                                <button class="btn btn-sm btn-outline-primary" onclick="window.orRegistry.loadData()">
                                    <i class="bi bi-arrow-clockwise me-1"></i> Retry
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>`;
        }

        showConnectionStatus(online) {
            const statusEl = document.getElementById('connection-status');
            if (online) {
                statusEl.className = 'connection-status online no-print';
                statusEl.innerHTML = '<i class="bi bi-wifi me-1"></i> Online';
                statusEl.style.display = 'block';
            } else {
                statusEl.className = 'connection-status offline no-print';
                statusEl.innerHTML = '<i class="bi bi-wifi-off me-1"></i> Offline Mode';
                statusEl.style.display = 'block';
            }
        }

        setupEventListeners() {
            document.getElementById('new-or-range-btn').addEventListener('click', () => {
                this.resetNewForm();
                new bootstrap.Modal(document.getElementById('newOrRangeModal')).show();
            });

            document.getElementById('save-or-range').addEventListener('click', () => this.saveORRange());
            document.getElementById('update-or-range').addEventListener('click', () => this.updateORRange());
            document.getElementById('delete-or-range').addEventListener('click', () => this.deleteORRange());
            document.getElementById('search-input').addEventListener('input', () => this.filterData());
            document.getElementById('status-filter').addEventListener('change', () => this.filterData());
            document.getElementById('clear-filters-btn').addEventListener('click', () => this.clearFilters());
            document.getElementById('clear-log-btn').addEventListener('click', () => this.clearLog());
            document.getElementById('print-details').addEventListener('click', () => this.printDetails());
            
            this.setupFormValidation();
        }

        setupFormValidation() {
            const startNumber = document.getElementById('start-number');
            const endNumber = document.getElementById('end-number');
            const batchCode = document.getElementById('batch-code');

            if (startNumber && endNumber) {
                const validateRange = () => {
                    const start = parseInt(startNumber.value) || 0;
                    const end = parseInt(endNumber.value) || 0;
                    
                    if (end <= start) {
                        endNumber.setCustomValidity('End number must be greater than start number');
                        endNumber.classList.add('is-invalid');
                    } else {
                        endNumber.setCustomValidity('');
                        endNumber.classList.remove('is-invalid');
                    }
                };

                startNumber.addEventListener('input', validateRange);
                endNumber.addEventListener('input', validateRange);
            }

            if (batchCode) {
                batchCode.addEventListener('input', function() {
                    this.value = this.value.toUpperCase();
                    if (!/^[A-Z0-9-]*$/.test(this.value)) {
                        this.setCustomValidity('Only letters, numbers, and hyphens allowed');
                        this.classList.add('is-invalid');
                    } else {
                        this.setCustomValidity('');
                        this.classList.remove('is-invalid');
                    }
                });
            }
        }

        resetNewForm() {
            const form = document.getElementById('or-range-form');
            if (form) {
                form.reset();
                form.classList.remove('was-validated');
                form.querySelectorAll('.form-control, .form-select').forEach(input => {
                    input.classList.remove('is-invalid', 'is-valid');
                });
            }
        }

        async saveORRange() {
            const form = document.getElementById('or-range-form');
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            const batchData = {
                batchCode: document.getElementById('batch-code').value,
                prefix: document.getElementById('or-prefix').value || '',
                startNumber: parseInt(document.getElementById('start-number').value),
                endNumber: parseInt(document.getElementById('end-number').value),
                currentNumber: parseInt(document.getElementById('current-number').value) || parseInt(document.getElementById('start-number').value),
                status: document.getElementById('status').value,
                assignedTo: document.getElementById('assigned-to').value,
                notes: document.getElementById('notes').value,
                assignedUserId: 'Administrator'
            };

            if (batchData.endNumber <= batchData.startNumber) {
                this.showToast('End number must be greater than start number', 'error');
                return;
            }

            if (batchData.currentNumber < batchData.startNumber || batchData.currentNumber > batchData.endNumber + 1) {
                this.showToast(`Current number must be between ${batchData.startNumber} and ${batchData.endNumber + 1}`, 'error');
                return;
            }

            try {
                const saveBtn = document.getElementById('save-or-range');
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner me-1"></i>Saving...';
                saveBtn.disabled = true;

                const result = await ORBatchService.createBatch(batchData);
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('newOrRangeModal'));
                modal.hide();
                
                if(result.success) {
                    this.showToast('OR batch created successfully!', 'success');
                    this.data.unshift(result.data);
                } else {
                    this.showToast(`Error creating batch: ${result.message}`, 'warning');
                }
                
                this.renderTable();
                this.updateStatistics();
                this.addLog('New Batch Created', `Batch: ${batchData.batchCode}, Range: ${batchData.prefix}${batchData.startNumber}-${batchData.endNumber}`, 'system');

            } catch (error) {
                console.error('Save batch error:', error);
                this.showToast(`Failed to create batch: ${error.message}`, 'error');
            } finally {
                const saveBtn = document.getElementById('save-or-range');
                if (saveBtn) {
                    saveBtn.innerHTML = '<i class="bi bi-save me-1"></i> Create Batch';
                    saveBtn.disabled = false;
                }
            }
        }

        renderTable() {
            const tbody = document.getElementById('or-registry-body');
            const filteredData = this.getFilteredData();
            const paginatedData = this.getPaginatedData(filteredData);
            
            if (paginatedData.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="11" class="text-center py-5">
                            <i class="bi bi-search display-4 text-muted mb-3"></i>
                            <p class="text-muted">No OR batches found matching your criteria.</p>
                        </td>
                    </tr>`;
                return;
            }

            tbody.innerHTML = paginatedData.map((item, index) => {
                const startIndex = (this.currentPage - 1) * this.itemsPerPage;
                const rowNumber = startIndex + index + 1;
                const totalNumbers = item.endNumber - item.startNumber + 1;
                const usedNumbers = item.currentNumber - item.startNumber;
                const availableNumbers = totalNumbers - usedNumbers;
                const isExhausted = item.currentNumber > item.endNumber;
                const usagePercentage = totalNumbers > 0 ? Math.min(100, Math.round((usedNumbers / totalNumbers) * 100)) : 0;
                const currentORNumber = `${item.prefix || ''}${item.currentNumber}`;
                
                return `
                <tr>
                    <td class="ps-4">${rowNumber}</td>
                    <td>
                        <div class="batch-code">${item.batchCode}</div>
                        ${item.notes ? `<small class="text-muted d-block mt-1">${item.notes.substring(0, 30)}${item.notes.length > 30 ? '...' : ''}</small>` : ''}
                    </td>
                    <td>
                        <span class="or-badge">${item.prefix || ''}${item.startNumber} - ${item.prefix || ''}${item.endNumber}</span>
                    </td>
                    <td>
                        <span class="current-or-badge">${currentORNumber}</span>
                    </td>
                    <td>${totalNumbers.toLocaleString()}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="usage-progress me-2">
                                <div class="progress progress-thin">
                                    <div class="progress-bar ${usagePercentage > 90 ? 'bg-danger' : usagePercentage > 70 ? 'bg-warning' : 'bg-success'}" 
                                         role="progressbar" style="width: ${usagePercentage}%"></div>
                                </div>
                            </div>
                            <small>${usagePercentage}%</small>
                        </div>
                    </td>
                    <td>
                        <span class="badge status-badge status-${item.status}">${this.capitalizeFirstLetter(item.status)}</span>
                    </td>
                    <td>${item.assignedTo}</td>
                    <td>${item.entryBy}</td>
                    <td>${item.dateCreated}</td>
                    <td class="text-center no-print pe-4">
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn btn-outline-primary view-details" data-id="${item._id}" title="View Details">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button type="button" class="btn btn-outline-warning edit-item" data-id="${item._id}" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');

            this.addActionListeners();
            this.renderPagination(filteredData.length);
        }

        addActionListeners() {
            document.querySelectorAll('.view-details').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showDetails(id);
                });
            });

            document.querySelectorAll('.edit-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.editORRange(id);
                });
            });

            document.querySelectorAll('.cancel-or').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.cancelOR(id);
                });
            });
        }

        getFilteredData() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const statusFilter = document.getElementById('status-filter').value;
            const userFilter = document.getElementById('user-filter').value;

            return this.data.filter(item => {
                const matchesSearch = !searchTerm || 
                    item.batchCode.toLowerCase().includes(searchTerm) ||
                    item.assignedTo.toLowerCase().includes(searchTerm) ||
                    item.entryBy.toLowerCase().includes(searchTerm) ||
                    `${item.prefix || ''}${item.currentNumber}`.toLowerCase().includes(searchTerm);
                
                const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
                const matchesUser = userFilter === 'all' || item.assignedTo === userFilter;

                return matchesSearch && matchesStatus && matchesUser;
            });
        }

        getPaginatedData(data) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            return data.slice(startIndex, endIndex);
        }

        renderPagination(totalItems) {
            const totalPages = Math.ceil(totalItems / this.itemsPerPage);
            const pagination = document.getElementById('pagination');
            
            if (totalPages <= 1) {
                pagination.innerHTML = '';
                return;
            }

            let html = '';
            
            html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>`;

            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                    html += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>`;
                } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                    html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
                }
            }

            html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>`;

            pagination.innerHTML = html;

            pagination.querySelectorAll('.page-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = parseInt(e.target.dataset.page || e.target.parentElement.dataset.page);
                    if (page && page !== this.currentPage) {
                        this.currentPage = page;
                        this.renderTable();
                    }
                });
            });
        }

        updateShowingInfo() {
            const filteredData = this.getFilteredData();
            const paginatedData = this.getPaginatedData(filteredData);
            const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endIndex = Math.min(startIndex + paginatedData.length - 1, filteredData.length);
            
            document.getElementById('showing-from').textContent = startIndex;
            document.getElementById('showing-to').textContent = endIndex;
            document.getElementById('showing-total').textContent = filteredData.length;
            document.getElementById('total-batches').textContent = filteredData.length;
        }

        editORRange(id) {
            const item = this.data.find(item => item._id === id);
            if (!item) {
                this.showToast('Batch not found', 'error');
                return;
            }

            document.getElementById('edit-id').value = item._id;
            document.getElementById('edit-batch-code').value = item.batchCode;
            document.getElementById('edit-or-prefix').value = item.prefix || '';
            document.getElementById('edit-start-number').value = item.startNumber;
            document.getElementById('edit-end-number').value = item.endNumber;
            document.getElementById('edit-current-number').value = item.currentNumber;
            document.getElementById('edit-status').value = item.status;
            document.getElementById('edit-assigned-to').value = item.assignedTo;
            document.getElementById('edit-notes').value = item.notes || '';

            new bootstrap.Modal(document.getElementById('editOrRangeModal')).show();
        }

        async updateORRange() {
            const form = document.getElementById('edit-or-range-form');
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            const id = document.getElementById('edit-id').value;
            const itemIndex = this.data.findIndex(item => item._id === id);
            
            if (itemIndex === -1) {
                this.showToast('Batch not found', 'error');
                return;
            }

            const updateData = {
                prefix: document.getElementById('edit-or-prefix').value,
                startNumber: parseInt(document.getElementById('edit-start-number').value),
                endNumber: parseInt(document.getElementById('edit-end-number').value),
                currentNumber: parseInt(document.getElementById('edit-current-number').value),
                status: document.getElementById('edit-status').value,
                assignedTo: document.getElementById('edit-assigned-to').value,
                notes: document.getElementById('edit-notes').value
            };

            if (updateData.endNumber <= updateData.startNumber) {
                this.showToast('End number must be greater than start number', 'error');
                return;
            }

            if (updateData.currentNumber < updateData.startNumber || updateData.currentNumber > updateData.endNumber + 1) {
                this.showToast(`Current number must be between ${updateData.startNumber} and ${updateData.endNumber + 1}`, 'error');
                return;
            }

            try {
                const result = await ORBatchService.updateBatch(id, updateData);
                
                this.data[itemIndex] = {
                    ...this.data[itemIndex],
                    ...updateData,
                    lastUpdated: new Date().toISOString().split('T')[0]
                };

                const modal = bootstrap.Modal.getInstance(document.getElementById('editOrRangeModal'));
                modal.hide();
                
                this.renderTable();
                this.updateStatistics();
                this.showToast('Batch updated successfully!', 'success');
                this.addLog('Batch Updated', `Batch: ${this.data[itemIndex].batchCode} updated`, 'system');
            } catch (error) {
                console.error('Update batch error:', error);
                this.showToast(`Failed to update batch: ${error.message}`, 'error');
            }
        }

        async deleteORRange() {
            const id = document.getElementById('edit-id').value;
            const item = this.data.find(item => item._id === id);
            
            if (!item) {
                this.showToast('Batch not found', 'error');
                return;
            }

            if (!confirm(`Are you sure you want to delete OR batch "${item.batchCode}"?\n\nThis action cannot be undone.`)) {
                return;
            }

            const reason = prompt('Please provide a reason for deletion:', 'No reason provided');
            if (reason === null) return;

            try {
                await ORBatchService.deleteBatch(id, reason);
                
                this.data = this.data.filter(item => item._id !== id);
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('editOrRangeModal'));
                modal.hide();
                
                this.renderTable();
                this.updateStatistics();
                this.showToast('Batch deleted successfully!', 'success');
                this.addLog('Batch Deleted', `Batch: ${item.batchCode} deleted. Reason: ${reason}`, 'warning');
            } catch (error) {
                console.error('Delete batch error:', error);
                this.showToast(`Failed to delete batch: ${error.message}`, 'error');
            }
        }

        async cancelOR(id) {
            const item = this.data.find(item => item._id === id);
            if (!item) {
                this.showToast('Batch not found', 'error');
                return;
            }

            // Check if batch is exhausted
            if (item.currentNumber > item.endNumber) {
                this.showToast('No more OR numbers available in this batch!', 'warning');
                return;
            }

            if (item.status !== 'active') {
                this.showToast(`Cannot cancel OR from ${item.status} batch`, 'warning');
                return;
            }

            const currentOR = item.currentNumber;
            const currentORNumber = `${item.prefix || ''}${currentOR}`;
            
            if (confirm(`Cancel OR number: ${currentORNumber}?\n\nBatch: ${item.batchCode}\nAssigned to: ${item.assignedTo}`)) {
                const reason = prompt('Enter cancellation reason (required):');
                if (reason === null || reason.trim() === '') {
                    this.showToast('Cancellation reason is required', 'warning');
                    return;
                }

                try {
                    // Call the API to cancel OR (keeping API call as is)
                    const cancelData = {
                        orNumber: currentORNumber,
                        reason: reason.trim(),
                        cancelledBy: this.currentUser.name,
                        cancelledAt: new Date().toISOString()
                    };
                    
                    // Note: In a real scenario, you would uncomment this:
                    //const result = await ORBatchService.cancelOR(id, cancelData);
                    
                    // For demo purposes, we'll simulate the API call
                    // Simulate API delay
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Mark current OR as used (cancelled) and move to next
                    // Initialize cancelledORs array if it doesn't exist
                    if (!item.cancelledORs) {
                        item.cancelledORs = [];
                    }
                    
                    // Add to cancelled ORs list
                    item.cancelledORs.push({
                        orNumber: currentORNumber,
                        reason: reason.trim(),
                        cancelledBy: this.currentUser.name,
                        cancelledAt: new Date().toISOString()
                    });
                    
                    // Increment current number for the next available OR
                    item.currentNumber++;
                    item.lastUpdated = new Date().toISOString().split('T')[0];
                    
                    // Update status if batch is exhausted
                    if (item.currentNumber > item.endNumber) {
                        item.status = 'completed';
                        this.showToast(`Batch ${item.batchCode} is now completed (no more ORs available)`, 'info');
                    }
                    
                    // Save to local storage for offline mode
                    this.saveToLocalStorage();
                    
                    // Update UI
                    this.renderTable();
                    this.updateStatistics();
                    
                    // Show success message
                    this.showToast(`OR ${currentORNumber} cancelled successfully! Next available OR: ${item.prefix || ''}${item.currentNumber}`, 'success');
                    
                    // Add log entry
                    this.addLog('OR Number Cancelled', `OR ${currentORNumber} cancelled from batch ${item.batchCode}. Reason: ${reason}`, 'warning');
                    
                } catch (error) {
                    console.error('Cancel OR error:', error);
                    this.showToast(`Failed to cancel OR: ${error.message}`, 'error');
                }
            }
        }

        saveToLocalStorage() {
            try {
                localStorage.setItem('or_batches', JSON.stringify(this.data));
            } catch (error) {
                console.error('Failed to save to localStorage:', error);
            }
        }

        showDetails(id) {
            const item = this.data.find(item => item._id === id);
            if (!item) {
                this.showToast('Batch not found', 'error');
                return;
            }

            const totalNumbers = item.endNumber - item.startNumber + 1;
            const usedNumbers = item.currentNumber - item.startNumber;
            const availableNumbers = totalNumbers - usedNumbers;
            const currentORNumber = `${item.prefix || ''}${item.currentNumber}`;

            document.getElementById('detail-batch-code').textContent = item.batchCode;
            document.getElementById('detail-or-range').textContent = `${item.prefix || ''}${item.startNumber} - ${item.prefix || ''}${item.endNumber}`;
            document.getElementById('detail-current-or').textContent = currentORNumber;
            document.getElementById('detail-total-numbers').textContent = totalNumbers.toLocaleString();
            document.getElementById('detail-available').textContent = availableNumbers.toLocaleString();
            document.getElementById('detail-used').textContent = usedNumbers.toLocaleString();
            document.getElementById('detail-assigned-to').textContent = item.assignedTo;
            document.getElementById('detail-entry-by').textContent = item.entryBy;
            document.getElementById('detail-date-created').textContent = item.dateCreated;
            document.getElementById('detail-last-updated').textContent = item.lastUpdated;
            document.getElementById('detail-notes').textContent = item.notes || 'No notes available';
            
            const statusBadge = document.getElementById('detail-status');
            statusBadge.textContent = this.capitalizeFirstLetter(item.status);
            statusBadge.className = `badge status-badge status-${item.status}`;

            this.showUsageDetails(id, item);
            new bootstrap.Modal(document.getElementById('viewDetailsModal')).show();
        }

        async showUsageDetails(id, item) {
            const tbody = document.getElementById('detail-usage');
            const showLoading = () => {
                tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4">
                    <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
                    <span class="ms-2 text-muted">Loading usage history...</span>
                </td></tr>`;
            };
            const showError = (message) => {
                 tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4">
                    <i class="bi bi-exclamation-triangle-fill text-danger"></i>
                    <span class="ms-2 text-danger">Could not load history: ${message}</span>
                </td></tr>`;
            }

            showLoading();

            try {
                // 1. Fetch payments for this specific batch using the new endpoint
                const batchPayments = await ORBatchService.getBatchUsage(item.batchCode);
                const paymentsByOR = new Map(batchPayments.map(p => [p.orNumber, p])); // Keyed by numeric OR

                const allOrs = [];
                for (let i = item.startNumber; i <= item.endNumber; i++) {
                    const orNumberInt = i;
                    const orNumberStr = `${item.prefix || ''}${orNumberInt}`;
                    
                    const cancelledInfo = item.cancelledORs?.find(c => c.orNumber === orNumberStr);
                    const paymentInfo = paymentsByOR.get(orNumberInt);

                    let detail = {
                        orNumber: orNumberStr,
                        dateIssued: '', clientName: '', address: '', purpose: '',
                        gross: 0, discount: 0, netAmount: 0,
                        status: 'Available'
                    };

                    if (cancelledInfo) {
                        detail = {
                            ...detail,
                            status: 'Cancelled',
                            dateIssued: new Date(cancelledInfo.cancelledAt).toLocaleDateString(),
                            purpose: `N/A`,
                            clientName: 'Cancelled',
                            address: 'N/A',
                            gross: 0,
                            discount: 0,
                            netAmount: 0,
                        };
                    } else if (paymentInfo) {
                        
                        if (paymentInfo.status === 'cancelled') {
                             detail = {
                                ...detail,
                                status: 'Cancelled',
                                dateIssued: new Date(paymentInfo.paymentDate).toLocaleDateString(),
                                clientName: paymentInfo.payor,
                                address: paymentInfo.address || 'N/A',
                                purpose: '',
                                gross: 0,
                                discount: 0,
                                netAmount: 0,
                            };
                        } else {
                            const gross = paymentInfo.allocation?.reduce((sum, alloc) => sum + (alloc.amount || 0) + (alloc.discount || 0), 0) || paymentInfo.totalAmount;
                            const discount = paymentInfo.allocation?.reduce((sum, alloc) => sum + (alloc.discount || 0), 0) || 0;

                            detail = {
                                ...detail,
                                status: 'Issued',
                                dateIssued: new Date(paymentInfo.paymentDate).toLocaleDateString(),
                                clientName: paymentInfo.payor,
                                address: paymentInfo.address || 'N/A',
                                purpose: paymentInfo.allocation?.map(a => a.description).join(', '),
                                gross: gross,
                                discount: discount,
                                netAmount: paymentInfo.totalAmount,
                            };
                        }

                    } else if (orNumberInt < item.currentNumber) {
                        detail.status = 'Skipped/Cancelled'; 
                        detail.purpose = 'No payment record found';
                    }
                    
                    allOrs.push(detail);
                }

                if (allOrs.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="9" class="text-center text-muted py-5">
                                <i class="bi bi-folder2-open fs-2"></i>
                                <p class="mt-2">No OR numbers defined in this batch.</p>
                            </td>
                        </tr>`;
                    return;
                }
            
                const statusConfig = {
                    'Issued': { color: 'success', icon: 'bi-check-circle' },
                    'Cancelled': { color: 'danger', icon: 'bi-x-circle' },
                    'Available': { color: 'secondary', icon: 'bi-circle' },
                    'Skipped/Cancelled': { color: 'warning', icon: 'bi-dash-circle' },
                };
const totalAmount = allOrs.reduce((sum, or) => sum + or.netAmount, 0);
const totalGross = allOrs.reduce((sum, or) => sum + or.gross, 0);
const totalDiscount = allOrs.reduce((sum, or) => sum + or.discount, 0);

function formatNumber(num) {
    if (num === 0 || num === null || num === undefined) return '';
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

tbody.innerHTML = allOrs.map(or => {
    const config = statusConfig[or.status] || { color: 'light', icon: 'bi-dot' };
    const isDataRow = or.status === 'Issued' || or.status === 'Cancelled';
    return `
    <tr class="${isDataRow ? '' : 'text-muted'}" style="${or.status === 'Available' ? 'opacity: 0.6;' : ''}">
        <td>${or.dateIssued}</td>
        <td><span class="badge bg-light text-dark font-monospace">${or.orNumber.replace(item.prefix || '', '')}</span></td>
        <td><small>${or.clientName}</small></td>
        <td><small>${or.address}</small></td>
        <td><small>${or.purpose}</small></td>
        <td class="text-end font-monospace">${or.gross > 0 ? or.gross.toFixed(2) : ''}</td>
        <td class="text-end font-monospace text-danger">${or.discount > 0 ? `(${or.discount.toFixed(2)})` : ''}</td>
        <td class="text-end fw-bold font-monospace">${or.netAmount > 0 ? or.netAmount.toFixed(2) : ''}</td>
        <td>
            <span class="badge bg-${config.color}-subtle text-${config.color}-emphasis border border-${config.color}-subtle">
               <i class="bi ${config.icon} me-1"></i> ${or.status}
            </span>
        </td>
    </tr>
    `;
}).join('') + `
<tr class="table-active fw-bold">
    <td colspan="5" class="text-end">Total:</td>
    <td class="text-end font-monospace">${totalGross.toFixed(2)}</td>
    <td class="text-end font-monospace text-danger">(${totalDiscount.toFixed(2)})</td>
    <td class="text-end font-monospace border-start border-end">${totalAmount.toFixed(2)}</td>
    <td></td>
</tr>`;

            } catch (error) {
                showError(error.message);
            }
        }

        updateStatistics() {
            const activeRanges = this.data.filter(item => item.status === 'active').length;
            const totalNumbers = this.data.reduce((sum, item) => sum + (item.endNumber - item.startNumber + 1), 0);
            const usedNumbers = this.data.reduce((sum, item) => sum + (item.currentNumber - item.startNumber), 0);
            const availableNumbers = totalNumbers - usedNumbers;

            document.getElementById('active-ranges-count').textContent = activeRanges;
            document.getElementById('total-or-count').textContent = totalNumbers.toLocaleString();
            document.getElementById('used-or-count').textContent = usedNumbers.toLocaleString();
            document.getElementById('available-or-count').textContent = availableNumbers.toLocaleString();
        }

        filterData() {
            this.currentPage = 1;
            this.renderTable();
        }

        clearFilters() {
            document.getElementById('search-input').value = '';
            document.getElementById('status-filter').value = 'all';
            document.getElementById('user-filter').value = 'all';
            this.filterData();
        }

        exportData() {
            const data = this.getFilteredData();
            if (data.length === 0) {
                this.showToast('No data to export', 'warning');
                return;
            }
            
            const csv = this.convertToCSV(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `or-registry-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            
            this.showToast(`Exported ${data.length} records`, 'success');
        }

        convertToCSV(data) {
            const headers = ['Batch Code', 'OR Range', 'Current OR', 'Start Number', 'End Number', 'Total Numbers', 'Used Numbers', 'Available Numbers', 'Status', 'Assigned To', 'Entry By', 'Date Created', 'Last Updated'];
            const rows = data.map(item => {
                const totalNumbers = item.endNumber - item.startNumber + 1;
                const usedNumbers = item.currentNumber - item.startNumber;
                const availableNumbers = totalNumbers - usedNumbers;
                const currentOR = `${item.prefix || ''}${item.currentNumber}`;
                
                return [
                    item.batchCode,
                    `${item.prefix || ''}${item.startNumber}-${item.prefix || ''}${item.endNumber}`,
                    currentOR,
                    item.startNumber,
                    item.endNumber,
                    totalNumbers,
                    usedNumbers,
                    availableNumbers,
                    item.status,
                    item.assignedTo,
                    item.entryBy,
                    item.dateCreated,
                    item.lastUpdated
                ];
            });
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }

        addLog(title, message, type = 'system') {
            const logContainer = document.getElementById('activity-log');
            const timestamp = new Date().toLocaleTimeString();
            
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            logEntry.innerHTML = `
                <div class="d-flex justify-content-between">
                    <strong>${title}</strong>
                    <small class="text-muted">${timestamp}</small>
                </div>
                <p class="mb-0 text-muted">${message}</p>
            `;
            
            logContainer.insertBefore(logEntry, logContainer.firstChild);
            
            const entries = logContainer.querySelectorAll('.log-entry');
            if (entries.length > 10) {
                entries[entries.length - 1].remove();
            }
        }

        clearLog() {
            if (confirm('Clear all activity log entries?')) {
                document.getElementById('activity-log').innerHTML = '';
                this.addLog('Log Cleared', 'All activity log entries have been cleared', 'system');
            }
        }

        printDetails() {
            const modalContent = document.querySelector('#viewDetailsModal .modal-content');
            if (!modalContent) return;

            const contentToPrint = modalContent.cloneNode(true);
            
            // Get main page styles to apply to print window
            let styles = '';
            document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(styleEl => {
                styles += styleEl.outerHTML;
            });

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>OR Batch Usage Details</title>
                    ${styles}
                    <style>
                        body { background-color: #fff !important; }
                        .modal-content { border: none !important; box-shadow: none !important; }
                    </style>
                </head>
                <body>
                    <div class="modal-content">
                        ${contentToPrint.innerHTML}
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();

            // Use timeout to ensure content is loaded before printing
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 500);
        }

        showToast(message, type = 'info') {
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'toast-container';
                document.body.appendChild(container);
            }

            const toastId = 'toast-' + Date.now();
            const toast = document.createElement('div');
            toast.id = toastId;
            toast.className = `toast show align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'success'} border-0`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');

            const icon = type === 'success' ? 'bi-check-circle' : type === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle';
            
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-center">
                        <i class="bi ${icon} me-2 fs-5"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="document.getElementById('${toastId}').remove()"></button>
                </div>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                if (document.getElementById(toastId)) {
                    document.getElementById(toastId).remove();
                }
            }, 5000);
        }

        useLocalData() {
            try {
                const localData = localStorage.getItem('or_batches');
                this.data = localData ? JSON.parse(localData) : ORBatchService._getDefaultData();
                this.totalItems = this.data.length;
                this.renderTable();
                this.renderPagination(this.totalItems);
                this.updateStatistics();
            } catch (error) {
                console.error('Failed to parse local data:', error);
                this.data = [];
            }
        }

        capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
    }

    window.orRegistry = new ORRegistry();
};
