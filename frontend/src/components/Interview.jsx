import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import {
  FiChevronLeft, FiChevronRight, FiSkipForward, FiUpload,
  FiRefreshCw, FiBarChart2, FiCheck, FiClock, FiAlertCircle, FiLoader
} from 'react-icons/fi'
import { apiUrl } from '../lib/api'

const Interview = ({ sessionData, onBack, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers]           = useState({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isCompleted, setIsCompleted]   = useState(false)
  const [loading, setLoading]           = useState(false)
  const [timeSpent, setTimeSpent]       = useState({})
  const [startTime, setStartTime]       = useState(Date.now())
  const [savedAnswers, setSavedAnswers] = useState(new Set())
  const textareaRef = useRef(null)

  const questions      = sessionData?.questions || []
  const atsQuality     = sessionData?.ats_quality || {}
  const currentQuestion = questions[currentQuestionIndex]
  const progress       = ((currentQuestionIndex + 1) / questions.length) * 100

  useEffect(() => {
    const id = setInterval(() => {
      if (currentAnswer.trim() && !savedAnswers.has(currentQuestionIndex)) handleAutoSave()
    }, 30000)
    return () => clearInterval(id)
  }, [currentAnswer, currentQuestionIndex])

  useEffect(() => {
    setStartTime(Date.now())
    return () => {
      const t = Date.now() - startTime
      setTimeSpent(prev => ({ ...prev, [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + t }))
    }
  }, [currentQuestionIndex])

  const handleAutoSave = async () => {
    if (!currentAnswer.trim()) return
    try {
      const res = await fetch(apiUrl('/submit-answer'), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionData.sessionId, questionIndex: currentQuestionIndex, answer: currentAnswer, isAutoSave: true }),
      })
      if (res.ok) setSavedAnswers(prev => new Set([...prev, currentQuestionIndex]))
    } catch (e) { console.error('Auto-save failed:', e) }
  }

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim()) { textareaRef.current?.focus(); return }
    setLoading(true)
    try {
      const timeOnQuestion = Date.now() - startTime
      const wordCount = currentAnswer.trim().split(/\s+/).length
      const res = await fetch(apiUrl('/submit-answer'), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionData.sessionId, questionIndex: currentQuestionIndex, answer: currentAnswer, timeSpent: timeOnQuestion, wordCount }),
      })
      const data = await res.json()
      if (data.success) {
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: currentAnswer }))
        setSavedAnswers(prev => new Set([...prev, currentQuestionIndex]))
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1)
          setCurrentAnswer('')
        } else {
          setIsCompleted(true)
          onComplete?.()
        }
      }
    } catch (e) { console.error('Submit error:', e) }
    finally { setLoading(false) }
  }

  const getATSScoreColor = (s) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-600'
  const getATSScoreBg    = (s) => s >= 80 ? 'from-green-500 to-green-600' : s >= 60 ? 'from-yellow-500 to-yellow-600' : 'from-red-500 to-red-600'
  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`

  const getAnswerQuality = (answer) => {
    const w = answer.trim().split(/\s+/).length
    if (w < 20)  return { quality: 'Too Short', color: 'text-red-500',    bg: 'bg-red-50' }
    if (w < 50)  return { quality: 'Brief',     color: 'text-yellow-500', bg: 'bg-yellow-50' }
    if (w < 100) return { quality: 'Good',      color: 'text-green-500',  bg: 'bg-green-50' }
    return             { quality: 'Detailed',   color: 'text-blue-500',   bg: 'bg-blue-50' }
  }

  if (isCompleted) {
    const totalTime = Object.values(timeSpent).reduce((s, t) => s + t, 0)
    const avgTime   = totalTime / questions.length
    const answered  = Object.keys(answers).length
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600
                          flex items-center justify-center shadow-xl">
            <FiCheck size={44} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Interview Completed!</h2>
          <p className="text-xl text-gray-600 mb-12">
            You answered {answered} of {questions.length} questions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="border-0 shadow-xl bg-white/90">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">{answered}/{questions.length}</div>
                <div className="text-base font-medium text-gray-600 mb-4">Questions Answered</div>
                <Progress value={(answered / questions.length) * 100} className="h-3" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-xl bg-white/90">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-3"><FiClock size={36} className="text-blue-500" /></div>
                <div className="text-4xl font-bold text-blue-600 mb-2">{formatTime(Math.floor(totalTime/1000))}</div>
                <div className="text-base font-medium text-gray-600">Total Time</div>
                <div className="text-sm text-gray-500 mt-1">Avg: {formatTime(Math.floor(avgTime/1000))} / question</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-xl bg-white/90">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-bold text-green-600 mb-2 capitalize">{sessionData.difficulty}</div>
                <div className="text-base font-medium text-gray-600">Difficulty</div>
                <div className="text-sm text-gray-500 mt-1">{questions.length} questions total</div>
              </CardContent>
            </Card>
          </div>

          {atsQuality.score && (
            <Card className="max-w-md mx-auto mb-12 border-0 shadow-xl bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-2 justify-center">
                  <FiBarChart2 size={20} /> Resume ATS Score
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <div className={`text-5xl font-bold mb-4 ${getATSScoreColor(atsQuality.score)}`}>{atsQuality.score}/100</div>
                <Badge className={`text-base px-4 py-2 bg-gradient-to-r ${getATSScoreBg(atsQuality.score)} text-white`}>{atsQuality.rating}</Badge>
                <Progress value={atsQuality.score} className="mt-6 h-3" />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => { onComplete?.() }} size="lg"
                    className="px-8 py-4 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg">
              <FiBarChart2 size={18} className="mr-2" /> Generate Performance Analysis
            </Button>
            <Button onClick={onBack} size="lg" variant="outline" className="px-8 py-4 text-lg border-2 border-gray-300">
              <FiUpload size={18} className="mr-2" /> Upload Another Resume
            </Button>
            <Button onClick={() => window.location.reload()} size="lg"
                    className="px-8 py-4 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg">
              <FiRefreshCw size={18} className="mr-2" /> Start New Interview
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const answerQuality = getAnswerQuality(currentAnswer)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Interview Session</h2>
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="text-lg font-medium">Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <Badge variant="secondary" className="capitalize text-base px-3 py-1">{sessionData.difficulty}</Badge>
                  {savedAnswers.has(currentQuestionIndex) && (
                    <Badge variant="outline" className="text-green-600 border-green-300 flex items-center gap-1">
                      <FiCheck size={12} /> Saved
                    </Badge>
                  )}
                </div>
              </div>
              {atsQuality.score && (
                <Card className="border border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">ATS Score</div>
                    <div className={`text-3xl font-bold ${getATSScoreColor(atsQuality.score)}`}>{atsQuality.score}/100</div>
                    <Badge className={`text-xs bg-gradient-to-r ${getATSScoreBg(atsQuality.score)} text-white`}>{atsQuality.rating}</Badge>
                  </CardContent>
                </Card>
              )}
            </div>
            <Progress value={progress} className="h-4 mb-3" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Progress: {Math.round(progress)}%</span>
              <span>{questions.length - currentQuestionIndex - 1} remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        {currentQuestion && (
          <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
              <Badge variant="outline" className="text-white border-white/30 bg-white/10 w-fit mb-2">
                Question {currentQuestionIndex + 1}
              </Badge>
              <CardTitle className="text-2xl leading-relaxed">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <textarea ref={textareaRef} value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Type your answer here... Be specific and provide examples from your experience."
                        className="w-full h-48 p-6 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg leading-relaxed"
                        disabled={loading} />
              <div className="flex justify-between items-center mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 font-medium">
                    {currentAnswer.length} chars · {currentAnswer.trim().split(/\s+/).filter(w => w).length} words
                  </span>
                  <Badge variant="outline" className={`${answerQuality.color} ${answerQuality.bg} border-current font-medium`}>
                    {answerQuality.quality}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                  <FiAlertCircle size={14} /> Aim for 50–150 words
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ATS suggestions */}
        {atsQuality.suggestions?.length > 0 && currentQuestionIndex === 0 && (
          <Card className="mb-6 border border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
                <FiAlertCircle size={18} /> Resume Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {atsQuality.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                    <FiChevronRight size={14} className="mt-0.5 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-3">
            <Button onClick={() => { setCurrentQuestionIndex(p => p-1); setCurrentAnswer(answers[currentQuestionIndex-1]||'') }}
                    disabled={currentQuestionIndex === 0} variant="outline" size="lg">
              <FiChevronLeft size={18} className="mr-1" /> Previous
            </Button>
            <Button onClick={() => { setCurrentQuestionIndex(p => p+1); setCurrentAnswer('') }}
                    disabled={currentQuestionIndex === questions.length - 1} variant="ghost" size="lg" className="text-gray-500">
              <FiSkipForward size={18} className="mr-1" /> Skip
            </Button>
          </div>
          <div className="flex gap-3">
            <Button onClick={onBack} variant="outline" size="lg">
              <FiUpload size={16} className="mr-1" /> Back to Upload
            </Button>
            <Button onClick={handleAnswerSubmit} disabled={!currentAnswer.trim() || loading} size="lg"
                    className="px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg">
              {loading ? (
                <span className="flex items-center gap-2"><FiLoader size={16} className="animate-spin" /> Submitting...</span>
              ) : currentQuestionIndex === questions.length - 1 ? (
                <span className="flex items-center gap-2"><FiCheck size={16} /> Complete Interview</span>
              ) : (
                <span className="flex items-center gap-2">Submit & Next <FiChevronRight size={16} /></span>
              )}
            </Button>
          </div>
        </div>

        {/* Question grid */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Question Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {questions.map((_, i) => (
                <div key={i}
                     onClick={() => { setCurrentQuestionIndex(i); setCurrentAnswer(answers[i]||'') }}
                     className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer transition-all hover:scale-105
                       ${i === currentQuestionIndex ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white ring-4 ring-purple-300 shadow-lg'
                         : answers[i] ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                         : savedAnswers.has(i) ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                         : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                  {answers[i] ? <FiCheck size={14} /> : i + 1}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm font-medium">
              {[
                { color: 'from-purple-600 to-indigo-600', label: 'Current' },
                { color: 'from-green-500 to-emerald-500', label: 'Submitted' },
                { color: 'from-yellow-500 to-orange-500', label: 'Auto-saved' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${color}`} />
                  <span>{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-200" />
                <span>Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Interview
