require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });
const authController = require('./controllers/authController');
// Import routes
const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const claimsRoutes = require('./routes/claims');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const compareRoutes = require('./routes/compareRoutes');

const app = express();

// Enhanced CORS configuration for frontend support
// Configure allowed origins from env (comma-separated) with sensible localhost fallbacks.
// Set an env var named ALLOWED_ORIGINS or FRONTEND_ORIGINS on Render with your Vercel frontend URL
// e.g. ALLOWED_ORIGINS=https://your-frontend.vercel.app
const allowedFromEnv = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGINS || '';
const allowedOrigins = allowedFromEnv.split(',').map(s => s.trim()).filter(Boolean);
const defaultLocalOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://localhost:5173'
];
const corsOrigins = Array.from(new Set([...defaultLocalOrigins, ...allowedOrigins]));

app.use(cors({
  origin: function(origin, callback) {
    // allow non-browser (curl, Postman) requests when origin is undefined
    if (!origin) return callback(null, true);
    if (corsOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  console.log('⚠️ Server will continue running for testing purposes');
  console.log('💡 Please whitelist your IP in MongoDB Atlas to enable database features');
});

// Route aliases for common frontend patterns
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', itemsRoutes);
app.use('/api', claimsRoutes);
app.use('/api', usersRoutes);
app.use('/api', compareRoutes);
app.use('/admin', adminRoutes); 

// Health check endpoint
app.get('/health', (req, res) => {
  const startTime = Date.now();
  const response = { 
    status: 'OK', 
    message: 'FindIT Backend is running',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8080,
    responseTime: `${Date.now() - startTime}ms`
  };
  console.log(`🏥 Health check: ${response.responseTime}`);
  res.json(response);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 FindIT Backend server running on http://localhost:${PORT}`);
  console.log(`📧 Email notifications: ${process.env.EMAIL_USER ? 'Enabled' : 'Disabled'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Missing'}`);
  console.log(`🗄️  Database: ${process.env.MONGODB_URI ? 'Configured' : 'Missing'}`);
  console.log(`🌐 CORS enabled for: ${corsOrigins.join(', ')}`);
});
