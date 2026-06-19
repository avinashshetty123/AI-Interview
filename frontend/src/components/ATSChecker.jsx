import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, BarChart3, TrendingUp, Loader2, AlertCircle, CheckCircle2,
  RefreshCw, FileText, Zap, Briefcase, Code2, Star, Search,
  AlertTriangle, Lightbulb, Tag, LayoutTemplate, Circle, Sparkles
} from 'lucide-react';
import { apiUrl } from '../lib/api';

const PHASE_META = {
  file_parse: { label: 'Reading Resume', desc: 'Extracting text from file' },
  parse_basics: { label: 'Parsing Basic Info', desc: 'Name, email, contacts' },
  parse_work: { label: 'Parsing Work Experience', desc: 'Companies, roles, dates' },
  parse_education: { label: 'Parsing Education', desc: 'Degrees, institutions' },
  parse_skills: { label: 'Parsing Skills', desc: 'Professional competencies' },
  parse_projects: { label: 'Parsing Projects', desc: 'Professional projects' },
  role_detect: { label: 'Detecting Profession', desc: 'Identifying career field for accurate scoring' },
  ai_score: { label: 'AI Evaluation', desc: 'Professional ATS scoring from base 50' },
  validate: { label: 'Finalizing Results', desc: 'Computing final score' },
};

const PHASE_ORDER = Object.keys(PHASE_META);

const scoreColor = (pct) => {
  if (pct >= 80) return { bar: 'from-emerald-500 to-teal-500', text: 'text-emerald-400', light: 'bg-emerald-500/10 border-emerald-500/20' };
  if (pct >= 60) return { bar: 'from-blue-500 to-cyan-500', text: 'text-blue-400', light: 'bg-blue-500/10 border-blue-500/20' };
  if (pct >= 40) return { bar: 'from-amber-500 to-orange-500', text: 'text-amber-400', light: 'bg-amber-500/10 border-amber-500/20' };
  return { bar: 'from-rose-500 to-red-500', text: 'text-rose-400', light: 'bg-rose-500/10 border-rose-500/20' };
};

const ScoreBar = ({ label, icon, improvement, max, evidence }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    let current = 0;
    const target = improvement;
    const increment = target / 20;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedValue(target);
        clearInterval(timer);
      } else {
        setAnimatedValue(current);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [improvement]);

  const pct = Math.round((animatedValue / max) * 100);
  const c = scoreColor(pct);
  
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${c.light} border`}>
            {React.createElement(icon, { className: 'w-4 h-4 text-slate-300' })}
          </div>
          <span className="text-sm font-semibold text-slate-200">{label}</span>
        </div>
        <span className={`text-sm font-bold ${c.text} tabular-nums`}>+{Math.round(animatedValue)}/{max}</span>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner">
        <div 
          className={`bg-gradient-to-r ${c.bar} h-full rounded-full transition-all duration-500 ease-out shadow-lg`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
      {evidence && <p className="text-xs text-slate-400 leading-relaxed mt-2">{evidence}</p>}
    </div>
  );
};

const ListSection = ({ title, icon, items, colorClass, bulletColor }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!items?.length) return null;
  
  return (
    <div className={`border rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/30 ${colorClass}`}>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between cursor-pointer group"
      >
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          {React.createElement(icon, { className: 'w-4 h-4 transition-transform' })} {title}
        </h3>
        <span className={`text-xs px-2 py-1 bg-black/20 rounded transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96 mt-3' : 'max-h-0'}`}>
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-slate-200 flex gap-2.5 animate-fadeIn" style={{ animationDelay: `${i * 50}ms` }}>
              <span className={`font-bold flex-shrink-0 ${bulletColor}`}>→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const PhaseTracker = ({ phases }) => (
  <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5 backdrop-blur-sm">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Evaluation Progress</p>
    <div className="space-y-2">
      {PHASE_ORDER.map((key, idx) => {
        const meta = PHASE_META[key];
        const phase = phases[key];
        const status = phase?.status || 'pending';
        const detail = phase?.detail || meta.desc;

        return (
          <div key={key} className="flex items-start gap-3 group">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                status === 'done' ? 'bg-emerald-500/30 border border-emerald-500/60 scale-110' :
                status === 'active' ? 'bg-blue-500/30 border border-blue-500/60 animate-pulse scale-105' :
                'bg-slate-700/50 border border-slate-600'
              }`}>
                {status === 'done' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : status === 'active' ? (
                  <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                ) : (
                  <Circle className="w-2.5 h-2.5 text-slate-600" />
                )}
              </div>
              {idx < PHASE_ORDER.length - 1 && (
                <div className={`w-0.5 mt-1 transition-all duration-700 ${
                  status === 'done' ? 'bg-emerald-500/40 h-5' : 'bg-slate-700/50 h-5'
                }`} />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium transition-colors ${
                  status === 'done' ? 'text-emerald-300' :
                  status === 'active' ? 'text-blue-300' : 'text-slate-500'
                }`}>{meta.label}</span>
                {status === 'active' && (
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full animate-pulse">analyzing</span>
                )}
              </div>
              <p className={`text-xs mt-0.5 leading-relaxed transition-colors ${
                status === 'pending' ? 'text-slate-600' : 'text-slate-400'
              }`}>{detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default function ATSChecker() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [phases, setPhases] = useState({});
  const [dragActive, setDragActive] = useState(false);

  const updatePhase = (phase, status, detail) =>
    setPhases(prev => ({ ...prev, [phase]: { status, detail } }));

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a resume file');

    setLoading(true);
    setError(null);
    setEvaluation(null);
    setPhases({});

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch(apiUrl('/ats/evaluate-resume'), {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMsg = 'Request failed';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const err = await response.json();
            errorMsg = err.error || err.message || errorMsg;
          }
        } catch (e) {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let hasResult = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (!hasResult) throw new Error('Stream ended without result');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const msg = JSON.parse(line.slice(6));
              if (msg.type === 'phase') {
                updatePhase(msg.phase, msg.status, msg.detail);
              } else if (msg.type === 'result') {
                setEvaluation(msg);
                setLoading(false);
                hasResult = true;
              } else if (msg.type === 'error') {
                throw new Error(msg.error);
              }
            } catch (parseErr) {
              if (parseErr.message && !parseErr.message.includes('Unexpected end')) {
                throw parseErr;
              }
            }
          }
        }
      } finally {
        reader.cancel();
      }
    } catch (err) {
      console.error('ATS Error:', err);
      setError(err.message || 'Failed to evaluate resume');
      setLoading(false);
    }
  };

  const reset = () => {
    setEvaluation(null);
    setFile(null);
    setPhases({});
    setError(null);
  };

  const mainScore = evaluation?.totalScore ?? 0;
  const mc = scoreColor(mainScore);
  const showPhaseTracker = loading || (Object.keys(phases).length > 0 && !evaluation);

  const SCORE_CATEGORIES = [
    { key: 'experience_quality', label: 'Experience Quality', icon: Briefcase, max: 15 },
    { key: 'skill_relevance', label: 'Skill Relevance', icon: Star, max: 15 },
    { key: 'achievement_metrics', label: 'Achievement Metrics', icon: TrendingUp, max: 12 },
    { key: 'presentation_quality', label: 'Presentation Quality', icon: FileText, max: 10 },
    { key: 'completeness', label: 'Completeness', icon: CheckCircle2, max: 8 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <header className="border-b border-slate-700/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Resume Evaluator
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">Professional ATS scoring for any career</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 flex items-center gap-3 animate-slideIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-5">
            <form onSubmit={handleEvaluate} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300">
              <h2 className="text-lg font-semibold text-white mb-5">Upload Resume</h2>

              <label 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className="relative block cursor-pointer group"
              >
                <input type="file" accept=".pdf,.docx,.txt,.doc"
                  onChange={(e) => { setFile(e.target.files?.[0] || null); setError(null); }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className={`p-6 border-2 border-dashed rounded-lg transition-all duration-300 text-center ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-slate-600 group-hover:border-blue-500/50 group-hover:bg-slate-700/20'
                }`}>
                  <div className="flex justify-center mb-3">
                    <Upload className={`w-8 h-8 transition-all duration-300 ${
                      dragActive ? 'text-blue-400 scale-110' : 'text-slate-400 group-hover:text-blue-400'
                    }`} />
                  </div>
                  <p className="text-sm font-medium text-slate-300">{file ? file.name : 'Drop or click to upload'}</p>
                  <p className="text-xs text-slate-500 mt-1">PDF · DOCX · TXT · max 10MB</p>
                </div>
              </label>

              <button type="submit" disabled={loading || !file}
                className="w-full mt-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group hover:shadow-lg hover:shadow-blue-500/20">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</> : <><Zap className="w-4 h-4 group-hover:scale-110 transition-transform" /> Evaluate</>}
              </button>
            </form>

            {showPhaseTracker && <PhaseTracker phases={phases} />}

            {!loading && !evaluation && Object.keys(phases).length === 0 && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-5 space-y-3 text-xs text-slate-400 backdrop-blur-sm">
                <p className="font-semibold text-slate-300 text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> What We Check
                </p>
                {[
                  ['💼', 'Experience progression & depth'],
                  ['🎯', 'Relevant skills for your role'],
                  ['📊', 'Quantified results & impact'],
                  ['✍️', 'Professional presentation'],
                  ['✅', 'Complete section coverage'],
                ].map(([icon, text]) => (
                  <p key={text} className="flex items-start gap-2.5 hover:text-slate-300 transition-colors"><span className="text-base">{icon}</span><span>{text}</span></p>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {!evaluation && !loading && Object.keys(phases).length === 0 && (
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-800/20 border border-slate-700/30 rounded-lg p-12 text-center backdrop-blur-sm">
                <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-lg inline-block mb-5">
                  <FileText className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Get Professional Feedback</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  Upload your resume to get detailed ATS scoring with actionable insights for improvement.
                </p>
              </div>
            )}

            {loading && (
              <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-12 text-center backdrop-blur-sm">
                <div className="inline-block mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-1 bg-slate-900 rounded-full" />
                  </div>
                </div>
                <p className="text-slate-200 font-semibold mb-1">Analyzing your resume</p>
                <p className="text-slate-400 text-sm">This usually takes 30-60 seconds</p>
              </div>
            )}

            {evaluation && (
              <div className="space-y-6 animate-slideIn">
                <div className={`bg-gradient-to-br ${mc.bar} rounded-lg p-8 text-white shadow-2xl relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    }} />
                  </div>
                  
                  <div className="relative flex items-end justify-between">
                    <div>
                      <p className="text-white/70 text-sm font-medium mb-2">Professional Score</p>
                      <p className="text-6xl font-black leading-none">
                        {evaluation.totalScore}
                        <span className="text-3xl">/100</span>
                      </p>
                      <p className="text-white/70 text-sm mt-4 flex items-center gap-2">
                        {mainScore >= 80 ? '🎉 Excellent Resume' : mainScore >= 60 ? '✓ Good Profile' : mainScore >= 40 ? '⚠ Needs Work' : '❌ Requires Major Updates'}
                      </p>
                    </div>
                    <div className="text-right text-white/60 text-sm space-y-2">
                      <p>
                        <span className="text-base font-semibold text-white/90">Career Field</span><br/>
                        <span className="text-xl capitalize font-bold text-white">{evaluation.jobRole || 'General'}</span>
                      </p>
                      <div className="text-xs pt-3 border-t border-white/20">
                        <p>Base: {evaluation.baseScore || 50}</p>
                        {evaluation.bonuses?.total > 0 && <p className="text-emerald-200">+{evaluation.bonuses.total} bonus</p>}
                        {evaluation.deductions?.total > 0 && <p className="text-rose-200">-{evaluation.deductions.total} deductions</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Score Breakdown</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SCORE_CATEGORIES.map(({ key, label, icon, max }, idx) => (
                      <div key={key} style={{ animationDelay: `${idx * 50}ms` }} className="animate-slideIn">
                        <ScoreBar label={label} icon={icon}
                          improvement={evaluation.scoreBreakdown?.[key]?.improvement ?? 0}
                          max={max}
                          evidence={evaluation.scoreBreakdown?.[key]?.evidence} />
                      </div>
                    ))}
                  </div>
                </div>

                {(evaluation.bonuses?.total > 0 || evaluation.deductions?.total > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evaluation.bonuses?.total > 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 hover:border-emerald-500/40 transition-all">
                        <p className="text-emerald-400 font-semibold text-sm mb-1">⭐ Bonus Points: +{evaluation.bonuses.total}</p>
                        <p className="text-xs text-slate-400">{evaluation.bonuses.breakdown}</p>
                      </div>
                    )}
                    {evaluation.deductions?.total > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 hover:border-rose-500/40 transition-all">
                        <p className="text-rose-400 font-semibold text-sm mb-1">⚠ Deductions: -{evaluation.deductions.total}</p>
                        <p className="text-xs text-slate-400">{evaluation.deductions.reasons}</p>
                      </div>
                    )}
                  </div>
                )}

                <ListSection title="Key Strengths" icon={CheckCircle2} items={evaluation.strengths}
                  colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-200" bulletColor="text-emerald-400" />
                <ListSection title="Areas for Improvement" icon={TrendingUp} items={evaluation.improvements}
                  colorClass="bg-amber-500/10 border-amber-500/20 text-amber-200" bulletColor="text-amber-400" />
                <ListSection title="Actionable Recommendations" icon={Lightbulb} items={evaluation.actionable_recommendations}
                  colorClass="bg-blue-500/10 border-blue-500/20 text-blue-200" bulletColor="text-blue-400" />

                <button onClick={reset}
                  className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group hover:shadow-lg hover:shadow-slate-900/30">
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> Evaluate Another Resume
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
