// public/js/treasury-payment-section/feesSection.js

window.renderFeesSection = function(mainContent) {
    let allFees = [];
    let currentEditId = null;

    const render = () => {
        const html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="fw-bold text-primary">Service fees</h2>
                <button class="btn btn-primary" id="add-new-fee-btn" data-bs-toggle="modal" data-bs-target="#feeModal">
                    <i class="bi bi-plus-circle"></i> Add New Fee
                </button>
            </div>
            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Responsible Office</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="fees-table-body">
                                <!-- Fees will be rendered here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Fee Modal -->
            <div class="modal fade" id="feeModal" tabindex="-1" aria-labelledby="feeModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <form id="fee-form">
                            <div class="modal-header">
                                <h5 class="modal-title" id="feeModalLabel">Add New Fee</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label for="fee-name" class="form-label">Fee Name</label>
                                    <input type="text" class="form-control" id="fee-name" required>
                                </div>
                                <div class="mb-3">
                                    <label for="fee-description" class="form-label">Description</label>
                                    <textarea class="form-control" id="fee-description" rows="3"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="fee-amount" class="form-label">Amount (PHP)</label>
                                    <input type="number" class="form-control" id="fee-amount" min="0" step="0.01" required>
                                </div>
                                <div class="mb-3">
                                    <label for="fee-office" class="form-label">Responsible Office</label>
                                    <select class="form-select" id="fee-office" required>
                                        <option value="">Select an office...</option>
                                        <option value="1">Billing</option>
                                        <option value="2">Treasury</option>
                                        <option value="3">Engineering</option>
                                        <option value="0">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="submit" class="btn btn-primary">Save Fee</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
        fetchAndRenderFees();
        attachEventListeners();
    };

    const fetchAndRenderFees = () => {
        const tbody = document.getElementById('fees-table-body');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
        fetch('/api/fees')
            .then(res => res.json())
            .then(fees => {
                allFees = fees;
                renderTable(fees);
            })
            .catch(err => {
                console.error('Error fetching fees:', err);
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load fees.</td></tr>';
            });
    };

    const renderTable = (fees) => {
        const tbody = document.getElementById('fees-table-body');
        if (fees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No fees defined yet.</td></tr>';
            return;
        }

        const officeMap = { '1': 'Billing', '2': 'Treasury', '3': 'Engineering', '0': 'Admin' };

        tbody.innerHTML = fees.map(fee => `
            <tr>
                <td>${fee.name}</td>
                <td>${fee.description || ''}</td>
                <td>${Number(fee.amount).toFixed(2)}</td>
                <td>${officeMap[fee.accomplishingOffice] || 'Unknown'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${fee._id}" data-bs-toggle="modal" data-bs-target="#feeModal">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${fee._id}">Delete</button>
                </td>
            </tr>
        `).join('');
    };

    const attachEventListeners = () => {
        const feeModal = document.getElementById('feeModal');
        const modal = new bootstrap.Modal(feeModal);
        const modalTitle = document.getElementById('feeModalLabel');
        const feeForm = document.getElementById('fee-form');

        // Reset modal on close
        feeModal.addEventListener('hidden.bs.modal', () => {
            currentEditId = null;
            modalTitle.textContent = 'Add New Fee';
            feeForm.reset();
        });

        // Handle Add button
        document.getElementById('add-new-fee-btn').addEventListener('click', () => {
            currentEditId = null;
            modalTitle.textContent = 'Add New Fee';
        });

        // Handle Edit and Delete buttons in table
        document.getElementById('fees-table-body').addEventListener('click', (e) => {
            const target = e.target;
            const feeId = target.dataset.id;

            if (target.classList.contains('edit-btn')) {
                currentEditId = feeId;
                modalTitle.textContent = 'Edit Fee';
                const fee = allFees.find(f => f._id === feeId);
                if (fee) {
                    document.getElementById('fee-name').value = fee.name;
                    document.getElementById('fee-description').value = fee.description || '';
                    document.getElementById('fee-amount').value = fee.amount;
                    document.getElementById('fee-office').value = fee.accomplishingOffice;
                }
            }

            if (target.classList.contains('delete-btn')) {
                if (confirm('Are you sure you want to delete this fee?')) {
                    fetch(`/api/fees/${feeId}`, { method: 'DELETE' })
                        .then(res => {
                            if (!res.ok) throw new Error('Failed to delete');
                            fetchAndRenderFees();
                        })
                        .catch(err => alert(err.message));
                }
            }
        });

        // Handle form submission
        feeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const feeData = {
                name: document.getElementById('fee-name').value,
                description: document.getElementById('fee-description').value,
                amount: document.getElementById('fee-amount').value,
                accomplishingOffice: document.getElementById('fee-office').value
            };

            const url = currentEditId ? `/api/fees/${currentEditId}` : '/api/fees';
            const method = currentEditId ? 'PUT' : 'POST';

            fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feeData)
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to save fee');
                return res.json();
            })
            .then(() => {
                modal.hide();
                fetchAndRenderFees();
            })
            .catch(err => alert(err.message));
        });
    };

    render();
};
