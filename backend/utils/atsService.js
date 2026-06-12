const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const MODEL = process.env.DEFAULT_MODEL || 'llama-3.3-70b-versatile';

// ─── LLM CALL WITH RETRY ON 429 ─────────────────────────────────────────────

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
            { role: 'user',   content: userPrompt },
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
        // Read retry-after from Groq header or error message, default 15s
        const retryAfter = parseInt(
          err.response?.headers?.['retry-after'] ||
          (err.response?.data?.error?.message?.match(/(\d+)s/))?.[1] ||
          '15'
        );
        const wait = (retryAfter + 2) * 1000;
        console.warn(`[Groq] 429 rate limit on attempt ${attempt}. Waiting ${retryAfter + 2}s...`);
        await sleep(wait);
        continue;
      }
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.error(`[Groq] ERROR${label ? ` [${label}]` : ''} after ${elapsed}s:`, err.response?.data || err.message);
      throw err;
    }
  }
};

const extractJson = (text) => {
  if (!text) return null;
  // Strip <think> blocks (some models emit these)
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

// ─── PHASE 1: STRUCTURED RESUME PARSING (single combined LLM call) ─────────────
// One call instead of 6 — saves ~5x tokens, avoids TPM rate limit

const PARSE_SYSTEM = 'You are an expert resume parser. Extract ALL sections in ONE response. Return ONLY valid JSON. No markdown fences, no explanatory text.';

const PARSE_PROMPT = (text) => {
  const t = text.length > 4000 ? text.substring(0, 4000) + '\n[truncated]' : text;
  return `Extract ALL sections from this resume into one JSON object.

Resume:
${t}

Return this exact structure (skip empty arrays):
{
  "basics": { "name": "", "email": "", "phone": "", "summary": null, "location": { "city": "", "countryCode": "" }, "profiles": [{ "network": "", "url": "", "username": "" }] },
  "work": [{ "name": "", "position": "", "startDate": "", "endDate": "", "summary": "", "highlights": [] }],
  "education": [{ "institution": "", "area": "", "studyType": "", "startDate": "", "endDate": "", "score": "" }],
  "skills": [{ "name": "", "keywords": [] }],
  "projects": [{ "name": "", "description": "", "url": null, "technologies": [] }],
  "awards": [{ "title": "", "date": "", "awarder": "", "summary": "" }]
}
Rules: profiles = ONLY URLs explicitly in resume. work endDate = "Present" if ongoing. Return ONLY valid JSON.`;
};

const safeParse = (raw, fallback) => {
  try {
    const json = extractJson(raw);
    return json ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
};

// Single combined call — 1 LLM request instead of 6, ~2000 tokens instead of ~12000
const parseResumeToStructured = async (resumeText, onSectionStart, onSectionDone) => {
  const sectionKeys = ['basics', 'work', 'education', 'skills', 'projects', 'awards'];

  // Mark all active at once since it's one call
  sectionKeys.forEach((k) => onSectionStart?.(k));

  console.log('[Parse] Single combined LLM call...');
  const raw = await callGroq(PARSE_SYSTEM, PARSE_PROMPT(resumeText), 2048, 'parse:all');
  console.log(`[Parse] Response: ${raw?.length ?? 0} chars`);

  const structured = safeParse(raw, {});
  console.log('[Parse] Parsed keys:', Object.keys(structured));

  // Tick done for all sections
  sectionKeys.forEach((k) => onSectionDone?.(k));

  return structured;
};

// ─── RESUME TEXT BUILDER (mirrors hiring-agent's convert_json_resume_to_text) ──

const buildResumeText = (resumeData) => {
  const lines = [];

  if (resumeData.basics) {
    const b = resumeData.basics;
    lines.push('=== BASIC INFORMATION ===');
    if (b.name)    lines.push(`Name: ${b.name}`);
    if (b.email)   lines.push(`Email: ${b.email}`);
    if (b.phone)   lines.push(`Phone: ${b.phone}`);
    if (b.url)     lines.push(`Website: ${b.url}`);
    if (b.summary) lines.push(`Summary: ${b.summary}`);
    if (b.location) {
      const loc = b.location;
      const parts = [loc.address, loc.city, loc.region, loc.postalCode, loc.countryCode].filter(Boolean);
      if (parts.length) lines.push(`Location: ${parts.join(', ')}`);
    }
    if (b.profiles?.length) {
      lines.push('Profiles:');
      b.profiles.forEach((p) => {
        if (p.url) lines.push(`  - ${p.network || 'Link'}: ${p.url}${p.username ? ` (${p.username})` : ''}`);
      });
    }
  }

  if (resumeData.work?.length) {
    lines.push('\n=== WORK EXPERIENCE ===');
    resumeData.work.forEach((w, i) => {
      lines.push(`${i + 1}. ${w.position || 'Role'} at ${w.name || 'Company'}`);
      if (w.startDate || w.endDate) lines.push(`   Period: ${w.startDate || ''} - ${w.endDate || 'Present'}`);
      if (w.url) lines.push(`   URL: ${w.url}`);
      if (w.summary) lines.push(`   Description: ${w.summary}`);
      if (w.highlights?.length) {
        lines.push('   Key Achievements:');
        w.highlights.forEach((h) => lines.push(`     • ${h}`));
      }
    });
  }

  if (resumeData.volunteer?.length) {
    lines.push('\n=== VOLUNTEER / ORGANIZATIONS ===');
    resumeData.volunteer.forEach((v) => {
      lines.push(`• ${v.position || v.role || ''} at ${v.organization || ''}`);
      if (v.startDate || v.endDate) lines.push(`  Period: ${v.startDate || ''} - ${v.endDate || 'Present'}`);
      if (v.summary) lines.push(`  ${v.summary}`);
    });
  }

  if (resumeData.education?.length) {
    lines.push('\n=== EDUCATION ===');
    resumeData.education.forEach((e, i) => {
      lines.push(`${i + 1}. ${e.studyType || ''} in ${e.area || ''}`);
      if (e.institution) lines.push(`   Institution: ${e.institution}`);
      if (e.startDate || e.endDate) lines.push(`   Period: ${e.startDate || ''} - ${e.endDate || ''}`);
      if (e.score) lines.push(`   Score/GPA: ${e.score}`);
      if (e.courses?.length) lines.push(`   Courses: ${e.courses.join(', ')}`);
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
      if (p.description) lines.push(`   Description: ${p.description}`);
      if (p.url) lines.push(`   URL: ${p.url}`);
      const techs = p.technologies || p.skills || [];
      if (techs.length) lines.push(`   Technologies: ${techs.join(', ')}`);
      if (p.highlights?.length) p.highlights.forEach((h) => lines.push(`   • ${h}`));
    });
  }

  if (resumeData.awards?.length) {
    lines.push('\n=== AWARDS & ACHIEVEMENTS ===');
    resumeData.awards.forEach((a) => {
      lines.push(`• ${a.title}${a.date ? ` (${a.date})` : ''}${a.awarder ? ` - ${a.awarder}` : ''}`);
      if (a.summary) lines.push(`  ${a.summary}`);
    });
  }

  if (resumeData.certificates?.length) {
    lines.push('\n=== CERTIFICATES ===');
    resumeData.certificates.forEach((c) => {
      lines.push(`• ${c.name}${c.issuer ? ` - ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}`);
      if (c.url) lines.push(`  URL: ${c.url}`);
    });
  }

  if (resumeData.publications?.length) {
    lines.push('\n=== PUBLICATIONS ===');
    resumeData.publications.forEach((pub) => {
      lines.push(`• ${pub.name}${pub.releaseDate ? ` (${pub.releaseDate})` : ''}${pub.publisher ? ` - ${pub.publisher}` : ''}`);
    });
  }

  if (resumeData.languages?.length) {
    lines.push('\n=== LANGUAGES ===');
    resumeData.languages.forEach((l) => lines.push(`• ${l.language} (${l.fluency || 'N/A'})`));
  }

  return lines.join('\n');
};

// ─── GITHUB TEXT BUILDER (mirrors hiring-agent's convert_github_data_to_text) ──

const buildGithubText = (githubData) => {
  if (!githubData) return '';
  const lines = ['\n\n=== GITHUB DATA ==='];

  if (githubData.profile) {
    const p = githubData.profile;
    lines.push('GitHub Profile:');
    if (p.username)      lines.push(`- Username: ${p.username}`);
    if (p.name)          lines.push(`- Name: ${p.name}`);
    if (p.bio)           lines.push(`- Bio: ${p.bio}`);
    if (p.public_repos !== undefined) lines.push(`- Public Repositories: ${p.public_repos}`);
    if (p.followers !== undefined)    lines.push(`- Followers: ${p.followers}`);
    if (p.following !== undefined)    lines.push(`- Following: ${p.following}`);
    if (p.created_at)    lines.push(`- Account Created: ${p.created_at}`);
    if (p.updated_at)    lines.push(`- Last Updated: ${p.updated_at}`);
    if (p.blog)          lines.push(`- Blog/Portfolio: ${p.blog}`);
    if (p.hireable !== undefined) lines.push(`- Hireable: ${p.hireable}`);
  }

  if (githubData.projects?.length) {
    lines.push(`\nGitHub Projects (${githubData.total_projects} total repos, showing top ${githubData.projects.length}):`);
    githubData.projects.forEach((proj, i) => {
      const d = proj.github_details || {};
      lines.push(
        `${i + 1}. ${proj.name} [${d.language || 'N/A'}] ★${d.stars || 0} forks:${d.forks || 0} type:${proj.project_type}`
      );
      lines.push(
        `   author_commits:${proj.author_commit_count} total_commits:${proj.total_commit_count} contributors:${proj.contributor_count}`
      );
      if (proj.description) lines.push(`   Description: ${proj.description}`);
      if (d.topics?.length) lines.push(`   Topics: ${d.topics.join(', ')}`);
      if (proj.live_url)    lines.push(`   Live URL: ${proj.live_url}`);
      if (d.updated_at)     lines.push(`   Last updated: ${d.updated_at}`);
    });
  }

  return lines.join('\n');
};

// ─── ROLE DETECTION ──────────────────────────────────────────────────────────
// Detects tech vs non-tech from structured resume data using LLM

const detectRoleType = async (structured) => {
  console.log('[RoleDetect] Starting role detection...');
  const techSignals = [
    structured.basics?.profiles?.some((p) =>
      ['github', 'gitlab', 'bitbucket', 'stackoverflow', 'leetcode', 'hackerrank', 'codeforces'].some((n) =>
        p.network?.toLowerCase().includes(n) || p.url?.toLowerCase().includes(n)
      )
    ),
    structured.skills?.some((s) =>
      s.keywords?.some((k) =>
        /python|javascript|java|c\+\+|react|node|django|spring|sql|aws|docker|kubernetes|git|typescript|golang|rust/i.test(k)
      ) || /programming|languages|frameworks|backend|frontend|devops/i.test(s.name)
    ),
    structured.projects?.some((p) =>
      /api|app|website|bot|ml|ai|model|database|server|deploy/i.test(p.description || p.name)
    ),
    structured.work?.some((w) =>
      /engineer|developer|programmer|software|devops|data scientist|ml|sde|fullstack|backend|frontend/i.test(
        (w.position || '') + ' ' + (w.summary || '')
      )
    ),
  ];

  const techSignalCount = techSignals.filter(Boolean).length;
  console.log(`[RoleDetect] Tech signal count: ${techSignalCount}/4`);
  if (techSignalCount >= 2) { console.log('[RoleDetect] Result: tech (signal match)'); return 'tech'; }
  if (techSignalCount === 0) { console.log('[RoleDetect] Result: non-tech (signal match)'); return 'non-tech'; }

  // Borderline — use LLM to decide
  const snippet = [
    structured.basics?.summary || '',
    (structured.work || []).slice(0, 2).map((w) => `${w.position} at ${w.name}: ${w.summary || ''}`).join(' | '),
    (structured.skills || []).slice(0, 3).map((s) => `${s.name}: ${(s.keywords || []).slice(0, 5).join(', ')}`).join(' | '),
  ].filter(Boolean).join('\n');

  try {
    console.log('[RoleDetect] Borderline — calling LLM...');
    const raw = await callGroq(
      'You classify resumes as tech or non-tech. Respond with ONLY one word: "tech" or "non-tech".',
      `Based on this resume snippet, is this person a tech (software/engineering/data/devops) or non-tech (sales/marketing/hr/management/design/operations) professional?\n\n${snippet}\n\nRespond with ONLY "tech" or "non-tech".`,
      10,
      'roleDetect'
    );
    const result = raw.toLowerCase().includes('non') ? 'non-tech' : 'tech';
    console.log(`[RoleDetect] LLM result: ${result}`);
    return result;
  } catch (e) {
    console.error('[RoleDetect] LLM fallback failed:', e.message);
    return 'tech';
  }
};

// ─── NON-TECH PROFILE LINK VALIDATOR ─────────────────────────────────────────
// Safely fetches non-GitHub profile links and extracts validation signals

const SAFE_DOMAINS = [
  'linkedin.com', 'behance.net', 'dribbble.com', 'medium.com', 'dev.to',
  'substack.com', 'notion.so', 'portfolio', 'personal', 'blog', 'wordpress.com',
  'wix.com', 'squarespace.com', 'webflow.io', 'carrd.co', 'about.me',
];

const isSafeDomain = (url) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return SAFE_DOMAINS.some((d) => hostname.includes(d));
  } catch {
    return false;
  }
};

const fetchProfileLink = async (url) => {
  if (!url || !isSafeDomain(url)) return null;
  try {
    const { data, status } = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 3,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ATSBot/1.0)' },
      validateStatus: (s) => s < 500,
    });
    if (status !== 200 || typeof data !== 'string') return { url, accessible: false };

    // Extract text content (strip HTML tags)
    const text = data.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 3000);
    return { url, accessible: true, contentLength: text.length, snippet: text.substring(0, 500) };
  } catch {
    return { url, accessible: false };
  }
};

const fetchNonTechProfiles = async (structured) => {
  const profiles = structured.basics?.profiles || [];
  const results = [];

  for (const profile of profiles) {
    if (!profile.url) continue;
    // Skip GitHub for non-tech path
    if (profile.url.toLowerCase().includes('github.com')) continue;

    const result = await fetchProfileLink(profile.url);
    if (result) {
      results.push({
        network: profile.network || 'Unknown',
        url: profile.url,
        accessible: result.accessible,
        snippet: result.snippet || null,
      });
    }
  }
  return results;
};

const buildNonTechProfileText = (profileResults) => {
  if (!profileResults?.length) return '';
  const lines = ['\n\n=== ONLINE PRESENCE VALIDATION ==='];
  for (const p of profileResults) {
    lines.push(`\n${p.network}: ${p.url}`);
    if (p.accessible) {
      lines.push(`  Status: Accessible (profile exists)`);
      if (p.snippet) lines.push(`  Content preview: ${p.snippet.substring(0, 200)}`);
    } else {
      lines.push(`  Status: Not accessible or broken link`);
    }
  }
  return lines.join('\n');
};

// ─── ROLE-SPECIFIC EVAL PROMPTS ───────────────────────────────────────────────

// Tech role — same as hiring-agent (existing)
const EVAL_SYSTEM_PROMPT_TECH =
`You are an expert technical recruiter scoring resumes. Return ONLY valid JSON. No summaries, no extra fields.

FAIRNESS: Ignore name, gender, college, GPA, location. Score only technical skills, project quality, open source, and work experience.

SCORING RULES:
- open_source: Personal GitHub repos alone = 5-10pts max. True open source = contributing to OTHER people's projects. GSoC = high score.
- self_projects: Simple CRUD/todo/weather/calculator = 1-9pts. Complex multi-feature apps with real impact = 20-30pts. No links = -3 to -5pts per project.
- production: Score work/volunteer/internship experience. Founder/co-founder roles get extra points.
- technical_skills: Breadth of languages, frameworks, and demonstrated problem-solving.

MANDATORY: Fill ALL FOUR categories. Evidence cannot be empty. Scores cannot be negative.
LIMITS: open_source≤35, self_projects≤30, production≤25, technical_skills≤10, bonus≤20, total≤120.

When GitHub data is provided, check project_type field: 'open_source'=multiple contributors, 'self_project'=single contributor.`;

// Non-tech role — different scoring dimensions
const EVAL_SYSTEM_PROMPT_NONTECH =
`You are an expert HR recruiter scoring non-technical resumes. Return ONLY valid JSON. No summaries, no extra fields.

FAIRNESS: Ignore name, gender, college name, location. Score only professional experience quality, impact, skills, and online presence.

SCORING RULES:
- work_experience: Depth and relevance of professional experience. Leadership/management = higher score. Quantified achievements = higher score. Founder/co-founder = extra points. (0-35)
- skills_and_tools: Domain expertise, software tools, certifications, industry-specific skills. Soft skills alone = low score; demonstrated tools/platforms = higher. (0-25)
- projects_and_impact: Campaigns, events, business results, client work, measurable impact. No evidence of impact = 1-9pts. Clear ROI/outcomes = 20-30pts. (0-25)
- education_and_certs: Relevant degree, professional certifications, industry training. (0-15)

BONUS (max 15pts): LinkedIn presence+verified=+3, portfolio/personal site=+2, publications/articles=+2, awards/recognitions=+3, speaking engagements=+2, volunteer leadership=+2.
DEDUCTIONS: Employment gaps >6mo without explanation=-3. Vague achievements with no metrics=-2. Broken/inaccessible profile links=-2 each.

MANDATORY: Fill ALL FOUR categories. Evidence cannot be empty. Scores cannot be negative.
LIMITS: work_experience≤35, skills_and_tools≤25, projects_and_impact≤25, education_and_certs≤15, bonus≤15.`;

const buildEvalUserPromptTech = (resumeText) => {
  const t = resumeText.length > 3500 ? resumeText.substring(0, 3500) + '\n[truncated]' : resumeText;
  return `Score this resume for a Software Engineering role. Return ONLY the JSON below, no other text.

SCORING CRITERIA:
- open_source (0-35): Contributing to OTHER people's repos = high score. Personal repos only = ≤10pts. GSoC=+5bonus.
- self_projects (0-30): Complex/multi-feature/AI/real-world apps = 20-30pts. Tutorial clones/CRUD/todo = 1-9pts. No project links = -3 to -5pts each.
- production (0-25): Internships, jobs, volunteer. Founder/co-founder = extra points.
- technical_skills (0-10): Languages, frameworks, breadth, problem-solving evidence.

BONUS (max 20pts): GSoC=+5, GSSoC=+3, founder=+3-5, portfolio=+2, LinkedIn=+1, tech blogs=+1-3.
DEDUCTIONS: Tutorial-only projects=-2 to -5. No project links=-3 to -5 each.

Return this EXACT JSON:
{
  "scores": {
    "open_source":      {"score": 0, "max": 35, "evidence": ""},
    "self_projects":    {"score": 0, "max": 30, "evidence": ""},
    "production":       {"score": 0, "max": 25, "evidence": ""},
    "technical_skills": {"score": 0, "max": 10, "evidence": ""}
  },
  "bonus_points": {"total": 0, "breakdown": ""},
  "deductions":   {"total": 0, "reasons": ""},
  "key_strengths": [],
  "areas_for_improvement": [],
  "actionable_recommendations": [],
  "ats_keywords_missing": [],
  "resume_format_issues": []
}

Resume:
${t}`;
};

const buildEvalUserPromptNonTech = (resumeText) => {
  const t = resumeText.length > 3500 ? resumeText.substring(0, 3500) + '\n[truncated]' : resumeText;
  return `Score this resume for a non-technical professional role. Return ONLY the JSON below, no other text.

SCORING CRITERIA:
- work_experience (0-35): Depth, leadership, quantified achievements. Founder = extra points.
- skills_and_tools (0-25): Domain tools (CRM, analytics, design), certs, industry skills.
- projects_and_impact (0-25): Campaigns, client results, measurable outcomes. No metrics = 1-9pts. Clear ROI = 20-25pts.
- education_and_certs (0-15): Relevant degree, professional certs (PMP, CFA, MBA).

BONUS (max 15pts): LinkedIn=+3, portfolio=+2, publications=+2, awards=+3, speaking=+2, volunteer leadership=+2.
DEDUCTIONS: Gaps >6mo=-3. Vague achievements=-2. Broken links=-2 each.

Return this EXACT JSON:
{
  "scores": {
    "work_experience":     {"score": 0, "max": 35, "evidence": ""},
    "skills_and_tools":    {"score": 0, "max": 25, "evidence": ""},
    "projects_and_impact": {"score": 0, "max": 25, "evidence": ""},
    "education_and_certs": {"score": 0, "max": 15, "evidence": ""}
  },
  "bonus_points": {"total": 0, "breakdown": ""},
  "deductions":   {"total": 0, "reasons": ""},
  "key_strengths": [],
  "areas_for_improvement": [],
  "actionable_recommendations": [],
  "ats_keywords_missing": [],
  "resume_format_issues": []
}

Resume:
${t}`;
};

// ─── SCORE VALIDATION (handles both tech and non-tech schemas) ────────────────

const TECH_MAXES    = { open_source: 35, self_projects: 30, production: 25, technical_skills: 10 };
const NONTECH_MAXES = { work_experience: 35, skills_and_tools: 25, projects_and_impact: 25, education_and_certs: 15 };

const validateScores = (evaluation, roleType = 'tech') => {
  const maxes = roleType === 'tech' ? TECH_MAXES : NONTECH_MAXES;
  evaluation.scores = evaluation.scores || {};

  for (const [key, max] of Object.entries(maxes)) {
    if (!evaluation.scores[key]) evaluation.scores[key] = { score: 0, max, evidence: 'No data found' };
    evaluation.scores[key].score   = Math.max(0, Math.min(max, Number(evaluation.scores[key].score) || 0));
    evaluation.scores[key].max     = max;
    evaluation.scores[key].evidence = (evaluation.scores[key].evidence || '').substring(0, 600);
  }

  const bonusMax = roleType === 'tech' ? 20 : 15;
  if (!evaluation.bonus_points) evaluation.bonus_points = { total: 0, breakdown: 'None' };
  evaluation.bonus_points.total = Math.max(0, Math.min(bonusMax, Number(evaluation.bonus_points.total) || 0));

  if (!evaluation.deductions) evaluation.deductions = { total: 0, reasons: 'None' };
  evaluation.deductions.total = Math.max(0, Number(evaluation.deductions.total) || 0);

  ['key_strengths', 'areas_for_improvement', 'actionable_recommendations', 'ats_keywords_missing', 'resume_format_issues']
    .forEach((k) => { if (!Array.isArray(evaluation[k])) evaluation[k] = []; });

  return evaluation;
};

const computeTotal = (evaluation) => {
  let total = Object.values(evaluation.scores).reduce((s, c) => s + (c.score || 0), 0);
  total += evaluation.bonus_points.total;
  total -= evaluation.deductions.total;
  return Math.max(0, Math.min(120, total));
};

// Base score for percentage (tech=100, non-tech=100 — sum of category maxes)
const getBaseScore = (roleType) =>
  roleType === 'tech'
    ? Object.values(TECH_MAXES).reduce((s, v) => s + v, 0)      // 100
    : Object.values(NONTECH_MAXES).reduce((s, v) => s + v, 0);  // 100

// ─── GITHUB ───────────────────────────────────────────────────────────────────

const extractGithubUsername = (url) => {
  if (!url) return null;
  url = url.replace(/\s/g, '').trim();
  const patterns = [
    /https?:\/\/github\.com\/([^\/\?#\s]+)/,
    /github\.com\/([^\/\?#\s]+)/,
    /^([a-zA-Z0-9-]+)$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const ghHeaders = () =>
  GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

const fetchGithubProfile = async (githubUrl) => {
  console.log(`[GitHub] fetchGithubProfile: ${githubUrl}`);
  try {
    const username = extractGithubUsername(githubUrl);
    console.log(`[GitHub] Extracted username: ${username}`);
    if (!username) return null;
    const { data } = await axios.get(`https://api.github.com/users/${username}`, {
      headers: ghHeaders(), timeout: 15000,
    });
    return {
      username: data.login, name: data.name, bio: data.bio,
      location: data.location, company: data.company,
      public_repos: data.public_repos, followers: data.followers,
      following: data.following, created_at: data.created_at,
      updated_at: data.updated_at, blog: data.blog, hireable: data.hireable,
    };
  } catch (e) {
    if (e.response?.status !== 404) console.error('GitHub profile error:', e.message);
    return null;
  }
};

// mirrors hiring-agent's fetch_repo_contributors + fetch_contributions_count
const fetchRepoContributors = async (owner, repo) => {
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contributors`,
      { headers: ghHeaders(), params: { per_page: 100 }, timeout: 10000 }
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// mirrors hiring-agent's fetch_all_github_repos exactly
const fetchAllRepos = async (githubUrl) => {
  console.log(`[GitHub] fetchAllRepos for: ${githubUrl}`);
  try {
    const username = extractGithubUsername(githubUrl);
    console.log(`[GitHub] Username: ${username}`);
    if (!username) return [];

    const { data: repos } = await axios.get(
      `https://api.github.com/users/${username}/repos`,
      {
        headers: ghHeaders(),
        params: { sort: 'updated', per_page: 100, type: 'all' },
        timeout: 20000,
      }
    );

    console.log(`[GitHub] Total repos from API: ${repos.length}`);
    const projects = [];
    for (const repo of repos) {
      if (repo.fork && (repo.forks_count || 0) < 5) continue;

      console.log(`[GitHub]   Fetching contributors for: ${repo.name}`);
      const contributors = await fetchRepoContributors(username, repo.name);
      const contributorCount = contributors.length;

      let authorCommits = 0;
      let totalCommits = 0;
      for (const c of contributors) {
        totalCommits += c.contributions || 0;
        if (c.login?.toLowerCase() === username.toLowerCase()) {
          authorCommits = c.contributions || 0;
        }
      }

      projects.push({
        name: repo.name,
        description: repo.description,
        github_url: repo.html_url,
        live_url: repo.homepage || null,
        technologies: repo.language ? [repo.language] : [],
        // mirrors hiring-agent: open_source if contributor_count > 1
        project_type: contributorCount > 1 ? 'open_source' : 'self_project',
        contributor_count: contributorCount,
        author_commit_count: authorCommits,
        total_commit_count: totalCommits,
        github_details: {
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          description: repo.description,
          topics: repo.topics || [],
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          open_issues: repo.open_issues_count,
          size: repo.size,
          fork: repo.fork,
          archived: repo.archived,
          default_branch: repo.default_branch,
          contributors: contributorCount,
        },
      });
    }

    projects.sort((a, b) => b.github_details.stars - a.github_details.stars);

    const osCount   = projects.filter((p) => p.project_type === 'open_source').length;
    const selfCount = projects.filter((p) => p.project_type === 'self_project').length;
    console.log(`✅ GitHub: ${projects.length} repos — ${osCount} open-source, ${selfCount} self-project`);
    return projects;
  } catch (e) {
    console.error('GitHub repos error:', e.message);
    return [];
  }
};

// mirrors hiring-agent's generate_projects_json: filters author_commit_count >= 1, then LLM selects top 7
const selectTopProjects = async (projects) => {
  console.log(`[GitHub] selectTopProjects: ${projects.length} input projects`);
  // Filter: skip repos where author made 0 commits (not their own work)
  const withCommits = projects.filter((p) => p.author_commit_count > 0);
  if (withCommits.length === 0) return projects.slice(0, 7);
  if (withCommits.length <= 7) return withCommits;

  // Hard filter for LLM selection: author_commit_count >= 4
  const qualified = withCommits.filter((p) => p.author_commit_count >= 4);
  const pool = qualified.length >= 7 ? qualified : withCommits;

  const projectsJson = JSON.stringify(
    pool.map((p) => ({
      name: p.name,
      description: p.description,
      project_type: p.project_type,
      author_commit_count: p.author_commit_count,
      total_commit_count: p.total_commit_count,
      contributor_count: p.contributor_count,
      stars: p.github_details.stars,
      forks: p.github_details.forks,
      language: p.github_details.language,
      topics: p.github_details.topics,
      updated_at: p.github_details.updated_at,
      live_url: p.live_url,
    })),
    null, 2
  );

  // Mirrors hiring-agent's github_project_selection.jinja prompt
  const selectionPrompt = `You are an expert technical recruiter analyzing GitHub repositories to identify the most impressive projects.

**ABSOLUTE REQUIREMENT**: Only select projects where author_commit_count is 4 or higher. Projects with 1-3 commits indicate minimal involvement and should NEVER be selected.

Given the repositories below, select the TOP 7 most impressive projects for evaluating a candidate's technical skills.

**IMPORTANT: Contributions to Popular Open Source Projects**
- HIGH PRIORITY: Contributions to well-known popular projects (1000+ stars) are extremely valuable
- A small contribution to a popular project is often more impressive than a complete personal project
- Check if any repo is a fork of a popular project where the candidate made meaningful contributions

**Selection Criteria (in priority order):**
1. Author commit count (high author_commit_count = substantial involvement) — HIGHEST PRIORITY
2. Contributions to popular open source projects (1000+ stars repos)
3. Technical complexity (advanced concepts, architecture, problem-solving)
4. Real-world impact (actual users, deployments, practical apps)
5. Community engagement (stars, forks)
6. Tech stack diversity and modernity
7. Originality (not tutorial-based)

**Projects to AVOID:**
- author_commit_count of 1-3
- Tutorial projects (Hello World, basic calculators)
- Classroom assignments with generic names
- Very old projects with no recent activity

**Repository Data:**
${projectsJson}

Select exactly 7 UNIQUE projects. Respond ONLY with a JSON array of project names:
["name1", "name2", "name3", "name4", "name5", "name6", "name7"]`;

  try {
    const raw = await callGroq(
      'You are a technical recruiter. Select top GitHub projects. Return ONLY a JSON array of names, no other text.',
      selectionPrompt,
      512
    );
    const names = JSON.parse(extractJson(raw));
    const nameSet = new Set(Array.isArray(names) ? names : []);
    const selected = pool.filter((p) => nameSet.has(p.name)).slice(0, 7);

    // Pad with remaining if LLM returned fewer than expected
    if (selected.length < 3) return pool.slice(0, 7);

    const nameList = selected.map((p) => p.name).join(', ');
    console.log(`✅ LLM selected ${selected.length} top projects: ${nameList}`);
    return selected;
  } catch {
    return pool.slice(0, 7);
  }
};

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

module.exports = {
  parseResumeToStructured,
  detectRoleType,
  buildResumeText,
  buildGithubText,
  buildNonTechProfileText,
  fetchNonTechProfiles,
  EVAL_SYSTEM_PROMPT_TECH,
  EVAL_SYSTEM_PROMPT_NONTECH,
  buildEvalUserPromptTech,
  buildEvalUserPromptNonTech,
  validateScores,
  computeTotal,
  getBaseScore,
  extractGithubUsername,
  fetchGithubProfile,
  fetchAllRepos,
  selectTopProjects,
  callGroq,
  extractJson,
};
