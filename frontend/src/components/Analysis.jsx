import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import {
  FiAward, FiBarChart2, FiAlertTriangle, FiThumbsUp, FiTarget,
  FiFileText, FiInfo, FiPrinter, FiRefreshCw, FiChevronLeft,
  FiLoader, FiZap, FiXCircle, FiCheck
} from 'react-icons/fi'
import { apiUrl } from '../lib/api'

const Analysis = ({ sessionId, onBack, onReset }) => {
  const [analysis, setAnalysis]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [sessionData, setSessionData] = useState(null)

  useEffect(() => { fetchAnalysis(); fetchSessionData() }, [sessionId])

  const fetchSessionData = async () => {
    try {
      const res = await fetch(apiUrl(`/session/${sessionId}/qa`), { credentials: 'include' })
      const data = await res.json()
      if (data.success) setSessionData(data)
    } catch (e) { console.error(e) }
  }

  const fetchAnalysis = async () => {
    try {
      const res = await fetch(apiUrl(`/analysis/${sessionId}`), { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.success) { setAnalysis(data.analysis); setLoading(false); return }
      }
      const statusRes = await fetch(apiUrl(`/analysis-status/${sessionId}`), { credentials: 'include' })
      const statusData = await statusRes.json()
      if (!statusData.success || !statusData.canAnalyze) {
        setError('Cannot generate analysis. Complete the interview first.')
        setLoading(false); return
      }
      setError('Click "Generate Analysis" to create your report.')
      setLoading(false)
    } catch (e) {
      setError('Network error. Please ensure the backend is running.')
      setLoading(false)
    }
  }

  const generateNewAnalysis = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(apiUrl(`/analyze/${sessionId}`), { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (data.success) setAnalysis(data.analysis)
      else setError(data.error || 'Failed to generate analysis')
    } catch (e) { setError('Network error.') }
    finally { setLoading(false) }
  }

  const cleanText = (text) => {
    if (!text) return text
    const ta = document.createElement('textarea')
    ta.innerHTML = text
    return ta.value
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  }

  const getScoreColor = (s) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-blue-600' : s >= 40 ? 'text-yellow-600' : 'text-red-600'
  const getScoreBg    = (s) => s >= 80 ? 'from-green-500 to-green-600' : s >= 60 ? 'from-blue-500 to-blue-600' : s >= 40 ? 'from-yellow-500 to-yellow-600' : 'from-red-500 to-red-600'
  const getScoreLabel = (s) => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Improvement'

  const ScoreIcon = ({ score, size = 48 }) => {
    if (score >= 80) return <FiAward size={size} className="text-yellow-500" />
    if (score >= 60) return <FiThumbsUp size={size} className="text-blue-500" />
    if (score >= 40) return <FiBarChart2 size={size} className="text-yellow-500" />
    return <FiTarget size={size} className="text-red-500" />
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600
                        flex items-center justify-center shadow-xl animate-pulse">
          <FiZap size={44} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Analyzing Your Performance</h2>
        <p className="text-xl text-gray-600 mb-8">Our AI is reviewing your answers and generating personalized feedback...</p>
        <div className="flex items-center justify-center gap-3">
          <FiLoader size={28} className="text-purple-600 animate-spin" />
          <span className="text-purple-600 font-semibold text-lg">Processing Analysis...</span>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8 flex items-center justify-center">
      <div className="text-center max-w-lg">
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600
                        flex items-center justify-center shadow-xl">
          <FiBarChart2 size={44} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Analyze Your Performance?</h2>
        <p className="text-lg text-gray-600 mb-8">{error}</p>
        <div className="flex justify-center gap-4">
          <Button onClick={generateNewAnalysis} size="lg"
                  className="px-8 py-4 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
            <FiZap size={18} className="mr-2" /> Generate Analysis
          </Button>
          <Button onClick={onBack} size="lg" variant="outline">
            <FiChevronLeft size={18} className="mr-1" /> Back
          </Button>
        </div>
      </div>
    </div>
  )

  if (!analysis) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8 flex items-center justify-center">
      <div className="text-center">
        <FiXCircle size={64} className="text-red-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Analysis Not Available</h2>
        <p className="text-xl text-gray-600 mb-8">Unable to generate analysis for this session.</p>
        <Button onClick={onBack} size="lg" variant="outline"><FiChevronLeft size={18} className="mr-1" /> Back</Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <ScoreIcon score={analysis.overallScore} size={64} />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Interview Performance Analysis</h1>
            <p className="text-xl text-gray-600">AI-powered insights to help you improve your interview skills</p>
          </div>

          {/* Overall Score */}
          <Card className="mb-8 border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <FiAward size={24} /> Overall Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent className="p-12 text-center">
              <div className={`text-8xl font-bold mb-6 ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}/100
              </div>
              <Badge className={`text-xl px-6 py-3 bg-gradient-to-r ${getScoreBg(analysis.overallScore)} text-white font-semibold`}>
                {getScoreLabel(analysis.overallScore)}
              </Badge>
              <div className="mt-8 max-w-md mx-auto">
                <Progress value={analysis.overallScore} className="h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Session Summary */}
          {sessionData && (
            <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FiBarChart2 size={22} /> Session Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { val: sessionData.answeredQuestions, label: 'Questions Answered', bg: 'bg-purple-50', color: 'text-purple-600' },
                    { val: sessionData.totalQuestions,    label: 'Total Questions',    bg: 'bg-indigo-50',  color: 'text-indigo-600' },
                    { val: sessionData.difficulty,        label: 'Difficulty Level',   bg: 'bg-blue-50',    color: 'text-blue-600 capitalize' },
                    { val: `${Math.round((sessionData.answeredQuestions/sessionData.totalQuestions)*100)}%`, label: 'Completion Rate', bg: 'bg-green-50', color: 'text-green-600' },
                  ].map(({ val, label, bg, color }) => (
                    <div key={label} className={`text-center p-4 ${bg} rounded-lg`}>
                      <div className={`text-3xl font-bold mb-1 ${color}`}>{val}</div>
                      <div className="text-sm font-medium text-gray-600">{label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Critical Issues */}
          {analysis.criticalIssues?.length > 0 && (
            <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-red-50 to-pink-50">
              <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FiAlertTriangle size={20} /> Critical Issues Found
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {analysis.criticalIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border-l-4 border-red-500">
                      <FiAlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                      <span className="text-red-800 font-medium">{cleanText(issue)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FiThumbsUp size={20} /> Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {analysis.strengths?.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                        <FiCheck size={18} className="text-green-500 mt-0.5 shrink-0" />
                        <span className="text-green-800 font-medium">{cleanText(s)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <FiTarget size={40} className="text-green-400 mx-auto mb-3" />
                    <p className="text-green-700 font-medium">Keep working on building your strengths!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-yellow-50">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FiTarget size={20} /> Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {analysis.improvements?.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                        <FiTarget size={18} className="text-orange-500 mt-0.5 shrink-0" />
                        <span className="text-orange-800 font-medium">{cleanText(imp)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <FiThumbsUp size={40} className="text-orange-400 mx-auto mb-3" />
                    <p className="text-orange-700 font-medium">Great job! Keep up the excellent work.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          {analysis.detailedAnalysis && (
            <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FiFileText size={20} /> Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
                  {cleanText(analysis.detailedAnalysis).split('\n\n').map((para, i) => (
                    <p key={i} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">{para}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FiInfo size={20} /> Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-4">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-4 p-5 bg-white/70 rounded-xl border border-blue-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full
                                      flex items-center justify-center font-bold text-sm shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-blue-800 font-medium text-base leading-relaxed">{cleanText(rec)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={onBack} size="lg" variant="outline" className="px-8 py-3 text-lg border-2 border-gray-300">
              <FiChevronLeft size={18} className="mr-1" /> Back to Interview
            </Button>
            <Button onClick={() => window.print()} size="lg" variant="outline"
                    className="px-8 py-3 text-lg border-2 border-blue-300 text-blue-600 hover:bg-blue-50">
              <FiPrinter size={18} className="mr-2" /> Print Analysis
            </Button>
            <Button onClick={onReset ?? (() => window.location.reload())} size="lg"
                    className="px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <FiRefreshCw size={18} className="mr-2" /> Start New Interview
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Analysis
