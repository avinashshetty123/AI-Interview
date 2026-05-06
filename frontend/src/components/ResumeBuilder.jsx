import { useState, useEffect } from 'react'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { FiUser, FiEdit3, FiBriefcase, FiBook, FiCode, FiTarget, FiAward, FiEye, FiSave, FiClock, FiUpload, FiZap, FiRefreshCw } from 'react-icons/fi'
import { useAuth } from '../context/authContext'
import { saveResumeData, loadResumeData, getDefaultResumeData, mergeWithUserData, useAutoSave } from '../utils/resumeStorage'

// Import modular components
import PersonalInfo from './resume/PersonalInfo'
import Experience from './resume/Experience'
import Education from './resume/Education'
import Skills from './resume/Skills'
import Projects from './resume/Projects'
import Certifications from './resume/Certifications'
import Summary from './resume/Summary'
import PDFPreview from './resume/PDFPreview'
import ResumeUploadParser from './resume/ResumeUploadParser'

import logo from '../assets/Logo.png'

const ResumeBuilder = ({ onBack }) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [resumeData, setResumeData] = useState(getDefaultResumeData())
  const [atsScore, setAtsScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showUploadParser, setShowUploadParser] = useState(false)
  const [aiOptimizing, setAiOptimizing] = useState(false)

  // Auto-save functionality
  const { lastSaved, isSaving } = useAutoSave(resumeData, true)

  const steps = [
    { title: 'Personal Info',     icon: FiUser,     component: PersonalInfo,  required: true  },
    { title: 'Experience',        icon: FiBriefcase,component: Experience,    required: false },
    { title: 'Projects',          icon: FiTarget,   component: Projects,      required: false },
    { title: 'Education',         icon: FiBook,     component: Education,     required: true  },
    { title: 'Skills',            icon: FiCode,     component: Skills,        required: true  },
    { title: 'Certifications',    icon: FiAward,    component: Certifications,required: false },
    { title: 'Summary',           icon: FiEdit3,    component: Summary,       required: true  },
    { title: 'Preview & Download',icon: FiEye,      component: PDFPreview,    required: true  },
  ]

  // Load saved data and merge with user data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load saved resume data
        const savedData = loadResumeData()
        
        // Create initial data with user info
        const initialData = getDefaultResumeData()
        if (user) {
          initialData.personalInfo.fullName = user.name || ''
          initialData.personalInfo.email = user.email || ''
        }

        // Merge saved data with user data
        const finalData = mergeWithUserData(savedData, user)
        setResumeData(finalData)
        
        // Calculate initial ATS score
        calculateATSScore(finalData)
      } catch (error) {
        console.error('Error initializing resume data:', error)
        // Fallback to default data
        const defaultData = getDefaultResumeData()
        setResumeData(defaultData)
        calculateATSScore(defaultData)
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [user])

  // Calculate ATS score whenever data changes
  useEffect(() => {
    calculateATSScore(resumeData)
  }, [resumeData])

  const calculateATSScore = (data) => {
    if (!data || !data.personalInfo) {
      setAtsScore(0)
      return
    }
    
    let score = 0
    const { personalInfo, summary, experience, education, skills, projects } = data

    // Personal info (20 points)
    const requiredFields = ['fullName', 'email', 'phone', 'location']
    const completedFields = requiredFields.filter(field => personalInfo?.[field]?.trim()).length
    score += (completedFields / requiredFields.length) * 20

    // Summary (20 points)
    if (summary?.trim()) {
      const wordCount = summary.trim().split(/\s+/).length
      if (wordCount >= 50 && wordCount <= 150) {
        score += 20
      } else if (wordCount >= 30) {
        score += 15
      } else if (wordCount >= 15) {
        score += 10
      }
    }

    // Education (25 points) - Now required
    if (education?.length >= 1) {
      score += 25
      // Bonus for complete education entries
      const completeEducation = education.filter(edu => 
        edu.degree?.trim() && edu.institution?.trim()
      ).length
      if (completeEducation === education.length) {
        score += 5 // Bonus for complete entries
      }
    }

    // Experience (20 points) - Now optional but valuable
    if (experience?.length >= 2) score += 20
    else if (experience?.length === 1) score += 12

    // Skills (10 points)
    const totalSkills = (skills?.technical?.length || 0) + (skills?.soft?.length || 0)
    if (totalSkills >= 10) score += 10
    else if (totalSkills >= 5) score += 6

    // Projects (5 points) - Optional but adds value
    if (projects?.length >= 2) score += 5
    else if (projects?.length === 1) score += 3

    setAtsScore(Math.min(100, Math.round(score)))
  }

  const handleDataChange = (section, field, value, index = null) => {
    setResumeData(prev => {
      if (section === null) {
        // Direct field update (like summary)
        return { ...prev, [field]: value }
      } else if (index !== null) {
        // Array item update
        const newArray = [...prev[section]]
        newArray[index] = { ...newArray[index], [field]: value }
        return { ...prev, [section]: newArray }
      } else if (section === 'personalInfo') {
        // Personal info update
        return {
          ...prev,
          personalInfo: { ...prev.personalInfo, [field]: value }
        }
      } else {
        // Direct section update (like education array)
        return { ...prev, [section]: value }
      }
    })
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const manualSave = async () => {
    const success = saveResumeData(resumeData)
    if (success) {
      // Show success message or toast
      console.log('Resume saved successfully')
    }
  }

  const handleResumeDataParsed = (parsedData, parsedAtsScore, suggestions) => {
    setResumeData(parsedData)
    setAtsScore(parsedAtsScore || 0)
    setShowUploadParser(false)
    
    // Show success message
    alert(`Resume parsed successfully! ATS Score: ${parsedAtsScore || 0}%\n\nSuggestions: ${suggestions?.slice(0, 2).join(', ') || 'None'}`)
  }

  const optimizeAllContent = async () => {
    setAiOptimizing(true)
    try {
      const optimizationTasks = []
      
      // Optimize experience descriptions
      resumeData.experience?.forEach((exp, index) => {
        if (exp.description) {
          optimizationTasks.push({
            text: exp.description,
            type: 'experience',
            path: ['experience', index, 'description']
          })
        }
      })
      
      // Optimize project descriptions
      resumeData.projects?.forEach((proj, index) => {
        if (proj.description) {
          optimizationTasks.push({
            text: proj.description,
            type: 'project',
            path: ['projects', index, 'description']
          })
        }
      })
      
      // Optimize summary
      if (resumeData.summary) {
        optimizationTasks.push({
          text: resumeData.summary,
          type: 'summary',
          path: ['summary'],
          context: {
            skills: [...(resumeData.skills?.technical || []), ...(resumeData.skills?.soft || [])],
            experience: resumeData.experience?.length || 0
          }
        })
      }
      
      if (optimizationTasks.length === 0) {
        alert('No content to optimize. Please add some descriptions first.')
        return
      }
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'}/resume/optimize-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ items: optimizationTasks }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        const newResumeData = { ...resumeData }
        
        data.items.forEach((item) => {
          if (item.success && item.optimizedText) {
            // Navigate to the nested property and update it
            let current = newResumeData
            for (let i = 0; i < item.path.length - 1; i++) {
              current = current[item.path[i]]
            }
            current[item.path[item.path.length - 1]] = item.optimizedText
          }
        })
        
        setResumeData(newResumeData)
        alert(`Successfully optimized ${data.items.filter(i => i.success).length} text sections for better ATS compatibility!`)
      } else {
        alert('Failed to optimize content: ' + data.error)
      }
    } catch (error) {
      console.error('Optimization error:', error)
      alert('Failed to optimize content. Please try again.')
    } finally {
      setAiOptimizing(false)
    }
  }
  
  const generateAISkills = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'}/resume/generate-skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          experience: resumeData.experience,
          projects: resumeData.projects,
          education: resumeData.education
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResumeData(prev => ({
          ...prev,
          skills: {
            technical: [...new Set([...(prev.skills?.technical || []), ...data.skills.technical])],
            soft: [...new Set([...(prev.skills?.soft || []), ...data.skills.soft])]
          }
        }))
        alert('AI-generated skills have been added to your resume!')
      }
    } catch (error) {
      console.error('Skills generation error:', error)
      alert('Failed to generate skills. Please try again.')
    }
  }

  const renderStepContent = () => {
    const StepComponent = steps[currentStep].component
    
    if (!StepComponent) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600 mb-4">
            {steps[currentStep].title} - Coming Soon
          </h3>
          <p className="text-gray-500 mb-8">
            This section is under development. You can navigate to other sections.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={handlePrev} disabled={currentStep === 0} variant="outline">
              ← Previous
            </Button>
            <Button onClick={handleNext} disabled={currentStep === steps.length - 1}>
              Next →
            </Button>
          </div>
        </div>
      )
    }

    const getStepData = () => {
      const stepTitle = steps[currentStep]?.title
      switch (stepTitle) {
        case 'Personal Info': return resumeData.personalInfo
        case 'Experience': return resumeData.experience
        case 'Education': return resumeData.education
        case 'Skills': return resumeData.skills
        case 'Projects': return resumeData.projects
        case 'Certifications': return resumeData.certifications
        case 'Summary': return resumeData.summary
        case 'Preview & Download': return resumeData
        default: return resumeData
      }
    }

    const commonProps = {
      data: getStepData(),
      onChange: handleDataChange,
      onNext: handleNext,
      onPrev: handlePrev,
      resumeData: resumeData,
      onOptimizeText: async (text, type, context) => {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'}/resume/optimize-text`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ text, type, context }),
          })
          
          const data = await response.json()
          return data.success ? data.optimizedText : text
        } catch (error) {
          console.error('Text optimization error:', error)
          return text
        }
      }
    }

    // Special handling for PDFPreview
    if (steps[currentStep]?.title === 'Preview & Download') {
      return (
        <StepComponent
          {...commonProps}
          onComplete={() => {
            alert('Resume completed successfully! 🎉')
            // You can add navigation logic here
          }}
        />
      )
    }

    return <StepComponent {...commonProps} />
  }

  if (showUploadParser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="container mx-auto px-6 py-8">
          <ResumeUploadParser 
            onResumeDataParsed={handleResumeDataParsed}
            onCancel={() => setShowUploadParser(false)}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your resume...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Jankoti" className="h-9 w-auto" />
              <div>
                <p className="text-xl text-gray-600">ATS Resume Builder</p>
                <div className="text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Auto-save indicator */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <FiClock size={16} />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : null}
              </div>
              <Button 
                onClick={() => setShowUploadParser(true)} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <FiUpload size={16} />
                Import Resume
              </Button>
              <Button 
                onClick={optimizeAllContent} 
                disabled={aiOptimizing}
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:shadow-lg"
              >
                {aiOptimizing ? (
                  <FiRefreshCw size={16} className="animate-spin" />
                ) : (
                  <FiZap size={16} />
                )}
                {aiOptimizing ? 'Optimizing...' : 'AI Optimize'}
              </Button>
              <Button onClick={manualSave} variant="outline" className="flex items-center gap-2">
                <FiSave size={16} />
                Save
              </Button>
              <Button onClick={onBack} variant="outline">
                ← Back
              </Button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep
                const isRequired = step.required
                
                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm relative ${
                      isCurrent
                        ? 'bg-violet-600 text-white shadow-lg'
                        : isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    {React.createElement(step.icon, { size: 16 })}
                    <span className="font-medium hidden sm:block">{step.title}</span>
                    {isRequired && (
                      <span className="text-xs text-red-500 ml-1">*</span>
                    )}
                  </div>
                )
              })}
            </div>
            <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
          </div>

          {/* ATS Score Display */}
          <Card className="mb-8 border-0 shadow-xl bg-white/90">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{atsScore}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">ATS Compatibility Score</h3>
                    <p className="text-gray-600">
                      {atsScore >= 90 ? 'Excellent! Your resume is highly optimized' :
                       atsScore >= 70 ? 'Good! Your resume should pass most ATS systems' :
                       atsScore >= 50 ? 'Fair. Add more details to improve your score' :
                       'Needs improvement. Complete more sections'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl">
                    {atsScore >= 90 ? '🏆' : atsScore >= 70 ? '⭐' : atsScore >= 50 ? '📈' : '⚠️'}
                  </div>
                </div>
              </div>
              <Progress value={atsScore} className="mt-4 h-3" />
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card className="border-0 shadow-xl bg-white/90">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                {React.createElement(steps[currentStep].icon, { size: 24 })}
                {steps[currentStep].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

export default ResumeBuilder