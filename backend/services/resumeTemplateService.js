const LOGO_URL = process.env.RESUME_LOGO_URL || 'http://localhost:8080/logo.png';

class ResumeTemplateService {
  constructor() {
    this.templates = {
      modern: {
        id: 'modern',
        name: 'Modern ATS',
        description: 'Polished single-column resume with crisp blue accents',
        atsScore: 98,
        category: 'Professional',
        bestFor: 'Tech, business, and general corporate roles',
        accent: '#2563eb',
        rule: '#bfdbfe',
        muted: '#475569',
        logoHeight: 26
      },
      classic: {
        id: 'classic',
        name: 'Classic ATS',
        description: 'Traditional black-and-white format for formal industries',
        atsScore: 100,
        category: 'Traditional',
        bestFor: 'Finance, law, consulting, and enterprise roles',
        accent: '#111827',
        rule: '#d1d5db',
        muted: '#374151',
        logoHeight: 24
      },
      minimal: {
        id: 'minimal',
        name: 'Minimal ATS',
        description: 'Maximum readability with minimal visual styling',
        atsScore: 100,
        category: 'Minimal',
        bestFor: 'Any industry and maximum ATS compatibility',
        accent: '#000000',
        rule: '#e5e7eb',
        muted: '#4b5563',
        logoHeight: 22
      },
      creative: {
        id: 'creative',
        name: 'Creative ATS',
        description: 'ATS-safe structure with a subtle creative accent',
        atsScore: 96,
        category: 'Creative',
        bestFor: 'Design, marketing, and creative operations roles',
        accent: '#7c3aed',
        rule: '#ddd6fe',
        muted: '#4b5563',
        logoHeight: 26
      },
      executive: {
        id: 'executive',
        name: 'Executive ATS',
        description: 'Polished leadership resume with navy accents',
        atsScore: 98,
        category: 'Executive',
        bestFor: 'Senior management, director, VP, and C-level roles',
        accent: '#1e3a8a',
        rule: '#c7d2fe',
        muted: '#334155',
        logoHeight: 26
      },
      tech: {
        id: 'tech',
        name: 'Tech ATS',
        description: 'Readable technical resume with skills and projects emphasis',
        atsScore: 98,
        category: 'Technical',
        bestFor: 'Software engineering, IT, data, and cloud roles',
        accent: '#047857',
        rule: '#a7f3d0',
        muted: '#3f4f46',
        logoHeight: 26
      }
    };
  }

  getAllTemplates() {
    return Object.values(this.templates).map(({ accent, ...template }) => template);
  }

  getTemplate(templateId) {
    return this.templates[templateId] || this.templates.modern;
  }

  generateHTML(resumeData, templateId = 'modern') {
    const template = this.getTemplate(templateId);
    const data = this.normalizeResumeData(resumeData);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escape(data.personalInfo.fullName || 'Resume')} - Resume</title>
  <style>${this.getStyles(template)}</style>
</head>
<body>
  <main class="resume">
    ${this.renderBrand()}
    ${this.renderHeader(data.personalInfo)}
    ${this.renderSummary(data.summary)}
    ${this.renderSkills(data.skills)}
    ${this.renderExperience(data.experience)}
    ${this.renderProjects(data.projects)}
    ${this.renderEducation(data.education)}
    ${this.renderCertifications(data.certifications)}
    ${this.renderFooter()}
  </main>
</body>
</html>`;

    return this.stripDuplicateBranding(html);
  }

  getStyles(template) {
    return `
      @page { size: A4; margin: 0.5in; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #ffffff;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10.25pt;
        line-height: 1.42;
      }
      .resume {
        max-width: 7.5in;
        min-height: 10in;
        margin: 0 auto;
        padding: 0.46in 0.5in 0.42in;
        background: #ffffff;
        position: relative;
      }
      .brand {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        min-height: ${template.logoHeight}px;
        margin-bottom: 9px;
      }
      .brand img {
        height: ${template.logoHeight}px;
        width: auto;
        object-fit: contain;
      }
      .header {
        text-align: center;
        border-bottom: 1.5px solid ${template.accent};
        padding-bottom: 11px;
        margin-bottom: 15px;
      }
      h1 {
        margin: 0 0 6px;
        color: #111827;
        font-size: 21pt;
        line-height: 1.15;
        font-weight: 700;
        letter-spacing: 0;
      }
      .contact {
        display: block;
        color: ${template.muted};
        font-size: 9.5pt;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }
      section {
        margin: 0 0 14px;
        page-break-inside: avoid;
      }
      h2 {
        margin: 0 0 7px;
        padding-bottom: 3px;
        border-bottom: 1px solid ${template.rule};
        color: ${template.accent};
        font-size: 11.25pt;
        line-height: 1.2;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0;
      }
      .entry {
        margin-bottom: 11px;
        page-break-inside: avoid;
      }
      .entry-head {
        display: block;
        margin-bottom: 3px;
      }
      .entry-title {
        font-weight: 700;
        color: #111827;
        font-size: 10.75pt;
      }
      .entry-meta {
        color: ${template.muted};
        font-size: 9.5pt;
        margin-top: 1px;
      }
      p {
        margin: 0 0 5px;
      }
      ul {
        margin: 4px 0 0 17px;
        padding: 0;
      }
      li {
        margin: 0 0 3px;
        padding-left: 2px;
      }
      .skills-line {
        margin-bottom: 4px;
      }
      strong {
        color: #111827;
      }
      .footer {
        display: flex;
        justify-content: center;
        margin-top: 18px;
        padding-top: 8px;
        border-top: 1px solid ${template.rule};
      }
      .footer img {
        height: 18px;
        width: auto;
        object-fit: contain;
      }
      @media print {
        body { margin: 0; }
        .resume {
          max-width: none;
          min-height: auto;
          margin: 0;
          padding: 0;
        }
      }
    `;
  }

  renderBrand() {
    return `<div class="brand"><img src="${LOGO_URL}" alt="Jankoti"></div>`;
  }

  renderHeader(personalInfo) {
    const contacts = [
      personalInfo.email,
      personalInfo.phone,
      personalInfo.location,
      personalInfo.linkedin,
      personalInfo.github,
      personalInfo.website
    ].filter(Boolean);

    return `<header class="header">
      <h1>${this.escape(personalInfo.fullName || 'Your Name')}</h1>
      ${contacts.length ? `<span class="contact">${contacts.map(item => this.escape(item)).join(' | ')}</span>` : ''}
    </header>`;
  }

  renderSummary(summary) {
    if (!summary) return '';
    return `<section><h2>Professional Summary</h2><p>${this.escape(summary)}</p></section>`;
  }

  renderSkills(skills) {
    const technical = this.skillNames(skills.technical);
    const soft = this.skillNames(skills.soft);
    if (!technical.length && !soft.length) return '';

    return `<section>
      <h2>Skills</h2>
      ${technical.length ? `<p class="skills-line"><strong>Technical:</strong> ${this.escape(technical.join(', '))}</p>` : ''}
      ${soft.length ? `<p class="skills-line"><strong>Professional:</strong> ${this.escape(soft.join(', '))}</p>` : ''}
    </section>`;
  }

  renderExperience(experience) {
    if (!experience.length) return '';

    return `<section>
      <h2>Professional Experience</h2>
      ${experience.map(exp => {
        const title = exp.jobTitle || exp.title || 'Job Title';
        const company = exp.company || 'Company';
        const dates = this.dateRange(exp.startDate, exp.endDate, exp.isCurrentJob);
        const meta = [company, dates, exp.location].filter(Boolean).join(' | ');

        return `<div class="entry">
          <div class="entry-head">
            <div class="entry-title">${this.escape(title)}</div>
            ${meta ? `<div class="entry-meta">${this.escape(meta)}</div>` : ''}
          </div>
          ${exp.description ? `<p>${this.escape(exp.description)}</p>` : ''}
          ${this.renderList(exp.achievements)}
        </div>`;
      }).join('')}
    </section>`;
  }

  renderProjects(projects) {
    if (!projects.length) return '';

    return `<section>
      <h2>Projects</h2>
      ${projects.map(project => {
        const title = project.name || project.title || 'Project';
        const dates = this.dateRange(project.startDate, project.endDate, false);
        return `<div class="entry">
          <div class="entry-head">
            <div class="entry-title">${this.escape(title)}</div>
            ${dates ? `<div class="entry-meta">${this.escape(dates)}</div>` : ''}
          </div>
          ${project.technologies?.length ? `<p><strong>Technologies:</strong> ${this.escape(this.skillNames(project.technologies).join(', '))}</p>` : ''}
          ${project.description ? `<p>${this.escape(project.description)}</p>` : ''}
          ${this.renderList(project.highlights)}
        </div>`;
      }).join('')}
    </section>`;
  }

  renderEducation(education) {
    if (!education.length) return '';

    return `<section>
      <h2>Education</h2>
      ${education.map(edu => {
        const dates = this.dateRange(edu.startDate, edu.endDate, edu.isCurrentlyStudying);
        const meta = [edu.institution, dates, edu.location].filter(Boolean).join(' | ');
        return `<div class="entry">
          <div class="entry-head">
            <div class="entry-title">${this.escape(edu.degree || 'Degree')}</div>
            ${meta ? `<div class="entry-meta">${this.escape(meta)}</div>` : ''}
          </div>
          ${edu.gpa ? `<p><strong>GPA:</strong> ${this.escape(edu.gpa)}</p>` : ''}
          ${edu.description ? `<p>${this.escape(edu.description)}</p>` : ''}
        </div>`;
      }).join('')}
    </section>`;
  }

  renderCertifications(certifications) {
    if (!certifications.length) return '';

    return `<section>
      <h2>Certifications</h2>
      ${certifications.map(cert => {
        const meta = [
          cert.issuer,
          cert.issueDate ? `Issued ${this.formatDate(cert.issueDate)}` : '',
          cert.neverExpires ? 'Never expires' : cert.expiryDate ? `Expires ${this.formatDate(cert.expiryDate)}` : ''
        ].filter(Boolean).join(' | ');
        return `<div class="entry">
          <div class="entry-title">${this.escape(cert.name || 'Certification')}</div>
          ${meta ? `<div class="entry-meta">${this.escape(meta)}</div>` : ''}
          ${cert.credentialId ? `<p><strong>Credential ID:</strong> ${this.escape(cert.credentialId)}</p>` : ''}
        </div>`;
      }).join('')}
    </section>`;
  }

  renderFooter() {
    return `<div class="footer"><img src="${LOGO_URL}" alt="Jankoti"></div>`;
  }

  renderList(items = []) {
    const cleanItems = items.filter(item => String(item || '').trim());
    if (!cleanItems.length) return '';
    return `<ul>${cleanItems.map(item => `<li>${this.escape(item)}</li>`).join('')}</ul>`;
  }

  normalizeResumeData(resumeData = {}) {
    return {
      personalInfo: resumeData.personalInfo || {},
      summary: resumeData.summary || '',
      skills: resumeData.skills || {},
      experience: Array.isArray(resumeData.experience) ? resumeData.experience : [],
      education: Array.isArray(resumeData.education) ? resumeData.education : [],
      projects: Array.isArray(resumeData.projects) ? resumeData.projects : [],
      certifications: Array.isArray(resumeData.certifications) ? resumeData.certifications : []
    };
  }

  skillNames(skills = []) {
    return skills
      .map(skill => (typeof skill === 'object' ? skill.name : skill))
      .filter(skill => String(skill || '').trim());
  }

  dateRange(startDate, endDate, isCurrent) {
    const start = this.formatDate(startDate);
    const end = isCurrent ? 'Present' : this.formatDate(endDate);
    if (start && end) return `${start} - ${end}`;
    return start || end || '';
  }

  formatDate(date) {
    if (!date) return '';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return String(date);
    return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  escape(value) {
    return String(value || '').replace(/[<>&"']/g, match => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;'
    }[match]));
  }

  stripDuplicateBranding(html) {
    return String(html || '')
      .replace(/<span>\s*Jankoti\s*<\/span>/gi, '')
      .replace(/Generated by\s*Jankoti AI Interview Platform(?:\s*-\s*ATS Optimized Resume)?/gi, '');
  }
}

module.exports = ResumeTemplateService;
