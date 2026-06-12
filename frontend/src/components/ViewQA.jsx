import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { apiUrl } from '../lib/api'

const ViewQA = () => {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [qaData, setQAData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAllSessions()
  }, [])

  const fetchAllSessions = async () => {
    try {
      const response = await fetch(apiUrl('/sessions/all'))
      const data = await response.json()
      
      if (data.success) {
        setSessions(data.sessions)
      } else {
        setError(data.error || 'Failed to fetch sessions')
      }
    } catch {
      setError('Network error. Please ensure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionQA = async (sessionId) => {
    setLoading(true)
    try {
      const response = await fetch(apiUrl(`/session/${sessionId}/qa`))
      const data = await response.json()
      
      if (data.success) {
        setQAData(data)
        setSelectedSession(sessionId)
      } else {
        setError(data.error || 'Failed to fetch Q&A data')
      }
    } catch {
      setError('Network error. Please ensure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleString()
  }

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50'
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  if (loading && !qaData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sessions...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
              📊 Interview Sessions & Q&A Review
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              View all recorded interview sessions and their questions & answers
            </CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <Card className="bg-red-50 border-red-200 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center text-red-700">
                <span className="mr-2">⚠️</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedSession ? (
          /* Sessions List */
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl">All Interview Sessions ({sessions.length})</CardTitle>
              <CardDescription>
                Click on any session to view detailed questions and answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Sessions Found</h3>
                  <p className="text-gray-600">Complete some interviews to see them here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <Card 
                      key={session.sessionId} 
                      className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => fetchSessionQA(session.sessionId)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">
                                Session #{session.sessionId}
                              </h3>
                              <Badge 
                                variant="outline" 
                                className={getCompletionColor(session.completionPercentage)}
                              >
                                {session.completionPercentage}% Complete
                              </Badge>
                              <Badge variant="secondary" className="capitalize">
                                {session.status}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">
                              Resume: {session.resumeText || 'Unknown'}
                            </p>
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <span>📅 {formatDate(session.createdAt)}</span>
                              <span>❓ {session.answeredQuestions}/{session.totalQuestions} answered</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Progress 
                              value={session.completionPercentage} 
                              className="w-24 mb-2" 
                            />
                            <Button variant="outline" size="sm">
                              View Details →
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Q&A Details */
          <div className="space-y-6">
            {/* Session Info */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      Session #{qaData.sessionId} - Questions & Answers
                    </CardTitle>
                    <CardDescription>
                      Resume: {qaData.resumeText} • Created: {formatDate(qaData.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-purple-600">
                      {qaData.answeredQuestions}/{qaData.totalQuestions} Answered
                    </Badge>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedSession(null)
                        setQAData(null)
                      }}
                    >
                      ← Back to Sessions
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Questions and Answers */}
            <div className="space-y-4">
              {qaData.questionsAndAnswers.map((qa) => (
                <Card key={qa.questionId} className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                  <CardHeader className={`${qa.hasAnswer ? 'bg-green-50' : 'bg-gray-50'} border-b`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-3">
                        <Badge variant="outline" className="text-purple-700">
                          Q{qa.questionIndex}
                        </Badge>
                        <span className="text-gray-800">{qa.questionText}</span>
                      </CardTitle>
                      <Badge 
                        variant={qa.hasAnswer ? "default" : "secondary"}
                        className={qa.hasAnswer ? "bg-green-500" : "bg-gray-400"}
                      >
                        {qa.hasAnswer ? "✓ Answered" : "⏳ Pending"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {qa.hasAnswer ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Answer:</h4>
                          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-l-green-500">
                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {qa.answerText}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            Word count: {qa.answerText ? qa.answerText.trim().split(/\s+/).length : 0} words
                          </span>
                          <span>
                            Character count: {qa.answerText ? qa.answerText.length : 0} characters
                          </span>
                          {qa.answerScore !== null && (
                            <Badge variant="outline">
                              Score: {qa.answerScore}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">❓</div>
                        <p className="text-gray-500">No answer provided for this question</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
              <CardHeader>
                <CardTitle className="text-lg">Session Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {qaData.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {qaData.answeredQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Answered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600 mb-2">
                      {Math.round((qaData.answeredQuestions / qaData.totalQuestions) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ViewQA
