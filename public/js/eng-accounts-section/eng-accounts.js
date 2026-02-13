
document.addEventListener('DOMContentLoaded', function() {

  const mainContent = document.getElementById('main-content');
  // Show dashboard by default on load
  if (window.renderDashboardSection) {
    window.renderDashboardSection(mainContent);
  }

  // Wire up dashboard navigation
  const dashboardNav = document.querySelector('[data-section="dashboard"], #dashboard-nav, .dashboard-nav');
  if (dashboardNav && window.renderDashboardSection) {
    dashboardNav.addEventListener('click', function(e) {
      e.preventDefault();
      window.renderDashboardSection(mainContent);
    });
  }
});
