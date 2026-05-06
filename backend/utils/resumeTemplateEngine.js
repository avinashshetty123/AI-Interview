const fs = require('fs');
const path = require('path');

class ResumeTemplateEngine {
  constructor() {
    this.templates = {
      modern: new ModernTemplate(),
      classic: new ClassicTemplate(),
      minimal: new MinimalTemplate(),
      ats: new ATSTemplate()
    };
  }

  generateHTML(resumeData, templateId = 'ats') {
    const template = this.templates[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    return template.generateHTML(resumeData);
  }

  generateWord(resumeData, templateId = 'ats') {
    const template = this.templates[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    return template.generateWord(resumeData);
  }

  getAvailableTemplates() {
    return Object.keys(this.templates).map(id => ({
      id,
      name: this.templates[id].name,
      description: this.templates[id].description,
      atsScore: this.templates[id].atsScore,
      formats: this.templates[id].supportedFormats
    }));
  }
}

class BaseTemplate {
  constructor() {
    this.name = '';
    this.description = '';
    this.atsScore = 0;
    this.supportedFormats = ['html', 'pdf'];
  }

  generateHTML(resumeData) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.getFullName(resumeData)} - Resume</title>
        ${this.getStyles()}
      </head>
      <body>
        ${this.getHeader(resumeData)}
        ${this.getContent(resumeData)}
        ${this.getFooter()}
      </body>
      </html>
    `;
  }

  generateWord(resumeData) {
    // Word document structure using docx library
    return {
      sections: [
        {
          properties: {},
          children: [
            ...this.getWordHeader(resumeData),
            ...this.getWordContent(resumeData)
          ]
        }
      ]
    };
  }

  // Helper methods
  getFullName(resumeData) {
    return resumeData.personalInfo?.fullName || 'Resume';
  }

  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  }

  sanitizeText(text) {
    if (!text) return '';
    return text.replace(/[<>&"']/g, (match) => {
      const escapeMap = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escapeMap[match];
    });
  }

  // Abstract methods to be implemented by subclasses
  getStyles() { throw new Error('getStyles must be implemented'); }
  getHeader(resumeData) { throw new Error('getHeader must be implemented'); }
  getContent(resumeData) { throw new Error('getContent must be implemented'); }
  getFooter() { return ''; }
  getWordHeader(resumeData) { throw new Error('getWordHeader must be implemented'); }
  getWordContent(resumeData) { throw new Error('getWordContent must be implemented'); }
}

class ATSTemplate extends BaseTemplate {
  constructor() {
    super();
    this.name = 'ATS Optimized';
    this.description = 'Clean, ATS-friendly format optimized for applicant tracking systems';
    this.atsScore = 98;
    this.supportedFormats = ['html', 'pdf', 'docx'];
  }

  getStyles() {
    return `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          font-size: 11pt; 
          line-height: 1.4; 
          color: #000; 
          max-width: 8.5in; 
          margin: 0 auto; 
          padding: 0.5in; 
          background: white;
        }
        
        .header { 
          text-align: center; 
          margin-bottom: 20px; 
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
        }
        
        .name { 
          font-size: 18pt; 
          font-weight: bold; 
          margin-bottom: 5px; 
          text-transform: uppercase;
        }
        
        .contact-info { 
          font-size: 10pt; 
          margin-bottom: 3px; 
        }
        
        .section { 
          margin-bottom: 15px; 
        }
        
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          text-transform: uppercase; 
          border-bottom: 1px solid #000; 
          margin-bottom: 8px; 
          padding-bottom: 2px;
        }
        
        .job-entry, .edu-entry, .project-entry { 
          margin-bottom: 10px; 
        }
        
        .job-title, .degree-title, .project-title { 
          font-weight: bold; 
          font-size: 11pt; 
        }
        
        .company, .institution { 
          font-weight: bold; 
          margin-bottom: 2px; 
        }
        
        .date-location { 
          font-style: italic; 
          font-size: 10pt; 
          margin-bottom: 3px; 
        }
        
        .description { 
          margin-bottom: 5px; 
        }
        
        .skills-list { 
          line-height: 1.3; 
        }
        
        .skills-category { 
          margin-bottom: 5px; 
        }
        
        .skills-category strong { 
          font-weight: bold; 
        }
        
        ul { 
          margin-left: 15px; 
          margin-bottom: 5px; 
        }
        
        li { 
          margin-bottom: 2px; 
        }
        
        @media print {
          body { margin: 0; padding: 0.5in; }
          .section { page-break-inside: avoid; }
        }
      </style>
    `;
  }

  getHeader(resumeData) {
    const { personalInfo } = resumeData;
    if (!personalInfo) return '';

    return `
      <div class="header">
        <div class="name">${this.sanitizeText(personalInfo.fullName)}</div>
        ${personalInfo.email ? `<div class="contact-info">${this.sanitizeText(personalInfo.email)}</div>` : ''}
        ${personalInfo.phone ? `<div class="contact-info">${this.sanitizeText(personalInfo.phone)}</div>` : ''}
        ${personalInfo.location ? `<div class="contact-info">${this.sanitizeText(personalInfo.location)}</div>` : ''}
        ${personalInfo.linkedin ? `<div class="contact-info">${this.sanitizeText(personalInfo.linkedin)}</div>` : ''}
        ${personalInfo.github ? `<div class="contact-info">${this.sanitizeText(personalInfo.github)}</div>` : ''}
      </div>
    `;
  }

  getContent(resumeData) {
    let content = '';

    // Professional Summary
    if (resumeData.summary) {
      content += `
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <div class="description">${this.sanitizeText(resumeData.summary)}</div>
        </div>
      `;
    }

    // Technical Skills
    if (resumeData.skills) {
      content += this.getSkillsSection(resumeData.skills);
    }

    // Professional Experience
    if (resumeData.experience?.length) {
      content += this.getExperienceSection(resumeData.experience);
    }

    // Education
    if (resumeData.education?.length) {
      content += this.getEducationSection(resumeData.education);
    }

    // Projects
    if (resumeData.projects?.length) {
      content += this.getProjectsSection(resumeData.projects);
    }

    // Certifications
    if (resumeData.certifications?.length) {
      content += this.getCertificationsSection(resumeData.certifications);
    }

    return content;
  }

  getSkillsSection(skills) {
    let skillsHTML = '<div class="section"><div class="section-title">Technical Skills</div><div class="skills-list">';

    if (skills.technical?.length) {
      const techSkills = skills.technical.map(skill => 
        typeof skill === 'object' ? skill.name : skill
      ).join(', ');
      skillsHTML += `<div class="skills-category"><strong>Technical:</strong> ${this.sanitizeText(techSkills)}</div>`;
    }

    if (skills.soft?.length) {
      const softSkills = skills.soft.join(', ');
      skillsHTML += `<div class="skills-category"><strong>Soft Skills:</strong> ${this.sanitizeText(softSkills)}</div>`;
    }

    skillsHTML += '</div></div>';
    return skillsHTML;
  }

  getExperienceSection(experience) {
    let expHTML = '<div class="section"><div class="section-title">Professional Experience</div>';

    experience.forEach(exp => {
      const startDate = this.formatDate(exp.startDate);
      const endDate = exp.isCurrentJob ? 'Present' : this.formatDate(exp.endDate);
      
      expHTML += `
        <div class="job-entry">
          <div class="job-title">${this.sanitizeText(exp.jobTitle)}</div>
          <div class="company">${this.sanitizeText(exp.company)}</div>
          <div class="date-location">${startDate} - ${endDate}${exp.location ? ` | ${this.sanitizeText(exp.location)}` : ''}</div>
          ${exp.description ? `<div class="description">${this.sanitizeText(exp.description)}</div>` : ''}
          ${exp.achievements?.filter(a => a.trim()).length ? `
            <ul>
              ${exp.achievements.filter(a => a.trim()).map(achievement => 
                `<li>${this.sanitizeText(achievement)}</li>`
              ).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    });

    expHTML += '</div>';
    return expHTML;
  }

  getEducationSection(education) {
    let eduHTML = '<div class="section"><div class="section-title">Education</div>';

    education.forEach(edu => {
      const startDate = this.formatDate(edu.startDate);
      const endDate = edu.isCurrentlyStudying ? 'Present' : this.formatDate(edu.endDate);
      
      eduHTML += `
        <div class="edu-entry">
          <div class="degree-title">${this.sanitizeText(edu.degree)}</div>
          <div class="institution">${this.sanitizeText(edu.institution)}</div>
          <div class="date-location">${startDate} - ${endDate}${edu.location ? ` | ${this.sanitizeText(edu.location)}` : ''}</div>
          ${edu.gpa ? `<div class="description">GPA: ${this.sanitizeText(edu.gpa)}</div>` : ''}
          ${edu.description ? `<div class="description">${this.sanitizeText(edu.description)}</div>` : ''}
        </div>
      `;
    });

    eduHTML += '</div>';
    return eduHTML;
  }

  getProjectsSection(projects) {
    let projHTML = '<div class="section"><div class="section-title">Projects</div>';

    projects.forEach(project => {
      const startDate = this.formatDate(project.startDate);
      const endDate = this.formatDate(project.endDate);
      
      projHTML += `
        <div class="project-entry">
          <div class="project-title">${this.sanitizeText(project.name)}</div>
          ${startDate || endDate ? `<div class="date-location">${startDate} - ${endDate}</div>` : ''}
          ${project.description ? `<div class="description">${this.sanitizeText(project.description)}</div>` : ''}
          ${project.technologies?.length ? `
            <div class="description"><strong>Technologies:</strong> ${project.technologies.join(', ')}</div>
          ` : ''}
          ${project.highlights?.filter(h => h.trim()).length ? `
            <ul>
              ${project.highlights.filter(h => h.trim()).map(highlight => 
                `<li>${this.sanitizeText(highlight)}</li>`
              ).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    });

    projHTML += '</div>';
    return projHTML;
  }

  getCertificationsSection(certifications) {
    let certHTML = '<div class="section"><div class="section-title">Certifications</div>';

    certifications.forEach(cert => {
      certHTML += `
        <div class="job-entry">
          <div class="job-title">${this.sanitizeText(cert.name)}</div>
          <div class="company">${this.sanitizeText(cert.issuer)}</div>
          ${cert.issueDate ? `<div class="date-location">Issued: ${this.formatDate(cert.issueDate)}</div>` : ''}
          ${cert.credentialId ? `<div class="description">Credential ID: ${this.sanitizeText(cert.credentialId)}</div>` : ''}
        </div>
      `;
    });

    certHTML += '</div>';
    return certHTML;
  }

  getWordHeader(resumeData) {
    // Word document header structure
    const { personalInfo } = resumeData;
    if (!personalInfo) return [];

    return [
      {
        type: 'paragraph',
        alignment: 'center',
        children: [
          { type: 'text', text: personalInfo.fullName, bold: true, size: 24 }
        ]
      },
      {
        type: 'paragraph',
        alignment: 'center',
        children: [
          { type: 'text', text: personalInfo.email || '', size: 20 }
        ]
      }
      // Add more contact info...
    ];
  }

  getWordContent(resumeData) {
    // Word document content structure
    return [
      // Summary section
      ...(resumeData.summary ? [{
        type: 'paragraph',
        children: [
          { type: 'text', text: 'PROFESSIONAL SUMMARY', bold: true, size: 22 }
        ]
      }, {
        type: 'paragraph',
        children: [
          { type: 'text', text: resumeData.summary, size: 20 }
        ]
      }] : [])
      // Add more sections...
    ];
  }
}

class ModernTemplate extends BaseTemplate {
  constructor() {
    super();
    this.name = 'Modern Professional';
    this.description = 'Contemporary design with subtle colors and modern typography';
    this.atsScore = 85;
  }

  getStyles() {
    return `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          font-size: 11pt; 
          line-height: 1.5; 
          color: #333; 
          max-width: 8.5in; 
          margin: 0 auto; 
          padding: 0.5in; 
          background: white;
        }
        
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          margin-bottom: 30px;
          border-radius: 8px;
        }
        
        .name { 
          font-size: 24pt; 
          font-weight: 300; 
          margin-bottom: 10px; 
          letter-spacing: 1px;
        }
        
        .contact-info { 
          font-size: 10pt; 
          margin-bottom: 5px; 
          opacity: 0.9;
        }
        
        .section { 
          margin-bottom: 25px; 
        }
        
        .section-title { 
          font-size: 14pt; 
          font-weight: 600; 
          color: #667eea; 
          border-bottom: 2px solid #667eea; 
          margin-bottom: 15px; 
          padding-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .job-entry, .edu-entry, .project-entry { 
          margin-bottom: 15px; 
          padding: 15px;
          border-left: 3px solid #f0f0f0;
          background: #fafafa;
        }
        
        .job-title, .degree-title, .project-title { 
          font-weight: 600; 
          font-size: 12pt; 
          color: #333;
          margin-bottom: 5px;
        }
        
        .company, .institution { 
          font-weight: 500; 
          color: #667eea;
          margin-bottom: 5px; 
        }
        
        .date-location { 
          font-size: 10pt; 
          color: #666;
          margin-bottom: 8px; 
        }
        
        .description { 
          margin-bottom: 8px; 
          line-height: 1.4;
        }
        
        .skills-list { 
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .skill-tag { 
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 9pt;
          font-weight: 500;
        }
        
        ul { 
          margin-left: 20px; 
          margin-bottom: 8px; 
        }
        
        li { 
          margin-bottom: 3px; 
        }
        
        @media print {
          body { margin: 0; padding: 0.5in; }
          .header { background: #667eea !important; }
        }
      </style>
    `;
  }

  // Implement other methods similar to ATSTemplate but with modern styling...
  getHeader(resumeData) {
    // Similar to ATS but with modern styling
    return super.getHeader(resumeData);
  }

  getContent(resumeData) {
    // Similar to ATS but with modern styling
    return super.getContent(resumeData);
  }

  getWordHeader(resumeData) {
    return [];
  }

  getWordContent(resumeData) {
    return [];
  }
}

class ClassicTemplate extends BaseTemplate {
  constructor() {
    super();
    this.name = 'Classic Business';
    this.description = 'Traditional corporate format with serif fonts and formal layout';
    this.atsScore = 92;
  }

  getStyles() {
    return `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Times New Roman', serif; 
          font-size: 11pt; 
          line-height: 1.4; 
          color: #000; 
          max-width: 8.5in; 
          margin: 0 auto; 
          padding: 0.75in; 
          background: white;
        }
        
        .header { 
          text-align: center; 
          margin-bottom: 25px; 
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
        }
        
        .name { 
          font-size: 20pt; 
          font-weight: bold; 
          margin-bottom: 8px; 
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .contact-info { 
          font-size: 10pt; 
          margin-bottom: 3px; 
        }
        
        .section { 
          margin-bottom: 20px; 
        }
        
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          text-transform: uppercase; 
          border-bottom: 1px solid #000; 
          margin-bottom: 10px; 
          padding-bottom: 3px;
          letter-spacing: 1px;
        }
        
        .job-entry, .edu-entry, .project-entry { 
          margin-bottom: 12px; 
        }
        
        .job-title, .degree-title, .project-title { 
          font-weight: bold; 
          font-size: 11pt; 
          text-decoration: underline;
        }
        
        .company, .institution { 
          font-weight: bold; 
          font-style: italic;
          margin-bottom: 3px; 
        }
        
        .date-location { 
          font-size: 10pt; 
          margin-bottom: 5px; 
        }
        
        .description { 
          margin-bottom: 5px; 
          text-align: justify;
        }
        
        ul { 
          margin-left: 20px; 
          margin-bottom: 5px; 
        }
        
        li { 
          margin-bottom: 2px; 
        }
        
        @media print {
          body { margin: 0; padding: 0.75in; }
        }
      </style>
    `;
  }

  // Implement methods with classic styling...
  getHeader(resumeData) {
    return super.getHeader(resumeData);
  }

  getContent(resumeData) {
    return super.getContent(resumeData);
  }

  getWordHeader(resumeData) {
    return [];
  }

  getWordContent(resumeData) {
    return [];
  }
}

class MinimalTemplate extends BaseTemplate {
  constructor() {
    super();
    this.name = 'Minimal Clean';
    this.description = 'Ultra-clean design focusing purely on content with minimal styling';
    this.atsScore = 95;
  }

  getStyles() {
    return `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          font-size: 11pt; 
          line-height: 1.5; 
          color: #000; 
          max-width: 8.5in; 
          margin: 0 auto; 
          padding: 0.5in; 
          background: white;
        }
        
        .header { 
          margin-bottom: 30px; 
        }
        
        .name { 
          font-size: 18pt; 
          font-weight: normal; 
          margin-bottom: 10px; 
        }
        
        .contact-info { 
          font-size: 10pt; 
          margin-bottom: 3px; 
        }
        
        .section { 
          margin-bottom: 20px; 
        }
        
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          margin-bottom: 10px; 
        }
        
        .job-entry, .edu-entry, .project-entry { 
          margin-bottom: 10px; 
        }
        
        .job-title, .degree-title, .project-title { 
          font-weight: bold; 
          font-size: 11pt; 
        }
        
        .company, .institution { 
          margin-bottom: 2px; 
        }
        
        .date-location { 
          font-size: 10pt; 
          color: #666;
          margin-bottom: 3px; 
        }
        
        .description { 
          margin-bottom: 5px; 
        }
        
        ul { 
          margin-left: 15px; 
          margin-bottom: 5px; 
        }
        
        li { 
          margin-bottom: 1px; 
        }
        
        @media print {
          body { margin: 0; padding: 0.5in; }
        }
      </style>
    `;
  }

  // Implement methods with minimal styling...
  getHeader(resumeData) {
    return super.getHeader(resumeData);
  }

  getContent(resumeData) {
    return super.getContent(resumeData);
  }

  getWordHeader(resumeData) {
    return [];
  }

  getWordContent(resumeData) {
    return [];
  }
}

module.exports = ResumeTemplateEngine;