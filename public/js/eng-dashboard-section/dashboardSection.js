// public/js/dashboardSection.js
// Renders the dashboard section with charts and recommendations
// Assumes Chart.js is loaded globally

window.renderDashboardSection = function(mainContent) {
  mainContent.innerHTML = `
    <div class="row g-4">
      <div class="col-lg-7">
      <h4 class="mb-4 fw-bold text-primary">Service Management Dashboard</h4>
        <div class="card shadow-sm border-0 mb-4">
          <div class="card-body">
            <h5 class="fw-bold mb-3">Recommendations</h5>
            <ul class="mb-4" id="dashboard-recommendations">
              <li>Loading recommendations...</li>
            </ul>
            <div class="row g-3">
              <div class="col-md-6">
                <canvas id="statusChart" height="220"></canvas>
                <div class="mt-2 small" id="status-legend"></div>
              </div>
              <div class="col-md-6">
                <canvas id="classificationChart" height="220"></canvas>
                <div class="mt-2 small" id="classification-legend"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="card shadow-sm border-0 mb-4">
          <div class="card-body">
            <div class="mb-4" id="status-cards"></div>
            <div class="row g-2" id="classification-cards"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Fetch client data and render charts
  fetch('water/clients')
    .then(res => res.json())
    .then(clients => {
      // Status chart data
      const statusLabels = ['Disconnected', 'On Process', 'For Assessment', 'Active', 'Temporarily Disconnected'];
      const statusColors = ['#dc3545', '#ffc107', '#0dcaf0', '#0d6efd', '#6c757d'];
      const statusCounts = [0, 0, 0, 0, 0];
      clients.forEach(c => {
        if (typeof c.status === 'number' && statusCounts[c.status] !== undefined) statusCounts[c.status]++;
      });
      
      const classLabels = ['Residential', 'Institutional', 'Commercial', 'Industrial'];
      const classColors = ['#198754', '#0d6efd', '#212529', '#6c757d'];
      const classCounts = [0, 0, 0, 0];
      clients.forEach(c => {
        // 1=Residential, 2=Institutional, 3=Commercial, 4=Industrial
        if (typeof c.classification === 'number' && c.classification >= 1 && c.classification <= 4) classCounts[c.classification-1]++;
      });

      // Render status chart
      if (window.Chart) {
        // Before creating a new Chart instance:
        if (window.statusChartInstance) {
          window.statusChartInstance.destroy();
        }

        // Then create the new chart and store it globally:
        window.statusChartInstance = new Chart(document.getElementById('statusChart').getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: statusLabels,
            datasets: [{
              data: statusCounts,
              backgroundColor: statusColors,
              borderWidth: 2
            }]
          },
          options: {
            plugins: { legend: { display: false } },
            cutout: '70%',
            responsive: true
          }
        });
        // Render classification chart
        new Chart(document.getElementById('classificationChart').getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: classLabels,
            datasets: [{
              data: classCounts,
              backgroundColor: classColors,
              borderWidth: 2
            }]
          },
          options: {
            plugins: { legend: { display: false } },
            cutout: '70%',
            responsive: true
          }
        });
      }

      // Dynamic status legend
      const statusTotal = statusCounts.reduce((a, b) => a + b, 0);
      const statusLegend = statusLabels.map((label, i) =>
        `<span class="badge" style="background:${statusColors[i]};width:16px;height:16px;display:inline-block;"></span> ${label} (${statusTotal ? Math.round((statusCounts[i] / statusTotal) * 100) : 0}%)<br>`
      ).join('');
      document.getElementById('status-legend').innerHTML = statusLegend;

      // Dynamic classification legend
      const classTotal = classCounts.reduce((a, b) => a + b, 0);
      const classLegend = classLabels.map((label, i) =>
        `<span class="badge" style="background:${classColors[i]};width:16px;height:16px;display:inline-block;"></span> ${label} (${classTotal ? Math.round((classCounts[i] / classTotal) * 100) : 0}%)<br>`
      ).join('');
      document.getElementById('classification-legend').innerHTML = classLegend;

      // Dynamic classification cards
      const classCardStyles = [
        'background: linear-gradient(90deg, #198754 60%, #43e97b 100%); color: #fff;', // Residential
        'background: linear-gradient(90deg, #0d6efd 60%, #6c757d 100%); color: #fff;', // Institutional
        'background: linear-gradient(90deg, #212529 60%, #6c757d 100%); color: #fff;', // Commercial
        'background: linear-gradient(90deg, #6c757d 60%, #adb5bd 100%); color: #fff;' // Industrial
      ];
      document.getElementById('classification-cards').innerHTML = classLabels.map((label, i) => `
        <div class="col-12 col-md-6">
          <div class="rounded-3 p-3 mb-2 d-flex flex-column align-items-start justify-content-center" style="min-height: 90px; ${classCardStyles[i]}">
            <div class="fw-bold fs-4">${classCounts[i]}</div>
            <div class="small">${label}</div>
          </div>
        </div>
      `).join('');

      // Dynamic status cards
      const statusCardLabels = ['On Process', 'For Assessment', 'Temporarily Disconnected', 'Disconnected', 'Active'];
      const statusCardColors = [
        'background: linear-gradient(90deg, #f0be4aff 60%, #fff3cd 100%); color: #212529;', // On Process
        'background: linear-gradient(90deg, #0dcaf0 60%, #b6effb 100%); color: #212529;', // New
        'background: linear-gradient(90deg, #6c757d 60%, #dee2e6 100%); color: #fff;', // Temp. Disconnected
        'background: linear-gradient(90deg, #dc3545 60%, #ffb3b3 100%); color: #fff;', // Disconnected
        'background: linear-gradient(90deg, #0d6efd 60%, #b6d4fe 100%); color: #fff;', // Active
      ];
      const statusMap = [1,2,4,0,3]
      document.getElementById('status-cards').innerHTML = statusCardLabels.map((label, i) => `
        <div class="mb-2">
          <div class="rounded-3 p-3 d-flex flex-column align-items-start justify-content-center" style="min-height: 90px; ${statusCardColors[i]}">
            <div class="fw-bold fs-4">${statusCounts[statusMap[i]]}</div>
            <div class="small">${label}</div>
          </div>
        </div>
      `).join('');

      // Dynamic recommendations/insights
      const recList = document.getElementById('dashboard-recommendations');
      let recs = [];
      const total = clients.length;
      if (total === 0) {
        recs.push('No client data available.');
      } else {
        // Example insights
        const activePct = total ? Math.round((statusCounts[3] / total) * 100) : 0;
        const disconnectedPct = total ? Math.round((statusCounts[0] / total) * 100) : 0;
        const newPct = total ? Math.round((statusCounts[2] / total) * 100) : 0;
        const residentialPct = total ? Math.round((classCounts[1] / total) * 100) : 0;
        const institutionalPct = total ? Math.round((classCounts[2] / total) * 100) : 0;
        const commercialPct = total ? Math.round((classCounts[3] / total) * 100) : 0;
        const industrialPct = total ? Math.round((classCounts[4] / total) * 100) : 0;
        const onProcess = statusCounts[1]?  statusCounts[1] : 0;

        if (onProcess >= 3) recs.push(`Check the application date for this ${onProcess} on process request and make a follow up call if necessary.`);
        if (activePct < 60) recs.push('Active clients are below 60%. Consider outreach to increase engagement.');
        if (disconnectedPct > 10) recs.push('Disconnected clients exceed 10%. Investigate causes and improve retention.');
        if (newPct > 20) recs.push('High number of new clients. Ensure onboarding processes are efficient.');
        if (residentialPct > 50) recs.push('Majority of clients are Residential. Consider tailored services or promotions.');
        if (institutionalPct > 20) recs.push('Institutional clients are significant. Review institutional service agreements.');
        if (commercialPct > 20) recs.push('Commercial clients are a large segment. Explore business partnership opportunities.');
        if (industrialPct > 10) recs.push('Industrial clients are growing. Assess infrastructure for industrial demand.');
        if (recs.length === 0) recs.push('Client distribution is balanced. Continue monitoring for trends.');
      }
      recList.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
    });
}
