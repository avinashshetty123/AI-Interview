import { useState } from 'react'
import { FiBriefcase, FiPlus, FiTrash2, FiCalendar, FiMapPin, FiZap, FiRefreshCw } from 'react-icons/fi'
import { Button } from '../ui/button'

const Experience = ({ data = [], onChange, onNext, onPrev, onOptimizeText }) => {
  const [errors, setErrors] = useState({})
  const [optimizing, setOptimizing] = useState({})

  const addExperience = () => {
    const newExp = {
      id: Date.now(),
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrentJob: false,
      description: '',
      achievements: ['']
    }
    onChange('experience', null, [...data, newExp])
  }

  const updateExperience = (index, field, value) => {
    const updated = [...data]
    if (field === 'achievements') {
      updated[index][field] = value
    } else {
      updated[index][field] = value
    }
    onChange('experience', null, updated)
  }

  const removeExperience = (index) => {
    const updated = data.filter((_, i) => i !== index)
    onChange('experience', null, updated)
  }

  const addAchievement = (expIndex) => {
    const updated = [...data]
    updated[expIndex].achievements.push('')
    onChange('experience', null, updated)
  }

  const updateAchievement = (expIndex, achIndex, value) => {
    const updated = [...data]
    updated[expIndex].achievements[achIndex] = value
    onChange('experience', null, updated)
  }

  const removeAchievement = (expIndex, achIndex) => {
    const updated = [...data]
    updated[expIndex].achievements = updated[expIndex].achievements.filter((_, i) => i !== achIndex)
    onChange('experience', null, updated)
  }

  const optimizeDescription = async (index) => {
    if (!onOptimizeText || !data[index]?.description) return
    
    setOptimizing(prev => ({ ...prev, [`${index}_description`]: true }))
    
    try {
      const optimizedText = await onOptimizeText(
        data[index].description, 
        'experience',
        { jobTitle: data[index].jobTitle, company: data[index].company }
      )
      
      if (optimizedText && optimizedText !== data[index].description) {
        updateExperience(index, 'description', optimizedText)
      }
    } catch (error) {
      console.error('Failed to optimize description:', error)
    } finally {
      setOptimizing(prev => ({ ...prev, [`${index}_description`]: false }))
    }
  }

  const optimizeAchievement = async (expIndex, achIndex) => {
    if (!onOptimizeText || !data[expIndex]?.achievements?.[achIndex]) return
    
    const key = `${expIndex}_${achIndex}_achievement`
    setOptimizing(prev => ({ ...prev, [key]: true }))
    
    try {
      const optimizedText = await onOptimizeText(
        data[expIndex].achievements[achIndex], 
        'achievement'
      )
      
      if (optimizedText && optimizedText !== data[expIndex].achievements[achIndex]) {
        updateAchievement(expIndex, achIndex, optimizedText)
      }
    } catch (error) {
      console.error('Failed to optimize achievement:', error)
    } finally {
      setOptimizing(prev => ({ ...prev, [key]: false }))
    }
  }

  const validate = () => {
    const newErrors = {}
    data.forEach((exp, index) => {
      if (!exp.jobTitle?.trim()) newErrors[`${index}_jobTitle`] = 'Job title is required'
      if (!exp.company?.trim()) newErrors[`${index}_company`] = 'Company is required'
      if (!exp.startDate) newErrors[`${index}_startDate`] = 'Start date is required'
      if (!exp.isCurrentJob && !exp.endDate) newErrors[`${index}_endDate`] = 'End date is required'
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    // Experience is optional, so we can proceed even with no entries
    if (data.length > 0 && !validate()) {
      return // Only validate if there are entries
    }
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Work Experience</h3>
        <Button onClick={addExperience} className="flex items-center gap-2">
          <FiPlus size={16} />
          Add Experience
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-blue-50 rounded-xl border border-blue-200">
          <FiBriefcase size={48} className="mx-auto text-blue-400 mb-4" />
          <h3 className="text-lg font-medium text-blue-700 mb-2">No Work Experience (Optional)</h3>
          <p className="text-blue-600 mb-4">You can add work experience to strengthen your resume, or skip this section</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={addExperience} className="bg-blue-600 hover:bg-blue-700">
              Add Experience
            </Button>
            <Button onClick={onNext} variant="outline" className="border-blue-300 text-blue-700">
              Skip This Section
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((exp, index) => (
            <div key={exp.id} className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Experience {index + 1}</h4>
                <Button
                  onClick={() => removeExperience(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                >
                  <FiTrash2 size={16} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title *</label>
                  <input
                    type="text"
                    value={exp.jobTitle}
                    onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors[`${index}_jobTitle`] ? 'border-red-300' : 'border-gray-200 focus:border-violet-500'
                    }`}
                    placeholder="Software Engineer"
                  />
                  {errors[`${index}_jobTitle`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}_jobTitle`]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company *</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors[`${index}_company`] ? 'border-red-300' : 'border-gray-200 focus:border-violet-500'
                    }`}
                    placeholder="Tech Company Inc."
                  />
                  {errors[`${index}_company`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}_company`]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <FiMapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExperience(index, 'location', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors"
                      placeholder="New York, NY"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                    <div className="relative">
                      <FiCalendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                          errors[`${index}_startDate`] ? 'border-red-300' : 'border-gray-200 focus:border-violet-500'
                        }`}
                      />
                    </div>
                    {errors[`${index}_startDate`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}_startDate`]}</p>}
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                    <div className="relative">
                      <FiCalendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                        disabled={exp.isCurrentJob}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                          exp.isCurrentJob ? 'bg-gray-100 text-gray-500' : 
                          errors[`${index}_endDate`] ? 'border-red-300' : 'border-gray-200 focus:border-violet-500'
                        }`}
                      />
                    </div>
                    {errors[`${index}_endDate`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}_endDate`]}</p>}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exp.isCurrentJob}
                    onChange={(e) => {
                      updateExperience(index, 'isCurrentJob', e.target.checked)
                      if (e.target.checked) {
                        updateExperience(index, 'endDate', '')
                      }
                    }}
                    className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm font-medium text-gray-700">I currently work here</span>
                </label>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Job Description</label>
                  {onOptimizeText && (
                    <Button
                      onClick={() => optimizeDescription(index)}
                      disabled={optimizing[`${index}_description`] || !exp.description?.trim()}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-blue-600 hover:bg-blue-50"
                    >
                      {optimizing[`${index}_description`] ? (
                        <FiRefreshCw size={14} className="animate-spin" />
                      ) : (
                        <FiZap size={14} />
                      )}
                      {optimizing[`${index}_description`] ? 'Optimizing...' : 'AI Optimize'}
                    </Button>
                  )}
                </div>
                <textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors"
                  rows="3"
                  placeholder="Brief description of your role and responsibilities..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Key Achievements</label>
                  <Button
                    onClick={() => addAchievement(index)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <FiPlus size={14} />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {exp.achievements.map((achievement, achIndex) => (
                    <div key={achIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={achievement}
                        onChange={(e) => updateAchievement(index, achIndex, e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
                        placeholder="• Increased team productivity by 30%..."
                      />
                      {onOptimizeText && achievement?.trim() && (
                        <Button
                          onClick={() => optimizeAchievement(index, achIndex)}
                          disabled={optimizing[`${index}_${achIndex}_achievement`]}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          {optimizing[`${index}_${achIndex}_achievement`] ? (
                            <FiRefreshCw size={14} className="animate-spin" />
                          ) : (
                            <FiZap size={14} />
                          )}
                        </Button>
                      )}
                      {exp.achievements.length > 1 && (
                        <Button
                          onClick={() => removeAchievement(index, achIndex)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <FiTrash2 size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button onClick={onPrev} variant="outline">
          ← Previous
        </Button>
        <Button onClick={handleNext}>
          Next Step →
        </Button>
      </div>
    </div>
  )
}

export default Experience