const ATSEvaluation = require('../models/ATSEvaluation');
const Resume = require('../models/Resume');
const {
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
  fetchGithubProfile,
  fetchAllRepos,
  selectTopProjects,
  callGroq,
  extractJson,
} = require('../utils/atsService');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// ─── SSE HELPERS ──────────────────────────────────────────────────────────────

const send = (res, payload) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  // res.flush exists when compression middleware is active; socket.drain works always
  if (typeof res.flush === 'function') res.flush();
  else if (res.socket) res.socket.uncork?.();
};

const sendPhase = (res, phase, status, detail = '') =>
  send(res, { type: 'phase', phase, status, detail });

const sendResult = (res, data) => {
  send(res, { type: 'result', ...data });
  res.end();
};

const sendError = (res, message) => {
  send(res, { type: 'error', error: message });
  res.end();
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const SECTION_LABELS = {
  basics:    'Extracting basic info (name, email, profiles)',
  work:      'Extracting work experience',
  education: 'Extracting education',
  skills:    'Extracting skills',
  projects:  'Extracting projects',
  awards:    'Extracting awards & certifications',
};

const extractGithubUrlFromText = (text) => {
  const m = text.match(/https?:\/\/github\.com\/[^\s\/>\"'#]+/i);
  return m ? m[0] : null;
};

// ─── PUBLIC ENDPOINT — SSE STREAMING ─────────────────────────────────────────

exports.evaluateResumePublic = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Heartbeat — sends a comment line every 5s so the browser knows the connection is alive
  // This also forces the TCP buffer to drain between long Groq calls
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
    if (typeof res.flush === 'function') res.flush();
    else if (res.socket) res.socket.uncork?.();
  }, 5000);
  res.on('close', () => clearInterval(heartbeat));

  try {
    if (!req.file) return sendError(res, 'No resume file provided');
    console.log(`[ATS] evaluateResumePublic START — file: ${req.file?.originalname} (${req.file?.size} bytes)`);

    // ── Phase: Read file ───────────────────────────────────────────────────────
    sendPhase(res, 'file_parse', 'active', `Reading ${req.file.originalname}`);
    let rawText = '';
    const mime = req.file.mimetype;
    console.log(`[ATS] MIME type: ${mime}`);
    if (mime === 'application/pdf') {
      rawText = (await pdfParse(req.file.buffer)).text;
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      rawText = (await mammoth.extractRawText({ buffer: req.file.buffer })).value;
    } else if (mime === 'text/plain') {
      rawText = req.file.buffer.toString('utf-8');
    } else {
      return sendError(res, 'Unsupported file type. Use PDF, DOCX, or TXT.');
    }
    if (!rawText.trim()) return sendError(res, 'Could not extract text from resume');
    console.log(`[ATS] Extracted text: ${rawText.split('\n').filter(Boolean).length} lines, ${rawText.length} chars`);
    sendPhase(res, 'file_parse', 'done',
      `Extracted ${rawText.split('\n').filter(Boolean).length} lines from ${req.file.originalname}`);

    // ── Phase: Section-by-section structured parsing ───────────────────────────
    console.log('[ATS] Starting parseResumeToStructured...');
    const sectionKeys = Object.keys(SECTION_LABELS);
    sectionKeys.forEach((k) => sendPhase(res, `parse_${k}`, 'pending', SECTION_LABELS[k]));

    const structured = await parseResumeToStructured(
      rawText,
      (section) => {
        // fired BEFORE the LLM call — mark this section active
        sendPhase(res, `parse_${section}`, 'active', SECTION_LABELS[section]);
      },
      (section) => {
        // fired AFTER the LLM call returns — tick it done immediately
        const label = section.charAt(0).toUpperCase() + section.slice(1);
        sendPhase(res, `parse_${section}`, 'done', `✓ ${label} extracted`);
      }
    );
    console.log('[ATS] parseResumeToStructured complete. Keys:', Object.keys(structured));

    // ── Phase: Role detection ──────────────────────────────────────────────────
    sendPhase(res, 'role_detect', 'active', 'Detecting role type (tech vs non-tech)');
    const roleType = await detectRoleType(structured);
    console.log(`[ATS] Role type detected: ${roleType}`);
    sendPhase(res, 'role_detect', 'done',
      `Detected: ${roleType === 'tech' ? '💻 Technical role' : '🎯 Non-technical role'} — using appropriate scoring criteria`
    );

    const resumeText = buildResumeText(structured);
    let extraContext = '';
    let githubData = null;

    if (roleType === 'tech') {
      console.log('[ATS] Tech path: starting GitHub analysis');
      // ── Tech path: GitHub analysis ─────────────────────────────────────────
      // Explicit override > auto-detect from parsed profiles > scan raw text
      const githubProfile = structured.basics?.profiles?.find((p) =>
        p.network?.toLowerCase().includes('github') || p.url?.toLowerCase().includes('github.com')
      );
      const githubUrl = req.body.github_url?.trim()
        || githubProfile?.url
        || extractGithubUrlFromText(rawText)
        || null;

      if (!githubUrl) {
        console.log('[ATS] No GitHub URL found — skipping GitHub analysis');
        sendPhase(res, 'github_detect', 'done', 'No GitHub URL found in resume — open_source score will be limited');
      } else {
        console.log(`[ATS] GitHub URL: ${githubUrl}`);
        sendPhase(res, 'github_detect', 'active', `Scanning for GitHub URL`);
        sendPhase(res, 'github_detect', 'done', `Found: ${githubUrl}`);

        sendPhase(res, 'github_profile', 'active', 'Fetching GitHub profile & public repo count');
        const profile = await fetchGithubProfile(githubUrl);

        if (!profile) {
          console.log('[ATS] GitHub profile not accessible');
          sendPhase(res, 'github_profile', 'done', 'GitHub profile not accessible — continuing without GitHub data');
        } else {
          console.log(`[ATS] GitHub profile: @${profile.username}, ${profile.public_repos} repos`);
          sendPhase(res, 'github_profile', 'done',
            `@${profile.username} · ${profile.public_repos} public repos · ${profile.followers} followers`);

          sendPhase(res, 'github_repos', 'active', 'Fetching all repos with commit counts per repo (~30-90s)');
          const repos = await fetchAllRepos(githubUrl);
          console.log(`[ATS] fetchAllRepos returned ${repos.length} repos`);
          const osCount = repos.filter((r) => r.project_type === 'open_source').length;
          sendPhase(res, 'github_repos', 'done',
            `${repos.length} repos · ${osCount} open-source · ${repos.length - osCount} solo`);

          sendPhase(res, 'github_select', 'active', `AI selecting top 7 most impressive projects from ${repos.length}`);
          const topProjects = await selectTopProjects(repos);
          console.log(`[ATS] selectTopProjects returned ${topProjects.length} projects`);
          sendPhase(res, 'github_select', 'done',
            `Selected: ${topProjects.map((p) => p.name).join(', ')}`);

          githubData = { profile, projects: topProjects, total_projects: repos.length };
          extraContext = buildGithubText(githubData);
        }
      }
    } else {
      console.log('[ATS] Non-tech path: validating profile links');
      // ── Non-tech path: validate profile links ──────────────────────────────
      const profileCount = structured.basics?.profiles?.filter((p) => p.url).length || 0;

      if (profileCount === 0) {
        console.log('[ATS] No profile links found');
        sendPhase(res, 'profile_check', 'done', 'No profile links found in resume');
      } else {
        console.log(`[ATS] Checking ${profileCount} profile links`);
        sendPhase(res, 'profile_check', 'active',
          `Validating ${profileCount} profile link(s) (LinkedIn, portfolio, blog, etc.)`);
        const profileResults = await fetchNonTechProfiles(structured);
        console.log(`[ATS] Profile check results: ${JSON.stringify(profileResults.map(p => ({ url: p.url, accessible: p.accessible })))}`);
        const accessible = profileResults.filter((p) => p.accessible).length;
        const broken = profileResults.length - accessible;
        sendPhase(res, 'profile_check', 'done',
          `${profileResults.length} links checked · ${accessible} accessible · ${broken > 0 ? `${broken} broken` : 'all valid'}`);
        extraContext = buildNonTechProfileText(profileResults);
      }
    }

    // ── Phase: Build full evaluation context ───────────────────────────────────
    sendPhase(res, 'build_context', 'active',
      `Assembling ${roleType === 'tech' ? 'resume + GitHub data' : 'resume + profile validation'} for AI`);
    const fullEvalText = resumeText + extraContext;
    sendPhase(res, 'build_context', 'done',
      `Context ready · ${Math.round(fullEvalText.length / 1000)}k chars · ${roleType} scoring criteria`);
    console.log(`[ATS] Full eval context: ${fullEvalText.length} chars`);

    // ── Phase: AI deep scoring ─────────────────────────────────────────────────
    const scoringDims = roleType === 'tech'
      ? 'open_source · self_projects · production · technical_skills'
      : 'work_experience · skills_and_tools · projects_and_impact · education_and_certs';
    sendPhase(res, 'ai_score', 'active', `Running deep AI evaluation: ${scoringDims}`);

    const systemPrompt = roleType === 'tech' ? EVAL_SYSTEM_PROMPT_TECH : EVAL_SYSTEM_PROMPT_NONTECH;
    const userPrompt   = roleType === 'tech'
      ? buildEvalUserPromptTech(fullEvalText)
      : buildEvalUserPromptNonTech(fullEvalText);

    console.log(`[ATS] Calling Groq for AI scoring (roleType=${roleType})...`);
    const raw = await callGroq(systemPrompt, userPrompt, 4096, `eval:${roleType}`);
    console.log(`[ATS] AI scoring response length: ${raw?.length ?? 0}`);
    sendPhase(res, 'ai_score', 'done', 'AI scoring complete');

    // ── Phase: Validate & finalise ─────────────────────────────────────────────
    sendPhase(res, 'validate', 'active', 'Parsing scores, enforcing caps & deduction rules');
    const jsonStr = extractJson(raw);
    console.log(`[ATS] extractJson result: ${jsonStr ? jsonStr.substring(0, 100) + '...' : 'NULL'}`);
    if (!jsonStr) return sendError(res, 'AI returned unparseable response — please retry');

    const parsed    = JSON.parse(jsonStr);
    const validated = validateScores(parsed, roleType);
    const totalScore = computeTotal(validated);
    const baseScore  = getBaseScore(roleType);
    const matchPercentage = Math.round(Math.min(100, (totalScore / baseScore) * 100));
    console.log(`[ATS] FINAL — roleType=${roleType} total=${totalScore}/${baseScore} match=${matchPercentage}%`);

    sendPhase(res, 'validate', 'done',
      `Final score: ${totalScore}pts → ${matchPercentage}% match` +
      (validated.bonus_points.total > 0 ? ` (+${validated.bonus_points.total} bonus)` : '') +
      (validated.deductions.total > 0   ? ` (-${validated.deductions.total} deductions)` : '')
    );

    // ── Send result ────────────────────────────────────────────────────────────
    sendResult(res, {
      success: true,
      roleType,
      score: matchPercentage,
      totalScore,
      maxScore: baseScore,
      scores: validated.scores,
      bonus_points: validated.bonus_points,
      deductions: validated.deductions,
      strengths: validated.key_strengths,
      improvements: validated.areas_for_improvement,
      actionable_recommendations: validated.actionable_recommendations,
      ats_keywords_missing: validated.ats_keywords_missing,
      resume_format_issues: validated.resume_format_issues,
      github_analyzed: githubData ? {
        username: githubData.profile.username,
        publicRepos: githubData.profile.public_repos,
        totalProjectsAnalyzed: githubData.total_projects,
        topProjectsSelected: githubData.projects.length,
      } : null,
    });

  } catch (error) {
    console.error('[ATS] FATAL ERROR:', error.message, error.stack?.split('\n')[1]);
    sendError(res, error.message || 'Failed to evaluate resume');
  }
};

// ─── PROTECTED ENDPOINTS ──────────────────────────────────────────────────────

exports.evaluateResume = async (req, res) => {
  try {
    const { resumeId, jobTitle = 'General', githubUrl = null } = req.body;
    const userId = req.user._id;

    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const rawText  = resume.parsedData?._rawText || JSON.stringify(resume.parsedData);
    const structured = await parseResumeToStructured(rawText);
    const roleType   = await detectRoleType(structured);
    const resumeText = buildResumeText(structured);

    let extraContext = '';
    let githubData = null;

    if (roleType === 'tech' && githubUrl) {
      const [profile, repos] = await Promise.all([fetchGithubProfile(githubUrl), fetchAllRepos(githubUrl)]);
      if (profile) {
        const topProjects = await selectTopProjects(repos);
        githubData = { profile, projects: topProjects, total_projects: repos.length };
        extraContext = buildGithubText(githubData);
      }
    } else if (roleType === 'non-tech') {
      const profileResults = await fetchNonTechProfiles(structured);
      extraContext = buildNonTechProfileText(profileResults);
    }

    const fullText = resumeText + extraContext;
    const systemPrompt = roleType === 'tech' ? EVAL_SYSTEM_PROMPT_TECH : EVAL_SYSTEM_PROMPT_NONTECH;
    const userPrompt   = roleType === 'tech' ? buildEvalUserPromptTech(fullText) : buildEvalUserPromptNonTech(fullText);

    const raw        = await callGroq(systemPrompt, userPrompt, 4096);
    const parsed     = JSON.parse(extractJson(raw));
    const validated  = validateScores(parsed, roleType);
    const totalScore = computeTotal(validated);
    const baseScore  = getBaseScore(roleType);
    const matchPercentage = Math.round(Math.min(100, (totalScore / baseScore) * 100));

    const saved = new ATSEvaluation({
      userId, resumeId, jobTitle, jobRole: roleType,
      scores: validated.scores,
      bonus_points: validated.bonus_points,
      deductions: validated.deductions,
      keyStrengths: validated.key_strengths,
      areasForImprovement: validated.areas_for_improvement,
      actionableRecommendations: validated.actionable_recommendations,
      atsKeywordsMissing: validated.ats_keywords_missing,
      resumeFormatIssues: validated.resume_format_issues,
      totalScore, maxScore: baseScore, matchPercentage,
    });
    await saved.save();

    res.json({ success: true, evaluation: { id: saved._id, roleType, score: matchPercentage, totalScore, ...validated } });
  } catch (error) {
    console.error('ATS Evaluation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate resume' });
  }
};

exports.getEvaluationHistory = async (req, res) => {
  try {
    const evaluations = await ATSEvaluation.find({ userId: req.user._id })
      .sort({ evaluationDate: -1 }).limit(20);
    res.json({ success: true, evaluations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

exports.getDetailedEvaluation = async (req, res) => {
  try {
    const evaluation = await ATSEvaluation.findById(req.params.evaluationId);
    if (!evaluation || evaluation.userId.toString() !== req.user._id.toString())
      return res.status(404).json({ error: 'Evaluation not found' });
    res.json({ success: true, evaluation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch evaluation' });
  }
};

exports.compareEvaluations = async (req, res) => {
  try {
    const { eval1Id, eval2Id } = req.body;
    const uid = req.user._id.toString();
    const [e1, e2] = await Promise.all([ATSEvaluation.findById(eval1Id), ATSEvaluation.findById(eval2Id)]);
    if (!e1 || !e2 || e1.userId.toString() !== uid || e2.userId.toString() !== uid)
      return res.status(404).json({ error: 'Evaluation not found' });
    res.json({
      success: true,
      comparison: {
        eval1: { jobTitle: e1.jobTitle, matchPercentage: e1.matchPercentage, totalScore: e1.totalScore, roleType: e1.jobRole, scores: e1.scores },
        eval2: { jobTitle: e2.jobTitle, matchPercentage: e2.matchPercentage, totalScore: e2.totalScore, roleType: e2.jobRole, scores: e2.scores },
        improvement: { scoreDifference: e2.totalScore - e1.totalScore, percentageDifference: e2.matchPercentage - e1.matchPercentage },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare evaluations' });
  }
};

exports.getATSStats = async (req, res) => {
  try {
    const evaluations = await ATSEvaluation.find({ userId: req.user._id });
    const avg = (fn) => evaluations.length ? Math.round(evaluations.reduce((s, e) => s + fn(e), 0) / evaluations.length) : 0;
    res.json({
      success: true,
      stats: {
        totalEvaluations: evaluations.length,
        techCount: evaluations.filter((e) => e.jobRole === 'tech').length,
        nonTechCount: evaluations.filter((e) => e.jobRole === 'non-tech').length,
        averageMatchPercentage: avg((e) => e.matchPercentage),
        averageScore: avg((e) => e.totalScore),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
