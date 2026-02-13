require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v2: cloudinary } = require('cloudinary');
const cookieParser = require('cookie-parser');
const app = express();
app.set('trust proxy', 1);
const path = require('path');
const fs = require('fs');
// // ================= Cloudinary Configuration =================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// // ================= Middleware ===============================
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// // ================= Routes =================
// // const authRoutes = require('./routes/auth');

 
const userRoutes = require('./routes/users');
const clientsRoutes = require('./routes/clients');
const serviceRequestRoutes = require('./routes/serviceRequests');
const servicesRoutes = require('./routes/services');
const billingRoutes = require('./routes/billingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orRegistryRoutes = require('./routes/orRegistryRoutes');
const miscellaneousFeeRoutes = require('./routes/miscellaneousFeeRoutes');
const feeRoutes = require('./routes/feeRoutes'); // Import fee routes
const authRoutes = require('./routes/auth'); // Import auth routes
const messageRoutes = require('./routes/messageRoutes');
const auth = require('./middleware/authMiddleware');
const roleMiddleware = require('./middleware/roleMiddleware');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

app.use(express.static('public'));
app.use(express.static('assets'));

app.use('/api/auth', authRoutes); // Use auth routes
app.use('/api/users', auth, userRoutes);
app.use('/api/admin/users', auth, roleMiddleware, userRoutes); // Protected user management routes

// Helper function to serve protected HTML files
async function serveProtectedHtml(req, res, next, filePath, requiredOfficeCode = null) {
  const token = req.cookies.token;
  if (!token) {
     console.log("Access attempt without token")
    return res.redirect('/');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach user info to request

    // Role-based authorization
    if (requiredOfficeCode !== null && String(req.user.officeCode) !== String(requiredOfficeCode)) {
      console.log("OfficeCode mismatch")
      return res.redirect('/');
    }

    let html = '';
    if (fs.existsSync(filePath)) {
      html = fs.readFileSync(filePath, 'utf8');
    } else {
      console.warn('HTML file not found at:', filePath);
      return res.status(404).send('Page not found.');
    }

    // Replace placeholder with user's full name
    if (decoded.user && decoded.user.fullName) {
      html = html.replace('<!--USER_FULLNAME_PLACEHOLDER-->', decoded.user.fullName);
    }

    res.send(html);

  } catch (err) {
    // Token is not valid
    console.error('Token verification error:', err);
    return res.redirect('/');
  }
}

// for clients request accross offices
app.use('/water/clients', auth, clientsRoutes);
app.use('/engineering/service-requests', auth, serviceRequestRoutes);
app.use('/engineering/services',  auth, servicesRoutes);


// app.use('/ngo/images', imageRoutes);
// app.use('/ngo/web', web);

// payments and billings API
app.use('/api/billings', auth, billingRoutes);
app.use('/api/payments', auth, paymentRoutes);
app.use('/api/or-registry', auth, orRegistryRoutes);
app.use('/api/misc-fees', auth, miscellaneousFeeRoutes);
app.use('/api/fees', auth, feeRoutes); // Use fee routes
app.use('/api/messages', auth, messageRoutes);
// ================= Static File Serving =================
app.get('/engineering', (req, res) => { // only engineering can access. engineering account will redirect here after successfull login
serveProtectedHtml(req, res, null, path.join(__dirname, './private/html/index-eng.html'), '3');
});

app.get('/treasury', (req, res) => { // only treasury can access. treasury account will redirect here after successfull login
serveProtectedHtml(req, res, null, path.join(__dirname, './private/html/index-treasury.html'), '2');
});

app.get('/', (req, res) => {
let html = ''
   try {
        const htmlFile = path.join(__dirname, './private/html/login.html');
        
        // Check if files exist before reading
        if (fs.existsSync(htmlFile)) {
          html = fs.readFileSync(htmlFile, 'utf8');
        } else {
          console.warn('HTML file not found at:', htmlFile);
        }
         } catch (err) {
      console.error('Error reading static files:', err);
      // Continue with empty CSS/JS - the page will still render
    }
  res.send(html);
});
app.get('/m-reader', (req, res) => {
let html = ''
   try {
        const htmlFile = path.join(__dirname, './private/html/readerEndpoint.html');
        
        // Check if files exist before reading
        if (fs.existsSync(htmlFile)) {
          html = fs.readFileSync(htmlFile, 'utf8');
        } else {
          console.warn('HTML file not found at:', htmlFile);
        }
         } catch (err) {
      console.error('Error reading static files:', err);
      // Continue with empty CSS/JS - the page will still render
    }
  res.send(html);
});

app.get('/treasury/or-registry', (req, res) => {
let html = ''
   try {
        const htmlFile = path.join(__dirname, './private/html/ORRegistry.html');
        
        // Check if files exist before reading
        if (fs.existsSync(htmlFile)) {
          html = fs.readFileSync(htmlFile, 'utf8');
        } else {
          console.warn('HTML file not found at:', htmlFile);
        }
         } catch (err) {
      console.error('Error reading static files:', err);
      // Continue with empty CSS/JS - the page will still render
    }
  res.send(html);
});

app.get('/all-clients', (req, res) => {
let html = ''
   try {
        const htmlFile = path.join(__dirname, './index.html');
        
        // Check if files exist before reading
        if (fs.existsSync(htmlFile)) {
          html = fs.readFileSync(htmlFile, 'utf8');
        } else {
          console.warn('HTML file not found at:', htmlFile);
        }
         } catch (err) {
      console.error('Error reading static files:', err);
      // Continue with empty CSS/JS - the page will still render
    }
  res.send(html);
});

app.get('/billings', (req, res) => { // only billing section can access. billing section account will redirect here after successfull login
serveProtectedHtml(req, res, null, path.join(__dirname, './private/html/billing.html'), '1');
});

// Admin User Management UI
app.get('/admin/users', (req, res, next) => {
    serveProtectedHtml(req, res, next, path.join(__dirname, 'public/admin-users.html'), '0');
});

app.get('/profile', (req, res, next) => {
    serveProtectedHtml(req, res, next, path.join(__dirname, 'public/profile.html'));
});

app.get('/messages', (req, res, next) => {
    serveProtectedHtml(req, res, next, path.join(__dirname, 'public/messages.html'));
});

// Serve registration page
app.get('/eng/client-registration', (req, res) => {
  try {
    const htmlFile = path.join(__dirname, '/private/html/client-registration.html');
    
    if (!fs.existsSync(htmlFile)) {
      return res.status(404).send('Registration form not available');
    }
    
    const html = fs.readFileSync(htmlFile, 'utf8');
    res.header('Content-Type', 'text/html');
    res.send(html);
    
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).send('Internal server error');
  }
});

// app.get('/download-json', (req, res) => {
//   const filePath = path.join(__dirname, 'public', 'data', '2025September19Billing.json');
//   res.download(filePath, 'readingData.json', (err) => {
//     if (err) {
//       console.error("Download error:", err);
//       res.status(500).send("File not found.");
//     }
//   });
// });

const PORT = process.env.PORT;
const User = require('./models/User'); // Import User model
const bcrypt = require('bcryptjs'); // Import bcryptjs

// Function to set up master admin
async function setupMasterAdmin() {
  const adminUsername = process.env.ADMIN_USER_NAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.warn('⚠️  ADMIN_USER_NAME or ADMIN_PASSWORD not set in .env. Master admin not initialized.');
    return;
  }

  try {
    let masterAdmin = await User.findOne({ username: adminUsername });

    if (!masterAdmin) {
      console.log('Master admin not found. Creating a new master admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      masterAdmin = new User({
        username: adminUsername,
        password: hashedPassword,
        fullName: 'Master Administrator', // Default full name
        officeCode: '0', // Special office code for master admin
        officeDescription: 'System Administrator',
        userContact: 'N/A',
        position: 'Master Admin'
      });
      await masterAdmin.save();
      console.log('✅ Master admin user created successfully.');
    } else {
      console.log('Master admin user already exists.');
    }
  } catch (error) {
    console.error('❌ Error setting up master admin:', error);
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // --- One-time maintenance to drop obsolete index ---
    try {
        const collection = mongoose.connection.collection('miscellaneous');
        const indexes = await collection.indexes();
        const indexExists = indexes.some(index => index.name === 'code_1');
        if (indexExists) {
            console.log('Obsolete index "code_1" found in "miscellaneous" collection. Dropping it...');
            await collection.dropIndex('code_1');
            console.log('✅ Successfully dropped "code_1" index.');
        }
    } catch (error) {
        console.error('⚠️  Could not drop obsolete index "code_1". This may cause issues if it still exists.', error);
    }
    // --- End of one-time maintenance ---

    await setupMasterAdmin(); // Call setup function after successful connection

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    // Do not attempt to start the server if DB connection failed
    process.exit(1);
  });

// ================= Error Handling Middleware =================
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const payload = {
    success: false,
    message: err.message || 'Internal server error'
  };

  // Include stack trace in non-production for easier debugging
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
    payload.path = req.originalUrl;
    payload.method = req.method;
  }

  console.error('🔥 Server Error:', { message: err.message, status, path: req.originalUrl });
  res.status(status).json(payload);
});

// Global process-level error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
  // Recommended: attempt graceful shutdown here if needed
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  // In production you might want to restart the process
  process.exit(1);
});