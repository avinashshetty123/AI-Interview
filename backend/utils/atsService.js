const axios = require('axios');
const ResumeParser = require('./resumeParser');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const MODEL = process.env.DEFAULT_MODEL || 'llama-3.3-70b-versatile';
const resumeParser = new ResumeParser();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callGroq = async (systemPrompt, userPrompt, maxTokens = 2048, label = '') => {
  const start = Date.now();
  console.log(`[Groq] START${label ? ` [${label}]` : ''} maxTokens=${maxTokens}`);

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await axios.post(
        `${GROQ_BASE_URL}/chat/completions`,
        {
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: maxTokens,
        },
        {
          headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          timeout: 120000,
        }
      );
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`[Groq] DONE${label ? ` [${label}]` : ''} — ${elapsed}s`);
      return response.data.choices[0].message.content;
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 && attempt < 4) {
        const retryAfter = parseInt(
          err.response?.headers?.['retry-after'] ||
          (err.response?.data?.error?.message?.match(/(\d+)s/))?.[1] ||
          '15'
        );
        const wait = (retryAfter + 2) * 1000;
        console.warn(`[Groq] 429 rate limit. Waiting ${retryAfter + 2}s...`);
        await sleep(wait);
        continue;
      }
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.error(`[Groq] ERROR after ${elapsed}s:`, err.response?.data || err.message);
      throw err;
    }
  }
};

const extractJson = (text) => {
  if (!text) return null;
  text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (text.includes('```json')) {
    const s = text.indexOf('```json') + 7;
    const e = text.indexOf('```', s);
    return text.substring(s, e !== -1 ? e : text.length).trim();
  }
  if (text.includes('```')) {
    const s = text.indexOf('```') + 3;
    const e = text.indexOf('```', s);
    return text.substring(s, e !== -1 ? e : text.length).trim();
  }
  const start = Math.min(
    text.indexOf('{') === -1 ? Infinity : text.indexOf('{'),
    text.indexOf('[') === -1 ? Infinity : text.indexOf('[')
  );
  return start !== Infinity ? text.substring(start) : text;
};

const detectJobRole = async (resumeText) => {
  console.log('[Role] Detecting job role from resume...');
  const prompt = `Analyze this resume and identify the PRIMARY job role/field. Return ONLY one of these: manager, engineer, designer, sales, marketing, hr, operations, finance, consultant, analyst, admin, other.

Resume excerpt:
${resumeText.substring(0, 1500)}

Respond with ONLY the role name, nothing else.`;

  try {
    const result = await callGroq(
      'You identify job roles from resumes. Respond with ONLY the role name.',
      prompt,
      50,
      'role-detect'
    );
    const role = result.toLowerCase().trim();
    const validRoles = ['manager', 'engineer', 'designer', 'sales', 'marketing', 'hr', 'operations', 'finance', 'consultant', 'analyst', 'admin'];
    return validRoles.includes(role) ? role : 'other';
  } catch (e) {
    console.log('[Role] Detection failed, defaulting to other');
    return 'other';
  }
};

const extractBasics = (sections) => {
  const header = (sections.header || []).join(' ');
  const summary = (sections.summary || [])[0] || '';
  const nameMatch = header.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);
  const emailMatch = header.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = header.match(/(\+?\d{1,3}[-.]?\(\d{3}\)[-.]?\d{3}[-.]?\d{4}|\d{10})/);
  
  return {
    name: nameMatch?.[1] || '',
    email: emailMatch?.[1] || '',
    phone: phoneMatch?.[1] || '',
    summary: summary
  };
};

const extractWork = (sections, resumeText) => {
  if (!sections.experience) return [];
  
  const experiences = [];
  const lines = sections.experience.filter(l => l.trim());
  const dateRegex = /\b(19|20)\d{2}\b|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/gi;
  
  for (const line of lines) {
    if (line.length < 15) continue;
    
    const hasDates = dateRegex.test(line);
    if (hasDates || line.includes(' at ') || line.includes('@')) {
      const parts = line.split(/\s+at\s+|\s+@\s+|,/);
      const title = parts[0]?.trim() || '';
      const company = parts[1]?.trim() || '';
      
      if (title.length > 3 && title.length < 100) {
        experiences.push({
          position: title,
          name: company,
          summary: line,
          highlights: []
        });
      }
    }
  }
  
  return experiences;
};

const extractEducation = (sections) => {
  if (!sections.education) return [];
  
  const education = [];
  const degreeKeywords = ['bachelor', 'master', 'phd', 'b.s.', 'b.a.', 'm.s.', 'm.a.', 'b.tech', 'm.tech', 'diploma'];
  
  for (const line of sections.education) {
    if (degreeKeywords.some(kw => line.toLowerCase().includes(kw))) {
      education.push({
        studyType: extractDegreeType(line),
        area: extractMajor(line),
        institution: extractInstitution(line),
        score: extractGPA(line)
      });
    }
  }
  
  return education;
};

const extractDegreeType = (line) => {
  const types = ['PhD', 'Master', 'Bachelor', 'Associate', 'Diploma', 'Certificate'];
  for (const type of types) {
    if (line.toLowerCase().includes(type.toLowerCase())) return type;
  }
  return 'Degree';
};

const extractMajor = (line) => {
  const match = line.match(/(?:in|of|from)\s+([A-Za-z\s&]+)(?:\s+from|\s+at|$)/i);
  return match?.[1]?.trim() || '';
};

const extractInstitution = (line) => {
  const match = line.match(/(?:from|at)\s+([A-Za-z\s.,&]+)$/i);
  return match?.[1]?.trim() || '';
};

const extractGPA = (line) => {
  const match = line.match(/GPA[:\s]+([0-4]\.[0-9]{2})/);
  return match?.[1] || '';
};

const extractSkillsArray = (sections) => {
  const skills = resumeParser.extractSkills(sections);
  return skills.map(skill => ({
    name: skill,
    keywords: [skill]
  }));
};

const extractProjects = (sections) => {
  return resumeParser.extractProjects(sections);
};

const extractAwards = (sections) => {
  if (!sections.certifications) return [];
  const awards = [];
  for (const cert of sections.certifications) {
    if (cert.trim()) {
      awards.push({
        title: cert,
        date: extractYear(cert)
      });
    }
  }
  return awards;
};

const extractYear = (text) => {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match?.[0] || '';
};

const parseResumeToStructured = async (resumeText, onSectionStart, onSectionDone) => {
  const sectionKeys = ['basics', 'work', 'education', 'skills', 'projects', 'awards'];
  sectionKeys.forEach((k) => onSectionStart?.(k));

  console.log('[Parse] Parsing resume structure with enhanced extraction...');
  
  try {
    // Use resumeParser for initial extraction
    const sections = resumeParser.extractSections(resumeText);
    
    const structured = {
      basics: extractBasics(sections),
      work: extractWork(sections, resumeText),
      education: extractEducation(sections),
      skills: extractSkillsArray(sections),
      projects: extractProjects(sections),
      awards: extractAwards(sections)
    };
    
    console.log('[Parse] Extracted:', {
      work: structured.work?.length,
      education: structured.education?.length,
      skills: structured.skills?.length,
      projects: structured.projects?.length
    });
    
    sectionKeys.forEach((k) => onSectionDone?.(k));
    return structured;
  } catch (e) {
    console.error('[Parse] Error:', e.message);
    sectionKeys.forEach((k) => onSectionDone?.(k));
    return {};
  }
};

const buildResumeText = (resumeData) => {
  const lines = [];

  if (resumeData.basics) {
    const b = resumeData.basics;
    lines.push('=== BASIC INFORMATION ===');
    if (b.name) lines.push(`Name: ${b.name}`);
    if (b.email) lines.push(`Email: ${b.email}`);
    if (b.phone) lines.push(`Phone: ${b.phone}`);
    if (b.summary) lines.push(`Summary: ${b.summary}`);
  }

  if (resumeData.work?.length) {
    lines.push('\n=== WORK EXPERIENCE ===');
    resumeData.work.forEach((w, i) => {
      lines.push(`${i + 1}. ${w.position} at ${w.name}`);
      if (w.startDate || w.endDate) lines.push(`   ${w.startDate} - ${w.endDate || 'Present'}`);
      if (w.summary) lines.push(`   ${w.summary}`);
      if (w.highlights?.length) w.highlights.forEach((h) => lines.push(`   • ${h}`));
    });
  }

  if (resumeData.education?.length) {
    lines.push('\n=== EDUCATION ===');
    resumeData.education.forEach((e, i) => {
      lines.push(`${i + 1}. ${e.studyType} in ${e.area} - ${e.institution}`);
      if (e.score) lines.push(`   GPA: ${e.score}`);
    });
  }

  if (resumeData.skills?.length) {
    lines.push('\n=== SKILLS ===');
    resumeData.skills.forEach((s) => {
      if (s.keywords?.length) lines.push(`• ${s.name}: ${s.keywords.join(', ')}`);
      else lines.push(`• ${s.name}`);
    });
  }

  if (resumeData.projects?.length) {
    lines.push('\n=== PROJECTS ===');
    resumeData.projects.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.name}`);
      if (p.description) lines.push(`   ${p.description}`);
    });
  }

  if (resumeData.awards?.length) {
    lines.push('\n=== AWARDS & ACHIEVEMENTS ===');
    resumeData.awards.forEach((a) => {
      lines.push(`• ${a.title}${a.date ? ` (${a.date})` : ''}`);
    });
  }

  return lines.join('\n');
};

const EVAL_SYSTEM_PROMPT = `You are an expert professional ATS evaluator. Score resumes accurately based on PROFESSIONAL STANDARDS.

Return ONLY valid JSON. No explanations, no markdown.

SCORING CRITERIA (0-100 total):
1. experience_quality (0-30): Depth, progression, quantified achievements, leadership
   - Entry level (0-2 years): 5-12pts
   - Mid-level (2-5 years): 12-20pts
   - Senior/Manager (5+ years): 20-30pts

2. skill_relevance (0-25): Domain expertise, certifications, tools matching role
   - Score based on ACTUAL job field, not irrelevant fields
   - Manager: leadership, strategy, communication, budget
   - Engineer: technical stack, architecture, problem-solving
   - Designer: design tools, UX/UI principles, creative portfolio
   - Sales: CRM, negotiation, pipeline management
   - (NOT tech skills for non-tech roles)

3. achievement_metrics (0-20): Quantified results, ROI, impact
   - Revenue/cost saved/efficiency gained
   - Team size managed
   - Projects completed
   - Vague descriptions = 1-5pts, specific metrics = 15-20pts

4. presentation_quality (0-15): Clarity, grammar, structure, formatting
   - Professional language, no errors: 13-15pts
   - Minor issues: 10-12pts
   - Multiple errors/poor structure: 5-9pts

5. completeness (0-10): All sections present, no gaps
   - All sections: 8-10pts
   - Missing 1 section: 5-7pts
   - Multiple missing: 1-4pts

BONUS (max 5pts):
- Certifications: +1
- Awards/recognition: +1
- Volunteer leadership: +1
- Publications/case studies: +1
- Modern formatting: +1

DEDUCTIONS (max 10pts):
- Grammar/spelling: -1 to -3
- Unexplained gaps >6mo: -2
- Inconsistent dates: -2
- Broken links: -1 each
- Vague descriptions: -1 to -2

ACCURACY RULES:
- Do NOT score tech skills for managers/sales/HR roles
- Do NOT penalize for missing irrelevant skills
- Do NOT assume education level = capability
- IGNORE: name, age, location, appearance
- FOCUS: actual professional experience and achievements`;

const buildEvalPrompt = (resumeText, jobRole, structured) => {
  const t = resumeText.length > 3500 ? resumeText.substring(0, 3500) + '\n[truncated]' : resumeText;
  
  const workExp = structured.work?.length || 0;
  const eduCount = structured.education?.length || 0;
  const skillCount = structured.skills?.length || 0;
  const projectCount = structured.projects?.length || 0;
  const certCount = structured.awards?.length || 0;
  
  const context = `EXTRACTED METRICS:
- Work Experiences: ${workExp}
- Education Entries: ${eduCount}
- Skills Listed: ${skillCount}
- Projects: ${projectCount}
- Certifications: ${certCount}

SKILL CATEGORIES: ${structured.skills?.map(s => s.name).slice(0, 20).join(', ') || 'None'}

EXPERIENCE TIMELINE:
${(structured.work || []).slice(0, 5).map((w, i) => `${i+1}. ${w.position} at ${w.name}`).join('\n') || 'None'}

EDUCATION:
${(structured.education || []).map((e, i) => `${i+1}. ${e.studyType} in ${e.area}`).join('\n') || 'None'}`;

  return `Score this resume for a ${jobRole} professional. Use this extracted data context:

${context}

Return ONLY this exact JSON structure with NO extra text:
{
  "scores": {
    "experience_quality": {"score": 0, "max": 30, "evidence": ""},
    "skill_relevance": {"score": 0, "max": 25, "evidence": ""},
    "achievement_metrics": {"score": 0, "max": 20, "evidence": ""},
    "presentation_quality": {"score": 0, "max": 15, "evidence": ""},
    "completeness": {"score": 0, "max": 10, "evidence": ""}
  },
  "bonus_points": {"total": 0, "breakdown": ""},
  "deductions": {"total": 0, "reasons": ""},
  "key_strengths": [],
  "areas_for_improvement": [],
  "actionable_recommendations": [],
  "format_issues": [],
  "detected_role": "${jobRole}"
}

EVALUATION RULES FOR THIS RESUME:
- ${workExp} work experiences found: score 5-12pts for entry (0-2yrs), 12-20pts for mid (2-5yrs), 20-30pts for senior (5+yrs)
- ${skillCount} skills found: evaluate relevance to ${jobRole} role only
- ${projectCount} projects: check for quantifiable metrics and impact
- ${eduCount} education entries: verify completeness
- Check for explicit metrics (%, $, numbers) in descriptions

IMPORTANT:
- DO NOT give high scores for vague descriptions without metrics
- DO NOT score irrelevant skills for this role
- Verify actual data from resume text below, not assumptions
- Be strict on achievement_metrics - require specific numbers

Resume text:
${t}`;
};

const validateScores = (evaluation) => {
  const categories = {
    experience_quality: 30,
    skill_relevance: 25,
    achievement_metrics: 20,
    presentation_quality: 15,
    completeness: 10,
  };

  evaluation.scores = evaluation.scores || {};
  for (const [key, max] of Object.entries(categories)) {
    if (!evaluation.scores[key]) evaluation.scores[key] = { score: 0, max, evidence: '' };
    const score = Number(evaluation.scores[key].score) || 0;
    evaluation.scores[key].score = Math.max(0, Math.min(max, score));
    evaluation.scores[key].max = max;
    evaluation.scores[key].evidence = (evaluation.scores[key].evidence || '').substring(0, 400);
  }

  if (!evaluation.bonus_points) evaluation.bonus_points = { total: 0, breakdown: '' };
  evaluation.bonus_points.total = Math.max(0, Math.min(5, Number(evaluation.bonus_points.total) || 0));

  if (!evaluation.deductions) evaluation.deductions = { total: 0, reasons: '' };
  evaluation.deductions.total = Math.max(0, Math.min(10, Number(evaluation.deductions.total) || 0));

  ['key_strengths', 'areas_for_improvement', 'actionable_recommendations', 'format_issues']
    .forEach((k) => { if (!Array.isArray(evaluation[k])) evaluation[k] = []; });

  return evaluation;
};

const computeTotal = (evaluation) => {
  let total = Object.values(evaluation.scores).reduce((s, c) => s + (c.score || 0), 0);
  total += evaluation.bonus_points.total;
  total -= evaluation.deductions.total;
  return Math.max(0, Math.min(100, total));
};

const getBaseScore = () => 100;

module.exports = {
  parseResumeToStructured,
  buildResumeText,
  EVAL_SYSTEM_PROMPT,
  buildEvalPrompt,
  validateScores,
  computeTotal,
  getBaseScore,
  detectJobRole,
  callGroq,
  extractJson,
  extractBasics,
  extractWork,
  extractEducation,
  extractSkillsArray,
  extractProjects,
  extractAwards,
};
