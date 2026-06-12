import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { apiUrl } from '../lib/api'

const Leaderboard = ({ onBack }) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    difficulty: '',
    tags: '',
    page: 1
  })
  const [stats, setStats] = useState(null)
  const [availableTags, setAvailableTags] = useState([])

  useEffect(() => {
    fetchLeaderboard()
    fetchStats()
    fetchAvailableTags()
  }, [filter])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.difficulty) params.append('difficulty', filter.difficulty)
      if (filter.tags) params.append('tags', filter.tags)
      params.append('page', filter.page)
      params.append('limit', '20')

      const response = await fetch(apiUrl(`/leaderboard/global?${params}`))
      const data = await response.json()
      
      if (data.success) {
        setLeaderboard(data.leaderboard)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(apiUrl('/leaderboard/stats'))
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch(apiUrl('/question-bank/tags'))
      const data = await response.json()
      if (data.success) {
        setAvailableTags(data.tags)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilter(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }))
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#6f9ca8'
      case 'medium': return '#c97c42'
      case 'hard': return '#b944ac'
      default: return '#462a67'
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#462a67' }}>
            🏆 Leaderboard
          </h1>
          <p className="text-lg" style={{ color: '#6e727a' }}>
            See how you rank against other candidates
          </p>
        </div>
        <Button
          onClick={onBack}
          className="px-6 py-3 rounded-full font-medium bg-white border-2 hover:bg-gray-50"
          style={{ color: '#462a67', borderColor: '#462a67' }}
        >
          ← Back
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-bold" style={{ color: '#462a67' }}>
                {stats.overall.totalUsers || 0}
              </div>
              <div className="text-sm" style={{ color: '#6e727a' }}>Total Users</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold" style={{ color: '#462a67' }}>
                {stats.overall.averageScore || 0}%
              </div>
              <div className="text-sm" style={{ color: '#6e727a' }}>Average Score</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-2xl font-bold" style={{ color: '#462a67' }}>
                {stats.overall.highestScore || 0}%
              </div>
              <div className="text-sm" style={{ color: '#6e727a' }}>Highest Score</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">📝</div>
              <div className="text-2xl font-bold" style={{ color: '#462a67' }}>
                {stats.overall.totalSessions || 0}
              </div>
              <div className="text-sm" style={{ color: '#6e727a' }}>Total Sessions</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl mb-8">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#462a67' }}>
                Difficulty
              </label>
              <select
                value={filter.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="px-4 py-2 border-2 rounded-lg"
                style={{ borderColor: '#f2edfa', color: '#462a67' }}
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#462a67' }}>
                Tags
              </label>
              <select
                value={filter.tags}
                onChange={(e) => handleFilterChange('tags', e.target.value)}
                className="px-4 py-2 border-2 rounded-lg"
                style={{ borderColor: '#f2edfa', color: '#462a67' }}
              >
                <option value="">All Tags</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
            
            <Button
              onClick={() => setFilter({ difficulty: '', tags: '', page: 1 })}
              className="px-4 py-2 rounded-lg font-medium bg-white border-2"
              style={{ color: '#462a67', borderColor: '#462a67' }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p style={{ color: '#6e727a' }}>Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#462a67' }}>
                No Rankings Yet
              </h3>
              <p style={{ color: '#6e727a' }}>
                Complete an interview to appear on the leaderboard
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {leaderboard.map((entry) => (
                <div key={entry._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold w-12 text-center" style={{ color: '#462a67' }}>
                        {getRankIcon(entry.rank)}
                      </div>
                      
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                           style={{ background: 'linear-gradient(135deg, #462a67 0%, #7164bc 100%)' }}>
                        {entry.userName.charAt(0).toUpperCase()}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg" style={{ color: '#462a67' }}>
                          {entry.userName}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm" style={{ color: '#6e727a' }}>
                          <span className="px-2 py-1 rounded-full text-white text-xs"
                                style={{ background: getDifficultyColor(entry.difficulty) }}>
                            {entry.difficulty.toUpperCase()}
                          </span>
                          <span>{entry.questionsAnswered}/{entry.totalQuestions} questions</span>
                          <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-2 py-1 rounded-full text-xs"
                                    style={{ background: '#f2edfa', color: '#462a67' }}>
                                {tag}
                              </span>
                            ))}
                            {entry.tags.length > 3 && (
                              <span className="px-2 py-1 rounded-full text-xs"
                                    style={{ background: '#f2edfa', color: '#462a67' }}>
                                +{entry.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold" style={{ color: '#462a67' }}>
                        {entry.totalScore}%
                      </div>
                      <div className="text-sm" style={{ color: '#6e727a' }}>
                        {entry.completionPercentage}% complete
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Leaderboard
