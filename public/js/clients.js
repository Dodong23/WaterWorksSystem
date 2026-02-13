document.addEventListener('DOMContentLoaded', function() {
  // View button click handlers
  document.querySelectorAll('.btn-view').forEach(button => {
    button.addEventListener('click', function() {
      const clientId = this.getAttribute('data-client-id');
      openModal(clientId);
    });
  });

  // Close modal handler
  document.querySelector('.close-btn').addEventListener('click', closeModal);
});

function openModal(clientId) {
  const modal = document.getElementById('clientModal');
  document.getElementById('modalTitle').textContent = 'Loading...';
  document.getElementById('modalContent').innerHTML = '<p>Loading client details...</p>';
  
  // In a real app, you would fetch data here:
  fetch(`/api/clients/${clientId}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('modalTitle').textContent = data.fullName;
      document.getElementById('modalContent').innerHTML = `
        <div class="client-field">
          <span class="field-label">Client ID:</span>
          <span class="field-value">${data.clientId}</span>
        </div>
        <!-- Add other fields as needed -->
      `;
    })
    .catch(error => {
      document.getElementById('modalContent').innerHTML = `
        <p>Error loading client details</p>
        <p>${error.message}</p>
      `;
    });

  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('clientModal').style.display = 'none';
}

// Close when clicking outside modal
window.addEventListener('click', function(event) {
  if (event.target === document.getElementById('clientModal')) {
    closeModal();
  }
});

