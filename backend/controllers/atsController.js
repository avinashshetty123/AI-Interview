const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const {
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
} = require('../utils/atsService');

const send = (res, payload) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
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

const PHASE_META = {
  file_parse: { label: 'Reading Resume', desc: 'Extracting text from file' },
  parse_basics: { label: 'Parsing Basic Info', desc: 'Name, email, contacts' },
  parse_work: { label: 'Parsing Work Experience', desc: 'Companies, roles, dates' },
  parse_education: { label: 'Parsing Education', desc: 'Degrees, institutions' },
  parse_skills: { label: 'Parsing Skills', desc: 'Professional competencies' },
  parse_projects: { label: 'Parsing Projects', desc: 'Professional projects' },
  role_detect: { label: 'Detecting Profession', desc: 'Identifying career field' },
  ai_score: { label: 'AI Evaluation', desc: 'Professional ATS scoring from base 50' },
  validate: { label: 'Finalizing Results', desc: 'Computing final score' },
};

const PHASE_ORDER = Object.keys(PHASE_META);

exports.evaluateResumePublic = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.flushHeaders();

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
    if (typeof res.flush === 'function') res.flush();
    else if (res.socket) res.socket.uncork?.();
  }, 5000);
  res.on('close', () => clearInterval(heartbeat));

  try {
    if (!req.file) return sendError(res, 'No resume file provided');
    console.log(`[ATS] START — file: ${req.file?.originalname}`);

    // Phase: Parse file
    sendPhase(res, 'file_parse', 'active', `Reading ${req.file.originalname}`);
    let rawText = '';
    const mime = req.file.mimetype;

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

    const charCount = rawText.length;
    const lineCount = rawText.split('\n').filter(Boolean).length;
    console.log(`[ATS] Extracted: ${lineCount} lines, ${charCount} chars`);
    sendPhase(res, 'file_parse', 'done', `✓ ${charCount} characters extracted`);

    // Phase: Parse resume structure
    const sectionKeys = ['basics', 'work', 'education', 'skills', 'projects'];
    sectionKeys.forEach((k) => sendPhase(res, `parse_${k}`, 'pending', PHASE_META[`parse_${k}`]?.desc || ''));

    console.log('[ATS] Parsing resume structure...');
    const structured = await parseResumeToStructured(
      rawText,
      (section) => sendPhase(res, `parse_${section}`, 'active', PHASE_META[`parse_${section}`]?.desc || ''),
      (section) => sendPhase(res, `parse_${section}`, 'done', `✓ ${section} parsed`)
    );

    console.log('[ATS] Parsed sections:', Object.keys(structured));

    // Phase: Detect job role with better accuracy
    sendPhase(res, 'role_detect', 'active', 'Detecting profession from resume');
    const resumeText = buildResumeText(structured);
    const jobRole = await detectJobRole(resumeText);
    console.log(`[ATS] Detected profession: ${jobRole}`);
    sendPhase(res, 'role_detect', 'done', `✓ Detected: ${jobRole}`);

    // Phase: AI Scoring
    sendPhase(res, 'ai_score', 'active', 'Running professional ATS evaluation from base 50');
    console.log(`[ATS] Resume text built: ${resumeText.length} chars`);
    console.log(`[ATS] Using extracted metrics for accurate scoring`);

    const raw = await callGroq(EVAL_SYSTEM_PROMPT, buildEvalPrompt(resumeText, jobRole, structured), 2048, 'eval:professional');
    console.log(`[ATS] AI response: ${raw?.length ?? 0} chars`);
    sendPhase(res, 'ai_score', 'done', 'AI evaluation complete');

    // Phase: Validate
    sendPhase(res, 'validate', 'active', 'Computing final score');
    const jsonStr = extractJson(raw);
    if (!jsonStr) return sendError(res, 'Failed to parse AI response');

    const parsed = JSON.parse(jsonStr);
    const validated = validateScores(parsed);
    const totalScore = computeTotal(validated);
    const baseScore = getBaseScore();

    console.log(`[ATS] FINAL — profession=${jobRole} base=${baseScore} total=${totalScore}/100`);
    sendPhase(res, 'validate', 'done', `✓ Final score: ${totalScore}/100`);

    // Send result
    sendResult(res, {
      success: true,
      score: totalScore,
      totalScore,
      maxScore: 100,
      baseScore: baseScore,
      jobRole,
      scoreBreakdown: validated.score_breakdown,
      bonuses: validated.bonuses,
      deductions: validated.deductions,
      strengths: validated.key_strengths,
      improvements: validated.areas_for_improvement,
      actionable_recommendations: validated.actionable_recommendations,
      content_analysis: {
        total_characters: charCount,
        total_lines: lineCount,
        work_experience: structured.work?.length || 0,
        education: structured.education?.length || 0,
        skills: structured.skills?.length || 0,
        projects: structured.projects?.length || 0,
      },
    });
  } catch (error) {
    console.error('[ATS] ERROR:', error.message);
    sendError(res, error.message || 'Failed to evaluate resume');
  }
};
