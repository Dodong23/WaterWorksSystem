document.addEventListener('DOMContentLoaded', () => {
    const configForm = document.getElementById('billing-config-form');
    const generateForm = document.getElementById('generate-billing-form');
    const messageArea = document.getElementById('message-area');

    // Input fields
    const resMin = document.getElementById('res-min');
    const resCubic = document.getElementById('res-cubic');
    const comMin = document.getElementById('com-min');
    const comCubic = document.getElementById('com-cubic');
    const instMin = document.getElementById('inst-min');
    const instCubic = document.getElementById('inst-cubic');
    const indMin = document.getElementById('ind-min');
    const indCubic = document.getElementById('ind-cubic');
    const billingMonth = document.getElementById('billing-month');
    const meterReader = document.getElementById('meter-reader');
    const contactNo = document.getElementById('contact-no');

    // Fetch existing config on page load
    fetch('/api/billings/config')
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const { rates, meterReader: meterReaderData, contactNo: contactNoData } = result.data;
                resMin.value = rates.residential.minimum;
                resCubic.value = rates.residential.perCubic;
                comMin.value = rates.commercial.minimum;
                comCubic.value = rates.commercial.perCubic;
                instMin.value = rates.institutional.minimum;
                instCubic.value = rates.institutional.perCubic;
                indMin.value = rates.industrial.minimum;
                indCubic.value = rates.industrial.perCubic;
                meterReader.value = meterReaderData || '';
                contactNo.value = contactNoData || '';
            } else {
                showMessage(result.message, 'danger');
            }
        })
        .catch(err => {
            console.error('Error fetching billing config:', err);
            showMessage('Could not load billing configuration.', 'danger');
        });

    // Handle config form submission
    configForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const rates = {
            residential: {
                minimum: parseFloat(resMin.value),
                perCubic: parseFloat(resCubic.value)
            },
            commercial: {
                minimum: parseFloat(comMin.value),
                perCubic: parseFloat(comCubic.value)
            },
            institutional: {
                minimum: parseFloat(instMin.value),
                perCubic: parseFloat(instCubic.value)
            },
            industrial: {
                minimum: parseFloat(indMin.value),
                perCubic: parseFloat(indCubic.value)
            }
        };

        const meterReaderValue = meterReader.value;
        const contactNoValue = contactNo.value;

        fetch('/api/billings/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rates, meterReader: meterReaderValue, contactNo: contactNoValue })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showMessage(result.message, 'success');
            } else {
                showMessage(result.message, 'danger');
            }
        })
        .catch(err => {
            console.error('Error updating billing config:', err);
            showMessage('An error occurred while saving the configuration.', 'danger');
        });
    });

    // Handle billing generation form submission
    generateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const month = billingMonth.value;

        if (!month) {
            showMessage('Please select a month to generate billing.', 'danger');
            return;
        }

        fetch('/api/billings/generate-billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const message = `${result.message} Generated: ${result.generated}, Skipped: ${result.skipped}.`;
                showMessage(message, 'success');
            } else {
                showMessage(result.message, 'danger');
            }
        })
        .catch(err => {
            console.error('Error generating billing:', err);
            showMessage('An error occurred while generating billing.', 'danger');
        });
    });

    function showMessage(message, type = 'success') {
        messageArea.textContent = message;
        messageArea.className = `message-${type}`;
        messageArea.style.display = 'block';

        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 5000);
    }
});
