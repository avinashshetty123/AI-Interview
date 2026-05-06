const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class ResumeParser {
  async extractText(buffer, fileType) {
    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          const pdfData = await pdfParse(buffer);
          return pdfData.text;
        case 'docx':
          const docxData = await mammoth.extractRawText({ buffer });
          return docxData.value;
        case 'txt':
          return buffer.toString('utf-8');
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  extractKeywords(text) {
    const sections = this.extractSections(text);
    const skills = this.extractSkills(sections);
    const projects = this.extractProjects(sections);
    const experience = this.extractExperience(sections);
    const education = this.extractEducation(sections);

    return {
      skills,
      projects,
      experience,
      education,
      sections,
      atsQuality: this.assessATSQuality(sections, skills, projects, experience, education)
    };
  }

  extractSections(text) {
    const sections = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentSection = 'header';
    sections[currentSection] = [];

    const sectionPatterns = {
      summary: /^(summary|professional summary|profile|objective)\s*:?/i,
      education: /^(education|academic background|qualifications)\s*:?/i,
      experience: /^(experience|work experience|employment|professional experience)\s*:?/i,
      projects: /^(projects|personal projects|academic projects|key projects)\s*:?/i,
      skills: /^(skills|technical skills|core competencies|expertise|technologies)\s*:?/i,
      certifications: /^(certifications|courses|training)\s*:?/i
    };

    for (const line of lines) {
      let matched = false;
      for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(line)) {
          currentSection = sectionName;
          if (!sections[currentSection]) sections[currentSection] = [];
          matched = true;
          break;
        }
      }
      if (!matched) {
        sections[currentSection].push(line);
      }
    }

    return sections;
  }

  extractSkills(sections) {
    const skills = new Set();
    const skillSections = ['skills', 'technologies', 'experience', 'projects', 'header'];
    
    // Enhanced skill patterns for better extraction
    const skillPatterns = {
      // Programming Languages
      'javascript': /\b(javascript|js|node\.?js|react|vue|angular|express)\b/gi,
      'python': /\b(python|django|flask|pandas|numpy|fastapi)\b/gi,
      'java': /\b(java|spring|hibernate|maven|gradle)\b/gi,
      'react': /\b(react|jsx|redux|next\.?js|gatsby)\b/gi,
      'node.js': /\b(node\.?js|express|npm|yarn)\b/gi,
      'css': /\b(css|sass|scss|less|bootstrap|tailwind)\b/gi,
      'html': /\b(html|html5|dom|semantic)\b/gi,
      'database': /\b(sql|mysql|postgresql|mongodb|redis|database)\b/gi,
      'aws': /\b(aws|amazon|ec2|s3|lambda|cloud|devops)\b/gi,
      'docker': /\b(docker|kubernetes|container|deployment)\b/gi,
      'git': /\b(git|github|gitlab|version control)\b/gi,
      'api': /\b(api|rest|graphql|microservices)\b/gi,
      'testing': /\b(testing|jest|mocha|cypress|unit test)\b/gi,
      'algorithms': /\b(algorithms|data structures|leetcode|coding)\b/gi,
      'machine-learning': /\b(machine learning|ml|ai|tensorflow|pytorch)\b/gi,
      'mobile': /\b(android|ios|react native|flutter|mobile)\b/gi,
      'security': /\b(security|authentication|jwt|oauth|encryption)\b/gi
    };
    
    // Extract from all relevant sections
    for (const section of skillSections) {
      if (sections[section]) {
        const sectionText = sections[section].join(' ');
        
        // Use pattern matching for better skill extraction
        Object.entries(skillPatterns).forEach(([skill, pattern]) => {
          if (pattern.test(sectionText)) {
            skills.add(skill);
          }
        });
        
        // Also extract explicit skills from skills section
        if (section === 'skills') {
          for (const line of sections[section]) {
            const cleanLine = line.replace(/^[A-Za-z/&\s]+:?\s*/, '').trim();
            const candidates = cleanLine.split(/[,•\-\*\/]/).map(s => s.trim()).filter(s => s);
            
            for (const skill of candidates) {
              if (this.isValidSkill(skill)) {
                const normalizedSkill = this.normalizeSkill(skill);
                if (normalizedSkill) {
                  skills.add(normalizedSkill);
                }
              }
            }
          }
        }
      }
    }
    
    return Array.from(skills);
  }

  extractProjects(sections) {
    if (!sections.projects) return [];

    // Join all lines, replacing lone "-" separators with a bullet marker
    // then re-split cleanly
    const rawLines = sections.projects;
    const merged = [];

    for (let i = 0; i < rawLines.length; i++) {
      const trimmed = rawLines[i].trim();
      if (!trimmed) continue;

      // Lone dash/bullet = the NEXT line is bullet content
      if (/^[-\u2022\*]$/.test(trimmed)) {
        // peek at next line and prepend bullet marker
        if (i + 1 < rawLines.length) {
          merged.push('\u2022 ' + rawLines[i + 1].trim());
          i++; // skip next line, already consumed
        }
        continue;
      }

      // Line starting with "- text" or "• text"
      if (/^[-\u2022\*]\s+/.test(trimmed)) {
        merged.push('\u2022 ' + trimmed.replace(/^[-\u2022\*]\s+/, ''));
        continue;
      }

      merged.push(trimmed);
    }

    // Now parse merged lines: title lines contain "|", bullet lines start with "•"
    const projects = [];
    let current = null;

    for (const line of merged) {
      const isBullet = line.startsWith('\u2022 ');

      if (!isBullet && line.includes('|')) {
        // Project title line: "Name| Subtitle"
        if (current) projects.push(current);
        const pipeIdx = line.indexOf('|');
        current = {
          title: line.substring(0, pipeIdx).trim(),
          description: line.substring(pipeIdx + 1).trim(),
          highlights: []
        };
      } else if (!isBullet && !current) {
        // Plain title with no pipe (fallback)
        current = { title: line, description: '', highlights: [] };
      } else if (isBullet && current) {
        const content = line.replace('\u2022 ', '').trim();
        // If last highlight ends without punctuation, it may be a wrapped continuation
        if (
          current.highlights.length > 0 &&
          !/[.!?]$/.test(current.highlights[current.highlights.length - 1]) &&
          current.highlights[current.highlights.length - 1].split(' ').length < 8
        ) {
          current.highlights[current.highlights.length - 1] += ' ' + content;
        } else {
          current.highlights.push(content);
        }
      } else if (!isBullet && current) {
        // Plain text after a title but before any bullet — append to description
        current.description += (current.description ? ' ' : '') + line;
      }
    }

    if (current) projects.push(current);

    return projects.map(p => ({
      ...p,
      description: p.description || (p.highlights[0] || ''),
    }));
  }

  extractExperience(sections) {
    if (!sections.experience) return [];
    
    const experiences = [];
    const datePattern = /\b(19|20)\d{2}\b/g;
    
    for (const line of sections.experience) {
      const dates = line.match(datePattern);
      if (dates && line.length > 20) {
        const parts = line.split(/\s+at\s+|\s+@\s+|\s*,\s*/);
        experiences.push({
          title: parts[0] || '',
          company: parts[1] || '',
          dates: dates.join(' - '),
          description: line
        });
      }
    }
    
    return experiences;
  }

  extractEducation(sections) {
    if (!sections.education) return [];
    
    const education = [];
    const degreeKeywords = ['bachelor', 'master', 'phd', 'b.s.', 'b.a.', 'm.s.', 'm.a.', 'b.tech', 'm.tech'];
    
    for (const line of sections.education) {
      if (degreeKeywords.some(kw => line.toLowerCase().includes(kw))) {
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        education.push({
          degree: line,
          year: yearMatch ? yearMatch[0] : '',
          description: line
        });
      }
    }
    
    return education;
  }

  isValidSkill(skill) {
    return skill.length >= 2 && skill.length <= 50 && /[a-zA-Z]/.test(skill);
  }

  assessATSQuality(sections, skills, projects, experience, education) {
    let score = 0;
    const suggestions = [];
    
    // Essential sections (30 points)
    const essentialSections = ['summary', 'skills', 'experience', 'education', 'projects'];
    for (const section of essentialSections) {
      if (sections[section] && sections[section].length > 0) {
        score += 6;
      } else {
        suggestions.push(`Add a '${section}' section`);
      }
    }
    
    // Skills count (20 points)
    if (skills.length >= 15) score += 20;
    else if (skills.length >= 10) score += 15;
    else if (skills.length >= 5) score += 10;
    else suggestions.push('List more technical skills (aim for 10+)');
    
    // Projects (20 points)
    if (projects.length > 0) {
      const avgDescLength = projects.reduce((sum, p) => sum + p.description.length, 0) / projects.length;
      if (avgDescLength > 100) score += 20;
      else if (avgDescLength > 50) score += 15;
      else score += 10;
    } else {
      suggestions.push('Include detailed project descriptions');
    }
    
    // Experience (15 points)
    if (experience.length > 0) score += 15;
    else suggestions.push('Add work experience or internships');
    
    // Contact info (15 points)
    const headerText = sections.header ? sections.header.join(' ') : '';
    if (/@/.test(headerText) || /\d{10}/.test(headerText)) score += 15;
    else suggestions.push('Include contact information');
    
    const rating = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Improvement' : 'Poor';
    
    return { score, rating, suggestions: suggestions.slice(0, 5) };
  }

  normalizeSkill(skill) {
    const skillMap = {
      'js': 'javascript',
      'nodejs': 'node.js',
      'reactjs': 'react',
      'html5': 'html',
      'css3': 'css',
      'mysql': 'database',
      'postgresql': 'database',
      'mongodb': 'database',
      'github': 'git',
      'gitlab': 'git',
      'amazon web services': 'aws',
      'machine learning': 'machine-learning',
      'artificial intelligence': 'machine-learning',
      'react native': 'mobile',
      'unit testing': 'testing',
      'data structures': 'algorithms'
    };
    
    const normalized = skill.toLowerCase().trim();
    return skillMap[normalized] || (normalized.length >= 3 ? normalized : null);
  }
}

module.exports = ResumeParser;