const Client = require('../models/Client');
const path = require('path');  // Required for path.join()
const fs = require('fs');      // Required for file reading

exports.getAllClients = async (req, res) => {
  try {
    const { search, name, barangay } = req.query;
    const query = {};

    if (barangay) {
      query.barangay = barangay.toString().padStart(2, '0');
    }

    if (search) {
      const searchTerms = search.split(/\s+/);
      query.$and = searchTerms.map(term => {
        const termRegex = new RegExp(term, 'i');
        return {
          $or: [
            { fullName: termRegex },
            { clientId: termRegex }
          ]
        };
      });
    }

    const clients = await Client.find(query);

    // Read CSS and JS files with error handling
    let css = '';
    let js = '';
    
    try {
      const cssPath = path.join(__dirname, '../public/css/clients.css');
      const jsPath = path.join(__dirname, '../public/js/clients.js');
      
      // Check if files exist before reading
      if (fs.existsSync(cssPath)) {
        css = fs.readFileSync(cssPath, 'utf8');
      } else {
        console.warn('CSS file not found at:', cssPath);
      }
      
      if (fs.existsSync(jsPath)) {
        js = fs.readFileSync(jsPath, 'utf8');
      } else {
        console.warn('JS file not found at:', jsPath);
      }
    } catch (err) {
      console.error('Error reading static files:', err);
      // Continue with empty CSS/JS - the page will still render
    }

    // Generate HTML with modern design
    const htmlOutput = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Client Directory</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
        <style>
          /* Fallback basic styles if CSS fails to load */
          body { font-family: Arial, sans-serif; margin: 20px; }
          .client-card { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; }
          ${css}
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>Client Directory</h1>
            <p>${clients.length} clients found</p>
          </header>
          
          <div class="client-grid">
            ${clients.map(client => `
              <div class="client-card">
                <div class="client-header">
                  <h3 class="client-name">${client.fullName}</h3>
                  <button class="btn btn-view" onclick="openModal('${client.id}')">View</button>
                </div>
                
                <div class="client-field">
                  <span class="field-label">Birth Date:</span>
                  <span class="field-value">${client.birthDate || 'N/A'}</span>
                </div>
                
                <div class="client-field">
                  <span class="field-label">Gender:</span>
                  <span class="field-value">${client.gender === 0 ? 'Unknown' : client.gender === 1? 'Male' : 'Female'}</span>
                </div>
                
                <div class="client-field">
                  <span class="field-label">Category:</span>
                  <span class="field-value">${client.clientCategory}</span>
                </div>
                
                <div class="client-field">
                  <span class="field-label">Contact:</span>
                  <span class="field-value">${client.contactNumber}</span>
                </div>
                
                <div class="client-field">
                  <span class="field-label">Barangay:</span>
                  <span class="field-value">${client.barangay}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Modal Structure -->
        <div id="clientModal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h2 id="modalTitle">Client Details</h2>
              <span class="close-btn" onclick="closeModal()">&times;</span>
            </div>
            <div id="modalContent"></div>
          </div>
        </div>
        
        <script>
          // Basic modal functions as fallback
          function openModal(id) {
            console.log('Viewing client:', id);
            document.getElementById('clientModal').style.display = 'flex';
          }
          function closeModal() {
            document.getElementById('clientModal').style.display = 'none';
          }
          ${js}
        </script>
      </body>
      </html>
    `;

    res.send(htmlOutput);

  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).send(`
      <h1>Server Error</h1>
      <p>We're unable to load the client directory at this time.</p>
      <p>${error.message}</p>
    `);
  }
};