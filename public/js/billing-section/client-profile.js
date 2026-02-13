export function renderClientProfile(container, clientData, onBack) {
    const profileHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Client Profile</h5>
                <button class="btn btn-sm btn-outline-secondary" id="back-to-list-btn">Back to List</button>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Name:</strong> ${clientData.name}</p>
                        <p><strong>Address:</strong> ${clientData.address}</p>
                        <p><strong>Classification:</strong> ${classificationNumberToWord(clientData.classification)}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Meter Number:</strong> ${clientData.meterNumber}</p>
                        <p><strong>Status:</strong> ${getStatusBadge(clientData.status)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = profileHTML;

    document.getElementById('back-to-list-btn').addEventListener('click', () => {
        if (typeof onBack === 'function') {
            onBack();
        }
    });

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

    function classificationNumberToWord(classification) {
        if (classification === null || classification === undefined) return 'Unknown';
        switch (parseInt(classification)) {
            case 1: return 'Residential';
            case 2: return 'Institutional';
            case 3: return 'Commercial';
            case 4: return 'Industrial';
            default: return 'Unknown';
        }
    }
}
