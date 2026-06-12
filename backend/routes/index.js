const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Import route modules
const interviewRoutes = require('./interview');
const analysisRoutes = require('./analysis');
const leaderboardRoutes = require('./leaderboard');
const questionBankRoutes = require('./questionBank');
const authRoutes = require('./auth');
const resumeRoutes = require('./resume');
const atsRoutes = require('./ats');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Jankoti Node.js Backend',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Public routes (no auth required)
router.use('/auth', authRoutes);
router.use('/ats', atsRoutes); // ATS has its own public/protected route handling
router.use('/leaderboard', leaderboardRoutes);
router.use('/resume', resumeRoutes);

// Apply auth middleware to all other routes
router.use(authMiddleware);

// Protected routes
router.use('/', interviewRoutes);
router.use('/', analysisRoutes);
router.use('/question-bank', questionBankRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  console.log('404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    success: false, 
    error: 'API route not found',
    requestedRoute: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /api/health',
      'POST /api/upload-resume',
      'POST /api/submit-answer',
      'GET /api/session/:id',
      'GET /api/session/:id/qa',
      'GET /api/sessions/all',
      'POST /api/analyze/:sessionId',
      'GET /api/analysis/:sessionId',
      'DELETE /api/analysis/:sessionId',
      'GET /api/analysis-status/:sessionId',
      'POST /api/resume/save',
      'POST /api/resume/generate',
      'GET /api/resume/saved',
      'POST /api/resume/parse-for-builder',
      'GET /api/resume/parse-test',
      'POST /api/resume/parse-test-post'
    ]
  });
});

module.exports = router;
