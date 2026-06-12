import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'jankoti_resume_data'
const AUTO_SAVE_INTERVAL = 2000 // 2 seconds

export const saveResumeData = (data) => {
  try {
    const dataToSave = {
      ...data,
      lastSaved: new Date().toISOString(),
      version: '1.0'
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    return true
  } catch (error) {
    console.error('Error saving resume data:', error)
    return false
  }
}

export const loadResumeData = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      const { lastSaved: _lastSaved, version: _version, ...resumeData } = data
      return resumeData
    }
    return null
  } catch (error) {
    console.error('Error loading resume data:', error)
    return null
  }
}

export const clearResumeData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Error clearing resume data:', error)
    return false
  }
}

export const getLastSavedTime = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      return data.lastSaved ? new Date(data.lastSaved) : null
    }
    return null
  } catch (error) {
    console.error('Error getting last saved time:', error)
    return null
  }
}

export const useAutoSave = (data, enabled = true) => {
  const [lastSaved, setLastSaved] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!enabled || !data) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsSaving(true)
      const success = saveResumeData(data)
      if (success) {
        setLastSaved(new Date())
      }
      setIsSaving(false)
    }, AUTO_SAVE_INTERVAL)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, enabled])

  return { lastSaved, isSaving }
}

export const getDefaultResumeData = () => ({
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
    profilePicture: null
  },
  experience: [],
  education: [],
  skills: {
    technical: [],
    soft: []
  },
  projects: [],
  certifications: [],
  summary: '',
  achievements: []
})

export const mergeWithUserData = (savedData, userData) => {
  const defaultData = getDefaultResumeData()
  
  if (!savedData && !userData) return defaultData
  
  if (!savedData) {
    return {
      ...defaultData,
      personalInfo: {
        ...defaultData.personalInfo,
        fullName: userData?.name || '',
        email: userData?.email || ''
      }
    }
  }

  return {
    ...savedData,
    personalInfo: {
      ...savedData.personalInfo,
      fullName: userData?.name || savedData.personalInfo?.fullName || '',
      email: userData?.email || savedData.personalInfo?.email || ''
    }
  }
}
