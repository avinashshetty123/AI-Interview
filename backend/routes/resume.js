const express = require('express');
const router = express.Router();
const LOGO_URL = 'http://localhost:8080/logo.png';
const resumeController = require('../controllers/resumeController');
const resumeParserController = require('../controllers/resumeParserController');
const aiOptimizationController = require('../controllers/aiOptimizationController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Apply auth middleware to all routes (optional for some routes)
// router.use(authMiddleware);

// Parse resume for resume builder
router.post('/parse-for-builder', (req, res, next) => {
  console.log('Route /parse-for-builder hit');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  next();
}, upload.single('resume'), resumeParserController.parseResumeForBuilder);

// Test route for debugging
router.get('/parse-test', (req, res) => {
  console.log('Parse test route accessed');
  res.json({
    success: true,
    message: 'Resume parser route is accessible',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
});

// Test POST route
router.post('/parse-test-post', (req, res) => {
  console.log('Parse test POST route accessed');
  res.json({
    success: true,
    message: 'Resume parser POST route is accessible',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
});

// AI Optimization endpoints
router.post('/optimize-text', aiOptimizationController.optimizeResumeText);
router.post('/generate-skills', aiOptimizationController.generateSkills);
router.post('/ai-summary', aiOptimizationController.generateSummary);
router.post('/optimize-bulk', aiOptimizationController.optimizeBulkText);

// Generate AI summary (legacy route)
router.post('/generate-summary', resumeController.generateSummary);

// Save resume
router.post('/save', resumeController.saveResume);

// Get saved resumes for user
router.get('/saved', resumeController.getSavedResumes);

// Generate resume PDF
router.post('/generate', resumeController.generateResume);

// Generate PDF with templates
router.post('/generate-pdf', resumeController.generatePDF);

// Generate editable Word/DOCX resume
router.post('/generate-docx', resumeController.generateDocx);

// Get available templates
router.get('/templates', resumeController.getTemplates);

// Preview resume HTML
router.post('/preview', resumeController.previewResume);

// Get ATS optimization suggestions
router.post('/optimize', resumeController.getATSOptimizations);

// Get resume templates list
router.get('/templates/list', (req, res) => {
  const templates = [
    {
      id: 'modern',
      name: 'Modern Professional',
      description: 'Clean, modern design perfect for tech roles',
      preview: '/templates/modern-preview.png',
      atsScore: 95
    },
    {
      id: 'classic',
      name: 'Classic Business',
      description: 'Traditional format suitable for corporate roles',
      preview: '/templates/classic-preview.png',
      atsScore: 90
    },
    {
      id: 'creative',
      name: 'Creative Design',
      description: 'Eye-catching design for creative professionals',
      preview: '/templates/creative-preview.png',
      atsScore: 85
    },
    {
      id: 'minimal',
      name: 'Minimal Clean',
      description: 'Simple, clean layout focusing on content',
      preview: '/templates/minimal-preview.png',
      atsScore: 92
    }
  ];

  res.json({
    success: true,
    templates
  });
});

// Fallback PDF generation
router.post('/generate-pdf-fallback', async (req, res) => {
  try {
    const { resumeData } = req.body;
    
    if (!resumeData || !resumeData.personalInfo) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resume data provided'
      });
    }

    return resumeController.previewResume(req, res);

    // Generate simple HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${resumeData.personalInfo.fullName} - Resume</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
          .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; border-radius: 10px; }
          .profile-photo { width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 15px; overflow: hidden; border: 4px solid white; }
          .profile-photo img { width: 100%; height: 100%; object-fit: cover; }
          .name { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .contact { margin-bottom: 5px; opacity: 0.9; }
          .jankoti-brand { position: absolute; top: 10px; right: 20px; font-size: 12px; opacity: 0.8; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 18px; font-weight: bold; color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; }
          .item { margin-bottom: 15px; }
          .item-title { font-weight: bold; font-size: 16px; }
          .item-subtitle { color: #7c3aed; font-weight: 600; }
          .item-date { color: #666; font-size: 14px; float: right; }
          .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
          .skill { background: #e0e7ff; color: #7c3aed; padding: 4px 12px; border-radius: 15px; font-size: 14px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          ul { padding-left: 20px; }
          li { margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="jankoti-brand"><img src="${LOGO_URL}" alt="Jankoti" style="height:28px;width:auto" /></div>
        
        <div class="header">
          ${resumeData.personalInfo.profilePicture ? `
            <div class="profile-photo">
              <img src="${resumeData.personalInfo.profilePicture}" alt="Profile" />
            </div>
          ` : ''}
          <div class="name">${resumeData.personalInfo.fullName || 'Your Name'}</div>
          ${resumeData.personalInfo.email ? `<div class="contact">📧 ${resumeData.personalInfo.email}</div>` : ''}
          ${resumeData.personalInfo.phone ? `<div class="contact">📱 ${resumeData.personalInfo.phone}</div>` : ''}
          ${resumeData.personalInfo.location ? `<div class="contact">📍 ${resumeData.personalInfo.location}</div>` : ''}
          ${resumeData.personalInfo.linkedin ? `<div class="contact">💼 LinkedIn</div>` : ''}
        </div>
        
        ${resumeData.summary ? `
          <div class="section">
            <div class="section-title">Professional Summary</div>
            <p>${resumeData.summary}</p>
          </div>
        ` : ''}
        
        ${resumeData.experience?.length ? `
          <div class="section">
            <div class="section-title">Professional Experience</div>
            ${resumeData.experience.map(exp => `
              <div class="item">
                <div class="item-date">${exp.startDate || ''} - ${exp.isCurrentJob ? 'Present' : exp.endDate || ''}</div>
                <div class="item-title">${exp.jobTitle || 'Job Title'}</div>
                <div class="item-subtitle">${exp.company || 'Company'}</div>
                ${exp.description ? `<p>${exp.description}</p>` : ''}
                ${exp.achievements?.filter(a => a.trim()).length ? `
                  <ul>
                    ${exp.achievements.filter(a => a.trim()).map(achievement => `<li>${achievement}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${resumeData.education?.length ? `
          <div class="section">
            <div class="section-title">Education</div>
            ${resumeData.education.map(edu => `
              <div class="item">
                <div class="item-date">${edu.startDate || ''} - ${edu.endDate || ''}</div>
                <div class="item-title">${edu.degree || 'Degree'}</div>
                <div class="item-subtitle">${edu.institution || 'Institution'}</div>
                ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${(resumeData.skills?.technical?.length || resumeData.skills?.soft?.length) ? `
          <div class="section">
            <div class="section-title">Skills</div>
            ${resumeData.skills.technical?.length ? `
              <p><strong>Technical Skills:</strong></p>
              <div class="skills">
                ${resumeData.skills.technical.map(skill => `<span class="skill">${skill.name} (${skill.level})</span>`).join('')}
              </div>
            ` : ''}
            ${resumeData.skills.soft?.length ? `
              <p><strong>Soft Skills:</strong></p>
              <div class="skills">
                ${resumeData.skills.soft.map(skill => `<span class="skill">${skill}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${resumeData.projects?.length ? `
          <div class="section">
            <div class="section-title">Projects</div>
            ${resumeData.projects.map(project => `
              <div class="item">
                <div class="item-date">${project.startDate || ''} - ${project.endDate || ''}</div>
                <div class="item-title">${project.name || 'Project Name'}</div>
                ${project.description ? `<p>${project.description}</p>` : ''}
                ${project.technologies?.length ? `
                  <div class="skills">
                    ${project.technologies.map(tech => `<span class="skill">${tech}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${resumeData.certifications?.length ? `
          <div class="section">
            <div class="section-title">Certifications</div>
            ${resumeData.certifications.map(cert => `
              <div class="item">
                <div class="item-date">Issued: ${cert.issueDate || ''}</div>
                <div class="item-title">${cert.name || 'Certification'}</div>
                <div class="item-subtitle">${cert.issuer || 'Issuer'}</div>
                ${cert.credentialId ? `<p>ID: ${cert.credentialId}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="footer">
          <img src="${LOGO_URL}" alt="Jankoti" style="height:20px;width:auto;display:inline;vertical-align:middle" />
        </div>
      </body>
      </html>
    `;

    // Set headers for HTML response that can be printed as PDF
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(html);
    
  } catch (error) {
    console.error('Error in fallback PDF generation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate resume',
      details: error.message
    });
  }
});

// Dynamic routes MUST be at the end to prevent conflicts
// Get specific resume by ID
router.get('/:id', async (req, res) => {
  try {
    const Resume = require('../models/Resume');
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      resume
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume',
      error: error.message
    });
  }
});

// Update resume
router.put('/:id', async (req, res) => {
  try {
    const Resume = require('../models/Resume');
    const { resumeData, title } = req.body;
    
    const resume = await Resume.findByIdAndUpdate(
      req.params.id,
      {
        resumeData,
        title,
        atsScore: resumeController.calculateATSScore(resumeData),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      message: 'Resume updated successfully',
      resume
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update resume',
      error: error.message
    });
  }
});

// Delete resume
router.delete('/:id', async (req, res) => {
  try {
    const Resume = require('../models/Resume');
    const resume = await Resume.findByIdAndDelete(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume',
      error: error.message
    });
  }
});

module.exports = router;
