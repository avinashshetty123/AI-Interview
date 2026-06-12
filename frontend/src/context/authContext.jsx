import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../lib/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const API = API_BASE_URL

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is logged in from cookies/localStorage
  const checkAuthStatus = () => {
    const savedUser = localStorage.getItem('jankoti_user')
    const authToken = document.cookie.includes('jankoti_auth=true')
    
    if (savedUser && authToken) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
        return true
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        clearAuthData()
      }
    }
    return false
  }

  // Clear authentication data
  const clearAuthData = () => {
    localStorage.removeItem('jankoti_user')
    document.cookie = 'jankoti_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    setUser(null)
    setIsAuthenticated(false)
  }

  // Save authentication data
  const saveAuthData = (userData) => {
    localStorage.setItem('jankoti_user', JSON.stringify(userData))
    // Set cookie that expires in 7 days
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 7)
    document.cookie = `jankoti_auth=true; expires=${expiryDate.toUTCString()}; path=/`
    setUser(userData)
    setIsAuthenticated(true)
  }

  const fetchUser = async () => {
    try {
      // First check local storage
      if (checkAuthStatus()) {
        setLoading(false)
        return
      }

      // If no local data, try to fetch from server
      const res = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      })
      
      if (res.data.success && res.data.user) {
        saveAuthData(res.data.user)
      } else {
        clearAuthData()
      }
    } catch (err) {
      console.log('Fetch user error:', err)
      clearAuthData()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (form) => {
    try {
      const res = await axios.post(`${API}/auth/login`, form, {
        withCredentials: true
      })
      
      if (res.data.success && res.data.user) {
        saveAuthData(res.data.user)
        return { success: true, user: res.data.user }
      } else {
        return {
          success: false,
          message: res.data.message || 'Login failed'
        }
      }

    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed'
      }
    }
  }

  const signup = async (form) => {
    try {
      const res = await axios.post(`${API}/auth/signup`, form, {
        withCredentials: true
      })

      if (res.data.success) {
        // Auto-login after successful signup
        if (res.data.user) {
          saveAuthData(res.data.user)
        }
        return { success: true, user: res.data.user }
      } else {
        return {
          success: false,
          message: res.data.message || 'Signup failed'
        }
      }

    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Signup failed'
      }
    }
  }

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true
      })
    } catch (err) {
      console.log('Logout error:', err)
    } finally {
      clearAuthData()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        signup,
        logout,
        fetchUser,
        checkAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 🔹 Custom hook
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
