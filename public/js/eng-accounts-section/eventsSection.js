async function renderEventsSection(mainContent) {
    mainContent.innerHTML = '<h1>Events Section</h1><div id="events-list">Loading...</div>';

    try {
        const response = await fetch('/api/misc-fees');
        if (!response.ok) {
            throw new Error('Failed to fetch miscellaneous fees');
        }
        const fees = await response.json();

        let feesHtml = `
            <h2>Work Tracking</h2>
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Client Name</th>
                        <th>Meter Number</th>
                        <th>Address</th>
                        <th>Fee Name</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Date Created</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (fees.length === 0) {
            feesHtml += '<tr><td colspan="5" class="text-center">No miscellaneous fees found.</td></tr>';
        } else {
            fees.forEach(fee => {
                const clientName = fee.clientName ? fee.clientName: 'N/A';
                feesHtml += `
                    <tr>
                        <td>${clientName}</td>
                        <td>${fee.meterNumber}</td>
                        <td>${fee.address}</td>
                        <td>${fee.name}</td>
                        <td><span class="badge bg-${fee.status === 'Paid' ? 'success' : 'warning'}">${fee.status}</span></td>
                        <td>${fee.amount.toFixed(2)}</td>
                        <td>${new Date(fee.dateCreated).toLocaleDateString()}</td>
                    </tr>
                `;
            });
        }

        feesHtml += '</tbody></table>';
        mainContent.innerHTML = feesHtml;

    } catch (error) {
        console.error('Error rendering events section:', error);
        mainContent.innerHTML = '<div class="alert alert-danger">Failed to load events. Please try again later.</div>';
    }
}

window.renderEventsSection = renderEventsSection;