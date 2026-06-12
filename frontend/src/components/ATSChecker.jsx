import React, { useState, useRef } from 'react';
import {
  Upload, BarChart3, TrendingUp, Loader2, AlertCircle, CheckCircle2,
  RefreshCw, FileText, Zap, Briefcase, Code2, Star, GitBranch,
  AlertTriangle, Lightbulb, Tag, LayoutTemplate, Circle, GitCommit,
  Search, Brain, PackageCheck, Filter, Cpu
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api').replace(/\/$/, '');

// Phase metadata — order matters, this is the sequential display order
const PHASE_META = {
  file_parse:      { label: 'Reading Resume File',          icon: FileText,    desc: 'Extracting raw text from uploaded file' },
  parse_basics:    { label: 'Parsing Basic Info',           icon: FileText,    desc: 'Name, email, phone, profiles, summary' },
  parse_work:      { label: 'Parsing Work Experience',      icon: Briefcase,   desc: 'Companies, roles, dates, achievements' },
  parse_education: { label: 'Parsing Education',            icon: GitCommit,   desc: 'Institutions, degrees, scores' },
  parse_skills:    { label: 'Parsing Skills',               icon: Cpu,         desc: 'Languages, frameworks, tools' },
  parse_projects:  { label: 'Parsing Projects',             icon: Code2,       desc: 'Project names, descriptions, URLs, tech stack' },
  parse_awards:    { label: 'Parsing Awards & Certs',       icon: Star,        desc: 'Achievements, certifications, honors' },
  role_detect:     { label: 'Detecting Role Type',          icon: Search,      desc: 'Tech vs non-tech — determines scoring criteria & checks' },
  github_detect:   { label: 'Detecting GitHub URL',         icon: GitBranch,   desc: '[Tech only] Scanning for GitHub profile link' },
  github_profile:  { label: 'Fetching GitHub Profile',      icon: GitBranch,   desc: '[Tech only] Profile stats, repo count, followers' },
  github_repos:    { label: 'Fetching All Repositories',    icon: GitCommit,   desc: '[Tech only] Commit counts & contributor data per repo' },
  github_select:   { label: 'Selecting Top Projects',       icon: Filter,      desc: '[Tech only] AI picking 7 most impressive repos' },
  profile_check:   { label: 'Validating Profile Links',     icon: Search,      desc: '[Non-tech only] Checking LinkedIn, portfolio, blog links' },
  build_context:   { label: 'Building Evaluation Context',  icon: PackageCheck,desc: 'Combining structured resume + enrichment data' },
  ai_score:        { label: 'AI Deep Scoring',              icon: Brain,       desc: 'Role-specific dimensions + bonus/deductions' },
  validate:        { label: 'Validating & Finalising',      icon: Cpu,         desc: 'Enforcing score caps, computing final percentage' },
};

const PHASE_ORDER = Object.keys(PHASE_META);

const scoreColor = (pct) => {
  if (pct >= 80) return { bar: 'from-emerald-500 to-teal-500', text: 'text-emerald-400' };
  if (pct >= 60) return { bar: 'from-blue-500 to-cyan-500',    text: 'text-blue-400' };
  if (pct >= 40) return { bar: 'from-amber-500 to-orange-500', text: 'text-amber-400' };
  return             { bar: 'from-rose-500 to-red-500',         text: 'text-rose-400' };
};

const ScoreBar = ({ label, icon, score, max, evidence }) => {
  const pct = Math.round((score / max) * 100);
  const c = scoreColor(pct);
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {React.createElement(icon, { className: 'w-4 h-4 text-slate-400' })}
          <span className="text-sm font-semibold text-slate-200">{label}</span>
        </div>
        <span className={`text-sm font-bold ${c.text}`}>{score}/{max}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
        <div className={`bg-gradient-to-r ${c.bar} h-full rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      {evidence && <p className="text-xs text-slate-400 leading-relaxed">{evidence}</p>}
    </div>
  );
};

const ListSection = ({ title, icon, items, colorClass, bulletColor }) => {
  if (!items?.length) return null;
  return (
    <div className={`border rounded-2xl p-5 ${colorClass}`}>
      <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
        {React.createElement(icon, { className: 'w-4 h-4' })} {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-300 flex gap-2">
            <span className={`font-bold flex-shrink-0 ${bulletColor}`}>→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Sequential phase tracker UI
const PhaseTracker = ({ phases }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-1">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Evaluation Progress</p>
    {PHASE_ORDER.map((key, idx) => {
      const meta = PHASE_META[key];
      const phase = phases[key];
      const status = phase?.status || 'pending';
      const detail = phase?.detail || meta.desc;
      const Icon = meta.icon;

      return (
        <div key={key} className="flex items-start gap-3 py-2">
          {/* connector line */}
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
              status === 'done'   ? 'bg-emerald-500/20 border border-emerald-500/50' :
              status === 'active' ? 'bg-blue-500/20 border border-blue-500/60 animate-pulse' :
                                    'bg-slate-700/50 border border-slate-600'
            }`}>
              {status === 'done' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : status === 'active' ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              ) : (
                <Circle className="w-3 h-3 text-slate-600" />
              )}
            </div>
            {idx < PHASE_ORDER.length - 1 && (
              <div className={`w-px flex-1 mt-1 transition-all duration-500 ${
                status === 'done' ? 'bg-emerald-500/30 h-4' : 'bg-slate-700 h-4'
              }`} />
            )}
          </div>

          {/* content */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${
                status === 'done' ? 'text-emerald-400' :
                status === 'active' ? 'text-blue-400' : 'text-slate-600'
              }`} />
              <span className={`text-sm font-medium ${
                status === 'done' ? 'text-slate-200' :
                status === 'active' ? 'text-blue-300' : 'text-slate-500'
              }`}>{meta.label}</span>
              {status === 'active' && (
                <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">running</span>
              )}
              {status === 'done' && (
                <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">done</span>
              )}
            </div>
            <p className={`text-xs mt-0.5 leading-relaxed truncate ${
              status === 'pending' ? 'text-slate-600' : 'text-slate-400'
            }`}>{detail}</p>
          </div>
        </div>
      );
    })}
  </div>
);

export default function ATSChecker() {
  const [file, setFile] = useState(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [phases, setPhases] = useState({});
  const readerRef = useRef(null);

  const updatePhase = (phase, status, detail) =>
    setPhases(prev => ({ ...prev, [phase]: { status, detail } }));

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a resume file');

    setLoading(true);
    setError(null);
    setEvaluation(null);
    setPhases({});

    const formData = new FormData();
    formData.append('resume', file);
    if (githubUrl.trim()) formData.append('github_url', githubUrl.trim());

    try {
      const response = await fetch(`${API_URL}/ats/evaluate-resume`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Request failed');
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const msg = JSON.parse(line.slice(6));
            if (msg.type === 'phase') {
              updatePhase(msg.phase, msg.status, msg.detail);
            } else if (msg.type === 'result') {
              setEvaluation(msg);
              setLoading(false);
            } else if (msg.type === 'error') {
              throw new Error(msg.error);
            }
          } catch (parseErr) {
            if (parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to evaluate resume');
      setLoading(false);
    }
  };

  const reset = () => {
    setEvaluation(null);
    setFile(null);
    setGithubUrl('');
    setPhases({});
    setError(null);
  };

  const mainScore = evaluation?.score ?? 0;
  const mc = scoreColor(mainScore);

  const SCORE_CATEGORIES_TECH = [
    { key: 'open_source',      label: 'Open Source',        icon: GitBranch, max: 35 },
    { key: 'self_projects',    label: 'Self Projects',       icon: Code2,     max: 30 },
    { key: 'production',       label: 'Production / Work',   icon: Briefcase, max: 25 },
    { key: 'technical_skills', label: 'Technical Skills',    icon: Star,      max: 10 },
  ];

  const SCORE_CATEGORIES_NONTECH = [
    { key: 'work_experience',     label: 'Work Experience',     icon: Briefcase, max: 35 },
    { key: 'skills_and_tools',    label: 'Skills & Tools',      icon: Star,      max: 25 },
    { key: 'projects_and_impact', label: 'Projects & Impact',   icon: Code2,     max: 25 },
    { key: 'education_and_certs', label: 'Education & Certs',   icon: GitCommit, max: 15 },
  ];

  const SCORE_CATEGORIES = evaluation?.roleType === 'non-tech'
    ? SCORE_CATEGORIES_NONTECH
    : SCORE_CATEGORIES_TECH;

  const showPhaseTracker = loading || (Object.keys(phases).length > 0 && !evaluation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ATS Deep Evaluator
              </h1>
              <p className="text-slate-400 text-xs">Real GitHub analysis · Strict scoring · Actionable feedback</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel */}
          <div className="lg:col-span-1 space-y-5">
            <form onSubmit={handleEvaluate} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-5">Upload Resume</h2>

              <label className="relative block cursor-pointer group mb-5">
                <input type="file" accept=".pdf,.docx,.txt,.doc"
                  onChange={(e) => { setFile(e.target.files?.[0] || null); setError(null); }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="p-6 border-2 border-dashed border-slate-600 rounded-xl group-hover:border-blue-500 group-hover:bg-slate-700/30 transition-all text-center">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
                  <p className="text-sm font-medium text-slate-300">{file ? file.name : 'Drop or click to upload'}</p>
                  <p className="text-xs text-slate-500 mt-1">PDF · DOCX · TXT · max 10MB</p>
                </div>
              </label>

              {/* GitHub URL override — auto-detected from resume, manual entry disabled
              <div className="mb-5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
                  <GitBranch className="w-4 h-4" /> GitHub URL
                  <span className="text-xs text-slate-500 font-normal">(optional override)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Auto-detected from resume for tech roles. Only needed if your GitHub URL isn't on your resume.
                </p>
              </div>
              */}

              <button type="submit" disabled={loading || !file}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</> : <><Zap className="w-4 h-4" /> Deep Evaluate</>}
              </button>
            </form>

            {/* Phase tracker — shows during loading */}
            {showPhaseTracker && <PhaseTracker phases={phases} />}

            {/* Static info — only when idle */}
            {!loading && !evaluation && Object.keys(phases).length === 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-2 text-xs text-slate-400">
                <p className="font-semibold text-slate-300 text-sm mb-3">What we check:</p>
                {[
                  ['🔓', 'Open source contributions (real GitHub commits)'],
                  ['🚀', 'Project quality & complexity'],
                  ['💼', 'Work experience & internships'],
                  ['⚙️', 'Technical skills breadth'],
                  ['⭐', 'Bonuses: GSoC, portfolio, blogs, LeetCode'],
                  ['🔑', 'Missing ATS keywords'],
                  ['📋', 'Resume format issues'],
                  ['📌', 'Actionable fix recommendations'],
                ].map(([icon, text]) => (
                  <p key={text} className="flex items-start gap-2"><span>{icon}</span><span>{text}</span></p>
                ))}
                <p className="text-slate-500 pt-2 border-t border-slate-700">⏱ With GitHub: ~1-3 min</p>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2">
            {!evaluation && !loading && Object.keys(phases).length === 0 && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center">
                <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl inline-block mb-5">
                  <FileText className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">Ready for Deep Analysis</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  Upload your resume and optionally add your GitHub URL for a thorough evaluation with real commit-level data.
                </p>
              </div>
            )}

            {/* Loading placeholder in right panel */}
            {loading && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-200 font-semibold mb-1">Deep evaluation in progress</p>
                <p className="text-slate-400 text-sm">Watch the progress tracker on the left</p>
              </div>
            )}

            {evaluation && (
              <div className="space-y-5">
                {/* Main Score */}
                <div className={`bg-gradient-to-br ${mc.bar} rounded-2xl p-7 text-white shadow-2xl`}>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/70 text-sm mb-1">ATS Match Score</p>
                      <p className="text-7xl font-black leading-none">{mainScore}%</p>
                      <p className="text-white/70 text-sm mt-3">
                        Raw: {evaluation.totalScore} / {evaluation.maxScore} pts
                        {evaluation.bonus_points?.total > 0 && ` · Bonus: +${evaluation.bonus_points.total}`}
                        {evaluation.deductions?.total > 0 && ` · Deductions: -${evaluation.deductions.total}`}
                      </p>
                    </div>
                    <div className="text-right text-white/60 text-sm space-y-1">
                      <p>{mainScore >= 80 ? '🎉 Excellent' : mainScore >= 60 ? '✓ Good' : mainScore >= 40 ? '⚠ Fair' : '❌ Needs Work'}</p>
                      <p className="text-xs px-2 py-0.5 rounded-full inline-block" style={{background:'rgba(255,255,255,0.15)'}}>
                        {evaluation.roleType === 'non-tech' ? '🎯 Non-Technical' : '💻 Technical'}
                      </p>
                      {evaluation.github_analyzed && (
                        <p className="text-xs">
                          @{evaluation.github_analyzed.username} · {evaluation.github_analyzed.totalProjectsAnalyzed} repos · {evaluation.github_analyzed.topProjectsSelected} analyzed
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Score Breakdown</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SCORE_CATEGORIES.map(({ key, label, icon, max }) => (
                      <ScoreBar key={key} label={label} icon={icon}
                        score={evaluation.scores?.[key]?.score ?? 0}
                        max={max}
                        evidence={evaluation.scores?.[key]?.evidence} />
                    ))}
                  </div>
                </div>

                {/* Bonus & Deductions */}
                {(evaluation.bonus_points?.total > 0 || evaluation.deductions?.total > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evaluation.bonus_points?.total > 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <p className="text-emerald-400 font-bold text-sm mb-1">⭐ Bonus: +{evaluation.bonus_points.total}</p>
                        <p className="text-xs text-slate-400">{evaluation.bonus_points.breakdown}</p>
                      </div>
                    )}
                    {evaluation.deductions?.total > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
                        <p className="text-rose-400 font-bold text-sm mb-1">⚠ Deductions: -{evaluation.deductions.total}</p>
                        <p className="text-xs text-slate-400">{evaluation.deductions.reasons}</p>
                      </div>
                    )}
                  </div>
                )}

                <ListSection title="Actionable Recommendations" icon={Lightbulb} items={evaluation.actionable_recommendations}
                  colorClass="bg-blue-500/10 border-blue-500/30 text-blue-400" bulletColor="text-blue-400" />
                <ListSection title="Key Strengths" icon={CheckCircle2} items={evaluation.strengths}
                  colorClass="bg-emerald-500/10 border-emerald-500/30 text-emerald-400" bulletColor="text-emerald-400" />
                <ListSection title="Areas for Improvement" icon={TrendingUp} items={evaluation.improvements}
                  colorClass="bg-amber-500/10 border-amber-500/30 text-amber-400" bulletColor="text-amber-400" />

                {evaluation.ats_keywords_missing?.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-purple-400" /> Missing ATS Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {evaluation.ats_keywords_missing.map((kw, i) => (
                        <span key={i} className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full text-xs">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {evaluation.resume_format_issues?.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-orange-400" /> Resume Format Issues
                    </h3>
                    <ul className="space-y-1.5">
                      {evaluation.resume_format_issues.map((issue, i) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button onClick={reset}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Evaluate Another Resume
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
