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

// Enhanced profession/job role detection
const detectJobRole = async (resumeText) => {
  console.log('[Role] Detecting job role from resume...');
  
  const resumeLower = resumeText.toLowerCase();
  
  // Pattern-based detection (more accurate than just AI)
  const professionPatterns = {
    engineer: /(?:software|senior|junior|full[-\s]?stack|frontend|backend|devops|cloud|infrastructure|platform|qa|test|systems|database|ml|ai|data|machine learning|ai engineer|cloud engineer|solutions architect|infrastructure engineer)\s+engineer/gi,
    manager: /(?:project|product|program|engineering|technical|team|dev|scrum|agile|operations|business|account|sales|brand)\s+manager|manager\s+(?:engineering|project|product|sales|business)|engineering\s+lead|team\s+lead|director|vp\s+(?:engineering|product|sales)|chief\s+(?:technology|product|operating)/gi,
    designer: /(?:product|ux|ui|graphic|web|interaction|visual|brand|creative|industrial|fashion|interior)\s+designer|design\s+(?:engineer|lead|director)|designer\s+(?:product|ux|ui)|design\s+architect/gi,
    sales: /sales\s+(?:engineer|executive|representative|manager|director|development|operations)|account\s+(?:executive|manager|representative)|business\s+development|sales\s+lead|bd\s+(?:manager|executive|manager)/gi,
    marketing: /marketing\s+(?:manager|director|coordinator|specialist|engineer|analyst|director|lead|executive)|product\s+marketing|demand\s+generation|marketing\s+lead|campaign\s+manager|brand\s+manager|content\s+(?:manager|strategist)|seo|sem|demand\s+gen/gi,
    finance: /(?:financial|accountant|accounts|accounting|tax|audit|budget|treasury|controller|analyst|officer|director)\s+(?:analyst|officer|manager|director)|cfo|finance\s+(?:director|manager|lead|officer)|chartered\s+accountant|cpa/gi,
    hr: /(?:human\s+resources|hr|talent|recruiting|recruitment|organizational|people|culture|compensation|benefits|employee|learning|development|training)\s+(?:manager|director|specialist|lead|officer|executive|analyst)|recruiter|talent\s+(?:acquisition|manager|lead)|hr\s+(?:director|manager|lead|specialist)/gi,
    consultant: /consultant|consulting|management\s+consultant|strategy\s+consultant|business\s+consultant|management\s+consulting|advisory|strategy\s+lead|business\s+advisor|advisory\s+board/gi,
    analyst: /(?:business|data|financial|market|research|systems|quality|security|operations|process|risk|compliance)\s+analyst|analyst\s+(?:business|data|financial)|analytics\s+(?:engineer|lead|manager)|data\s+scientist/gi,
    operations: /operations\s+(?:manager|director|lead|officer|specialist|analyst)|operations|supply\s+chain|logistics\s+(?:manager|director|specialist)|process\s+(?:engineer|manager|improvement)/gi,
    admin: /administrative\s+(?:assistant|officer|coordinator|specialist)|office\s+(?:manager|coordinator|assistant)|executive\s+assistant|administration|administrator|data\s+entry/gi
  };

  // Count matches for each profession
  let maxMatches = 0;
  let detectedRole = 'other';
  
  for (const [role, pattern] of Object.entries(professionPatterns)) {
    const matches = (resumeLower.match(pattern) || []).length;
    console.log(`[Role] ${role}: ${matches} keyword matches`);
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedRole = role;
    }
  }
  
  // If no strong pattern match, use AI as fallback
  if (maxMatches < 2) {
    console.log('[Role] No strong pattern match, using AI...');
    try {
      const result = await callGroq(
        'You identify job roles from resumes. Respond with ONLY the role name.',
        `Analyze this resume and identify the PRIMARY job role/field. Return ONLY one of these: manager, engineer, designer, sales, marketing, hr, operations, finance, consultant, analyst, admin, other.\n\nResume:\n${resumeText.substring(0, 1500)}`,
        50,
        'role-detect'
      );
      const role = result.toLowerCase().trim();
      const validRoles = ['manager', 'engineer', 'designer', 'sales', 'marketing', 'hr', 'operations', 'finance', 'consultant', 'analyst', 'admin'];
      detectedRole = validRoles.includes(role) ? role : 'other';
    } catch (e) {
      console.log('[Role] AI detection failed, keeping pattern result');
    }
  }
  
  console.log(`[Role] Detected role: ${detectedRole}`);
  return detectedRole;
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

const EVAL_SYSTEM_PROMPT = `You are an expert professional ATS evaluator. Score resumes starting from BASE SCORE of 50.

Improvements add points. Poor metrics lose points. Base = 50, Max = 100.

Return ONLY valid JSON. No explanations, no markdown.

SCORING FROM BASE 50:
1. experience_quality (+0 to +15): Years and progression
   - 0-2 years: +0 to +5
   - 2-5 years: +5 to +10
   - 5+ years: +10 to +15

2. skill_relevance (+0 to +15): Skills matching actual job role
   - Few relevant skills: +0 to +5
   - Some relevant skills: +5 to +10
   - Many relevant skills: +10 to +15

3. achievement_metrics (+0 to +12): Quantified results
   - Vague descriptions: +0 to +3
   - Some metrics: +3 to +7
   - Strong metrics ($, %, scale): +7 to +12

4. presentation_quality (+0 to +10): Grammar, formatting
   - Poor: +0 to +3
   - Good: +3 to +7
   - Excellent: +7 to +10

5. completeness (+0 to +8): Sections present
   - Minimal sections: +0 to +3
   - Most sections: +3 to +6
   - All sections: +6 to +8

BONUSES (+0 to +5):
- Certifications: +1
- Awards: +1
- Leadership experience: +1
- Published work: +1
- Modern formatting: +1

DEDUCTIONS (-0 to -8):
- Grammar errors: -1 to -2
- Employment gaps: -1 to -2
- Vague descriptions: -1 to -2
- Format issues: -0 to -2`;

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

DETECTED PROFESSION: ${jobRole}

SKILL CATEGORIES: ${structured.skills?.map(s => s.name).slice(0, 20).join(', ') || 'None'}

EXPERIENCE TIMELINE:
${(structured.work || []).slice(0, 5).map((w, i) => `${i+1}. ${w.position} at ${w.name}`).join('\n') || 'None'}

EDUCATION:
${(structured.education || []).map((e, i) => `${i+1}. ${e.studyType} in ${e.area}`).join('\n') || 'None'}`;

  return `Score this ${jobRole} professional's resume STARTING FROM BASE 50. Add improvements, deduct weaknesses. Max = 100.

${context}

Return ONLY this exact JSON structure with NO extra text:
{
  "base_score": 50,
  "score_breakdown": {
    "experience_quality": {"improvement": 0, "max": 15, "evidence": ""},
    "skill_relevance": {"improvement": 0, "max": 15, "evidence": ""},
    "achievement_metrics": {"improvement": 0, "max": 12, "evidence": ""},
    "presentation_quality": {"improvement": 0, "max": 10, "evidence": ""},
    "completeness": {"improvement": 0, "max": 8, "evidence": ""}
  },
  "bonuses": {"total": 0, "breakdown": ""},
  "deductions": {"total": 0, "reasons": ""},
  "key_strengths": [],
  "areas_for_improvement": [],
  "actionable_recommendations": [],
  "detected_role": "${jobRole}",
  "final_score": 50
}

EVALUATION RULES:
- BASE SCORE: 50 (starting point for all resumes)
- ${workExp} work experiences: evaluate progression quality
- ${skillCount} skills found: are they relevant to ${jobRole}?
- ${projectCount} projects: do they have quantifiable metrics?
- ${eduCount} education entries: is it strong/relevant?
- Check for explicit metrics (%, $, numbers) in descriptions

SCORING GUIDANCE FOR ${jobRole}:
- experience_quality: Award points for years and progression (${workExp} roles found)
- skill_relevance: Award for skills matching ${jobRole} role specifically
- achievement_metrics: Award for quantifiable results ($, %, scale)
- presentation_quality: Award for clear writing and professional formatting
- completeness: Award for having all important sections

Resume text:
${t}`;
};

const validateScores = (evaluation) => {
  evaluation.base_score = 50;
  
  evaluation.score_breakdown = evaluation.score_breakdown || {};
  const categories = {
    experience_quality: 15,
    skill_relevance: 15,
    achievement_metrics: 12,
    presentation_quality: 10,
    completeness: 8
  };

  for (const [key, max] of Object.entries(categories)) {
    if (!evaluation.score_breakdown[key]) {
      evaluation.score_breakdown[key] = { improvement: 0, max, evidence: '' };
    }
    const improvement = Number(evaluation.score_breakdown[key].improvement) || 0;
    evaluation.score_breakdown[key].improvement = Math.max(0, Math.min(max, improvement));
    evaluation.score_breakdown[key].max = max;
    evaluation.score_breakdown[key].evidence = (evaluation.score_breakdown[key].evidence || '').substring(0, 400);
  }

  if (!evaluation.bonuses) evaluation.bonuses = { total: 0, breakdown: '' };
  evaluation.bonuses.total = Math.max(0, Math.min(5, Number(evaluation.bonuses.total) || 0));

  if (!evaluation.deductions) evaluation.deductions = { total: 0, reasons: '' };
  evaluation.deductions.total = Math.max(0, Math.min(8, Number(evaluation.deductions.total) || 0));

  ['key_strengths', 'areas_for_improvement', 'actionable_recommendations']
    .forEach((k) => { if (!Array.isArray(evaluation[k])) evaluation[k] = []; });

  return evaluation;
};

const computeTotal = (evaluation) => {
  let total = evaluation.base_score || 50;
  
  if (evaluation.score_breakdown) {
    Object.values(evaluation.score_breakdown).forEach(cat => {
      total += (cat.improvement || 0);
    });
  }
  
  total += (evaluation.bonuses?.total || 0);
  total -= (evaluation.deductions?.total || 0);
  
  return Math.max(0, Math.min(100, total));
};

const getBaseScore = () => 50;

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
