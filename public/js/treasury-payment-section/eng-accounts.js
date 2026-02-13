
// public/js/eng-accounts.js
// Handles rendering and logic for the Accounts section
// Assumes barangayNumberToWord, classificationNumberToWord, and renderClientProfile are loaded globally

function setupSpaNavigation() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

  function renderDashboard() {
    if (window.renderDashboardSection) {
      window.renderDashboardSection(mainContent);
    } else {
       window.renderDashboardSection(mainContent);
      // mainContent.innerHTML = `
      //   <h2 class="mb-4">Dashboard</h2>
      //   <div class="card shadow-sm mb-3">
      //     <div class="card-body">
      //       <p>Welcome to MWS dashboard.</p>
      //     </div>
      //   </div>
      // `;
    }
  }

  function renderReports() {
    mainContent.innerHTML = `
      <h2 class="mb-4">Reports</h2>
      <div class="card shadow-sm mb-3">
        <div class="card-body">
          <p>Generate query here!.</p>
        </div>
      </div>
    `;
  }

  function renderMessagesSection() {
    mainContent.innerHTML = `
      <h2 class="mb-4">Messages</h2>
      <div class="card shadow-sm mb-3">
        <div class="card-body">
          <p>Messaging UI will be here.</p>
        </div>
      </div>
    `;
  }

  function updateContent(section) {
    switch(section) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'accounts':
        renderAccountsSection(mainContent, null);
        console.log("Accounts section rendered");
        break;
      case 'or-registry':
        if (window.renderORRegistrySection) {
            window.renderORRegistrySection(mainContent);
        }
        break;
      case 'reports':
        renderReports();
        break;
      case 'messages':
        renderMessagesSection();
        break;
      default:
        renderDashboard();
    }
  }

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        const section = this.getAttribute('href').substring(1);
        window.location.hash = section;
      }
    });
  });

  function setActiveNav(section) {
    navLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + section);
    });
  }

  function handleHashChange() {
    const section = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
    updateContent(section);
    setActiveNav(section);
  }

  window.addEventListener('hashchange', handleHashChange);
  // Initial load
  handleHashChange();
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize SPA navigation which includes handling initial hash and rendering content
  setupSpaNavigation(); // Call directly, no need for setTimeout for immediate setup
});
