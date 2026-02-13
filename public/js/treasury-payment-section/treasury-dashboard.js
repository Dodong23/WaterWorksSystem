window.renderDashboardSection = function(mainContent) {
    mainContent.innerHTML = `
      <div class="container-fluid">
          <h2 class="mb-4 fw-bold text-primary">Dashboard</h2>

          <!-- KPI Cards -->
          <div class="row g-4 mb-4">
              <div class="col-md-3">
                  <div class="card bg-primary text-white shadow-sm h-100">
                      <div class="card-body">
                          <div class="d-flex justify-content-between align-items-center">
                              <div>
                                  <h6 class="text-uppercase mb-0">Total Payments (All Time)</h6>
                                  <h3 class="fw-bold" id="total-payments-all-time">...</h3>
                              </div>
                              <i class="bi bi-wallet2 fs-1 opacity-50"></i>
                          </div>
                      </div>
                  </div>
              </div>
              <div class="col-md-3">
                  <div class="card bg-success text-white shadow-sm h-100">
                      <div class="card-body">
                          <div class="d-flex justify-content-between align-items-center">
                              <div>
                                  <h6 class="text-uppercase mb-0">Total Payments (This Year)</h6>
                                  <h3 class="fw-bold" id="total-payments-this-year">...</h3>
                              </div>
                              <i class="bi bi-cash-stack fs-1 opacity-50"></i>
                          </div>
                      </div>
                  </div>
              </div>
              <div class="col-md-3">
                  <div class="card bg-info text-white shadow-sm h-100">
                      <div class="card-body">
                          <div class="d-flex justify-content-between align-items-center">
                              <div>
                                  <h6 class="text-uppercase mb-0">Total Payments (This Month)</h6>
                                  <h3 class="fw-bold" id="total-payments-this-month">...</h3>
                              </div>
                              <i class="bi bi-calendar-check fs-1 opacity-50"></i>
                          </div>
                      </div>
                  </div>
              </div>
              <div class="col-md-3">
                  <div class="card bg-warning text-dark shadow-sm h-100">
                      <div class="card-body">
                          <div class="d-flex justify-content-between align-items-center">
                              <div>
                                  <h6 class="text-uppercase mb-0">Payments (Today)</h6>
                                  <h3 class="fw-bold" id="payments-today">...</h3>
                              </div>
                              <i class="bi bi-calendar-day fs-1 opacity-50"></i>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Charts -->
          <div class="row g-4 mb-4">
              <div class="col-lg-6">
                  <div class="card shadow-sm h-100">
                      <div class="card-body">
                          <h5 class="card-title fw-bold">Monthly Collection</h5>
                          <div style="height: 300px;"><canvas id="monthly-payments-chart"></canvas></div>
                      </div>
                  </div>
              </div>
              <div class="col-lg-6">
                  <div class="card shadow-sm h-100">
                      <div class="card-body">
                          <h5 class="card-title fw-bold">Daily Collection</h5>
                          <div style="height: 300px;"><canvas id="daily-payments-chart"></canvas></div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Recent Payments Table -->
          <div class="card shadow-sm mb-4">
              <div class="card-header bg-white fw-bold">
                  Recent Payments
              </div>
              <div class="card-body">
                  <div class="table-responsive">
                      <table class="table table-hover mb-0">
                          <thead>
                              <tr>
                                  <th>OR Number</th>
                                  <th>Payor</th>
                                  <th>Date</th>
                                  <th>Amount</th>
                              </tr>
                          </thead>
                          <tbody id="recent-payments-table">
                              <!-- Data will be loaded here -->
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      </div>
    `;

    fetchDashboardData(); // Populate the dashboard after rendering its structure
};


async function fetchDashboardData() {
    try {
        const response = await fetch('/api/payments/dashboard-summary');
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        
        updateKPIs(data.kpis);
        renderMonthlyPaymentsChart(data.monthlyPayments);
        renderDailyPaymentsChart(data.dailyPayments);
        populateRecentPaymentsTable(data.recentPayments);

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

function updateKPIs(kpis) {
    document.getElementById('total-payments-all-time').textContent = formatCurrency(kpis.totalAllTime);
    document.getElementById('total-payments-this-year').textContent = formatCurrency(kpis.totalThisYear);
    document.getElementById('total-payments-this-month').textContent = formatCurrency(kpis.totalThisMonth);
    document.getElementById('payments-today').textContent = formatCurrency(kpis.totalToday);
}

function renderMonthlyPaymentsChart(monthlyData) {
    const ctx = document.getElementById('monthly-payments-chart').getContext('2d');
    
    // Destroy existing chart instance if it exists to prevent rendering issues
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    const labels = monthlyData.map(item => item._id);
    const data = monthlyData.map(item => item.total);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Payments',
                data: data,
                backgroundColor: 'rgba(79, 204, 204, 0.2)',
                borderColor: 'rgb(207, 80, 233)',
                borderWidth: 1,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderDailyPaymentsChart(dailyData) {
   const ctx = document.getElementById('daily-payments-chart').getContext('2d');
    
    // Destroy existing chart instance if it exists to prevent rendering issues
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    const labels = dailyData.map(item => item._id);
    const data = dailyData.map(item => item.total);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Payments',
                data: data,
                backgroundColor: 'rgba(102, 226, 226, 0.2)',
                borderColor: 'rgb(207, 80, 233)',
                borderWidth: 1,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function populateRecentPaymentsTable(recentPayments) {
    const tbody = document.getElementById('recent-payments-table');
    tbody.innerHTML = ''; 

    recentPayments.forEach(payment => {
        const row = `<tr>
            <td>${payment.orNumber}</td>
            <td>${payment.payor}</td>
            <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
            <td>${formatCurrency(payment.totalAmount)}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}


function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
}
