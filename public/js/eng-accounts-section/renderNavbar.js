async function fetchAndRenderUserData() {
  try {
    const response = await fetch('/api/users/me');
    if (!response.ok) {
      throw new Error('Could not fetch user data');
    }
    const user = await response.json();

    const userFullnamePlaceholder = document.getElementById('user-fullname-placeholder');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');

    if (userFullnamePlaceholder) {
      userFullnamePlaceholder.textContent = user.fullName;
    }

    if (userDropdownMenu) {
      userDropdownMenu.innerHTML = `
        <li><h6 class="dropdown-header">${user.fullName}</h6></li>
        <li><p class="dropdown-item-text"><small>${user.position}</small></p></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="/profile">Profile</a></li>
        <li><a class="dropdown-item" href="#" id="logout-btn">Logout</a></li>
      `;
    }
     // Re-add event listener for the new logout button
     const logoutBtn = document.getElementById('logout-btn');
     if (logoutBtn) {
         logoutBtn.addEventListener('click', async (e) => {
             e.preventDefault();
             try {
                 const response = await fetch('/api/auth/logout', {
                     method: 'POST',
                 });
                 if (response.ok) {
                     window.location.href = '/';
                 } else {
                     alert('Logout failed. Please try again.');
                 }
             } catch (error) {
                 console.error('Error during logout:', error);
                 alert('An error occurred during logout.');
             }
         });
     }
     
     handleRouteChange(user); // Initial route
     window.addEventListener('hashchange', () => handleRouteChange(user)); // Listen for hash changes

  } catch (error) {
    console.error('Error fetching user data:', error);
  }
}

function handleRouteChange(user) {
    const hash = window.location.hash || '#accounts';
    const mainContent = document.getElementById('main-content');

    // Remove 'active' class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Add 'active' class to the current nav link
    const activeLink = document.querySelector(`.nav-link[href="${hash}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    switch (hash) {
        case '#dashboard':
            window.renderDashboardSection(mainContent);
            break;
        case '#accounts':
            window.renderAccountsSection(mainContent);
            break;
        case '#reports':
            mainContent.innerHTML = '<h1>Reports Section</h1>'; // Placeholder
            break;
        case '#events':
            window.renderEventsSection(mainContent, user);
            break;
        case '#communication':
            mainContent.innerHTML = '<h1>Communication Section</h1>'; // Placeholder
            break;
        default:
            mainContent.innerHTML = '<h1>Page Not Found</h1>';
    }
}

function renderNavbarAndMain() {
  const body = document.body;
  body.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary sticky-top">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="#dashboard">Manukan Waterworks System - Engineering Section</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" href="#dashboard">Dashboard</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" aria-current="page" href="#accounts">Accounts</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#events">Events</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#reports">Reports</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#communication">Messages</a>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarUserDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-person-circle"></i> <span id="user-fullname-placeholder"></span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarUserDropdown" id="user-dropdown-menu">
                <li><a class="dropdown-item" href="#" id="logout-btn">Logout</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <main class="container py-3">
      <div id="main-content"></div>
    </main>
  `;
  fetchAndRenderUserData();
}

renderNavbarAndMain();