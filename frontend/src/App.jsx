import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import InterviewPage from './pages/InterviewPage'
import Leaderboard from './components/Leaderboard'
import ResumeBuilder from './components/ResumeBuilder'
import ATSChecker from './components/ATSChecker'
import { useAuth } from './context/authContext'

function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth()
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <svg className="animate-spin h-8 w-8 text-violet-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  )
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/"              element={<Home />} />
      <Route path="/login"         element={<Login />} />
      <Route path="/signup"        element={<Signup />} />
      <Route path="/leaderboard"   element={<Leaderboard onBack={() => window.history.back()} />} />
      <Route path="/ats-checker"    element={<ATSChecker onBack={() => window.history.back()} />} />
      <Route path="/resume-builder" element={<ResumeBuilder onBack={() => window.history.back()} />} />
      <Route path="/interview"     element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
