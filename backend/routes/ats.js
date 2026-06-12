const express = require('express');
const router = express.Router();
const atsController = require('../controllers/atsController');

const multer = require('multer');
const path = require('path');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|docx|txt|doc)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, TXT files allowed'));
    }
  },
});

// Test endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'ATS service is healthy' });
});

// Handle OPTIONS preflight
router.options('/evaluate-resume', (req, res) => {
  console.log('[ATS] OPTIONS preflight request');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Public endpoint - no auth required
router.post('/evaluate-resume', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  
  console.log('[ATS] POST /evaluate-resume - Content-Type:', req.headers['content-type']);
  upload.single('resume')(req, res, (err) => {
    if (err) {
      console.error('[ATS] Upload error:', err.message);
      return res.status(400).json({ error: 'File upload failed: ' + err.message });
    }
    console.log('[ATS] File received:', req.file?.originalname, 'Size:', req.file?.size);
    atsController.evaluateResumePublic(req, res);
  });
});

module.exports = router;
