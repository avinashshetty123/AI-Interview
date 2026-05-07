require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  try {
    const { hostname, protocol } = new URL(origin);
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isVercelPreview = protocol === 'https:' && hostname.endsWith('.vercel.app');

    return allowedOrigins.includes(origin) || isLocalhost || isVercelPreview;
  } catch (error) {
    return false;
  }
};

app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.warn(`Blocked by CORS: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition', 'Content-Length']
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve logo as static asset (used in resume templates)
app.get('/logo.png', (req, res) => {
  const logoPath = path.join(__dirname, '../frontend/src/assets/Logo.png')
  res.sendFile(logoPath)
})

const ensureDatabase = async (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database unavailable:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: process.env.NODE_ENV === 'production'
        ? 'Server is not configured correctly. Check MONGODB_URI in Vercel.'
        : error.message
    });
  }
};

const ensureAuthConfig = (req, res, next) => {
  if (!req.path.startsWith('/auth')) {
    return next();
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      error: 'Authentication is not configured',
      message: 'JWT_SECRET is missing on the server.'
    });
  }

  next();
};

// Routes
app.use('/api', ensureDatabase, ensureAuthConfig, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Jankoti AI Interview Platform API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      docs: '/api/*',
      frontend: process.env.FRONTEND_URL || 'http://localhost:5173'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server locally. Vercel imports the Express app as a serverless handler.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Jankoti Node.js Backend running on port ${PORT}`);
    console.log(`MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/jankoti-interview'}`);
    console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
    console.log(`API Documentation: http://localhost:${PORT}/api/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
