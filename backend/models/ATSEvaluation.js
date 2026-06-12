const mongoose = require('mongoose');

const CategoryScore = {
  score: { type: Number, min: 0, default: 0 },
  max: { type: Number, default: 0 },
  evidence: String,
};

const ATSEvaluationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId: String,
  jobRole: { type: String, enum: ['tech', 'non-tech'], default: 'tech' },
  jobTitle: String,
  evaluationDate: { type: Date, default: Date.now },

  scores: {
    open_source: CategoryScore,
    self_projects: CategoryScore,
    production: CategoryScore,
    technical_skills: CategoryScore,
  },
  bonus_points: {
    total: { type: Number, min: 0, max: 20, default: 0 },
    breakdown: String,
  },
  deductions: {
    total: { type: Number, min: 0, default: 0 },
    reasons: String,
  },

  keyStrengths: [String],
  areasForImprovement: [String],
  actionableRecommendations: [String],
  atsKeywordsMissing: [String],
  resumeFormatIssues: [String],

  totalScore: Number,
  maxScore: { type: Number, default: 100 },
  matchPercentage: Number,
});

module.exports = mongoose.model('ATSEvaluation', ATSEvaluationSchema);
