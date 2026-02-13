export function renderNavbar(container) {
    const navbarHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary sticky-top">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="#">Manukan Waterworks System - Billing Section</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" href="#dashboard">Dashboard</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#billing">Billing</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#accounts">Accounts</a>
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
    `;
    container.innerHTML = navbarHTML;
}
