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

// Public endpoint - no auth required
router.post('/evaluate-resume', upload.single('resume'), atsController.evaluateResumePublic);

// Evaluate single resume (protected)
router.post('/evaluate', atsController.evaluateResume);

// Get evaluation history
router.get('/history', atsController.getEvaluationHistory);

// Get detailed evaluation
router.get('/evaluation/:evaluationId', atsController.getDetailedEvaluation);

// Compare two evaluations
router.post('/compare', atsController.compareEvaluations);

// Bulk evaluate multiple resumes (not implemented)
// router.post('/bulk-evaluate', atsController.bulkEvaluate);

// Get ATS statistics
router.get('/stats', atsController.getATSStats);

module.exports = router;
