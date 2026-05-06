import { useState } from 'react'
import { FiCode, FiPlus, FiX, FiUsers, FiTrendingUp, FiZap, FiRefreshCw } from 'react-icons/fi'
import { Button } from '../ui/button'

const Skills = ({ data = { technical: [], soft: [] }, onChange, onNext, onPrev, resumeData }) => {
  const [newTechnicalSkill, setNewTechnicalSkill] = useState('')
  const [newSoftSkill, setNewSoftSkill] = useState('')
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false)

  const addTechnicalSkill = () => {
    if (newTechnicalSkill.trim()) {
      const updated = {
        ...data,
        technical: [...data.technical, { name: newTechnicalSkill.trim(), level: 'Intermediate' }]
      }
      onChange('skills', null, updated)
      setNewTechnicalSkill('')
    }
  }

  const addSoftSkill = () => {
    if (newSoftSkill.trim()) {
      const updated = {
        ...data,
        soft: [...data.soft, newSoftSkill.trim()]
      }
      onChange('skills', null, updated)
      setNewSoftSkill('')
    }
  }

  const removeTechnicalSkill = (index) => {
    const updated = {
      ...data,
      technical: data.technical.filter((_, i) => i !== index)
    }
    onChange('skills', null, updated)
  }

  const removeSoftSkill = (index) => {
    const updated = {
      ...data,
      soft: data.soft.filter((_, i) => i !== index)
    }
    onChange('skills', null, updated)
  }

  const updateTechnicalSkillLevel = (index, level) => {
    const updated = {
      ...data,
      technical: data.technical.map((skill, i) => 
        i === index ? { ...skill, level } : skill
      )
    }
    onChange('skills', null, updated)
  }

  const handleNext = () => {
    if (data.technical.length === 0 && data.soft.length === 0) {
      alert('Please add at least one skill')
      return
    }
    onNext()
  }

  const generateAISkills = async () => {
    setIsGeneratingSkills(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'}/resume/generate-skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          experience: resumeData?.experience || [],
          projects: resumeData?.projects || [],
          education: resumeData?.education || []
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        const currentTechnical = data.technical.map(s => s.name || s).map(s => s.toLowerCase())
        const currentSoft = data.soft.map(s => s.toLowerCase())
        
        const newTechnical = result.skills.technical
          .filter(skill => !currentTechnical.includes(skill.toLowerCase()))
          .map(skill => ({ name: skill, level: 'Intermediate' }))
          
        const newSoft = result.skills.soft
          .filter(skill => !currentSoft.includes(skill.toLowerCase()))
        
        const updated = {
          technical: [...data.technical, ...newTechnical],
          soft: [...data.soft, ...newSoft]
        }
        
        onChange('skills', null, updated)
        alert(`Added ${newTechnical.length} technical skills and ${newSoft.length} soft skills!`)
      }
    } catch (error) {
      console.error('Skills generation error:', error)
      alert('Failed to generate skills. Please try again.')
    } finally {
      setIsGeneratingSkills(false)
    }
  }

  const commonTechnicalSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML/CSS', 
    'Git', 'AWS', 'Docker', 'MongoDB', 'TypeScript', 'Vue.js', 'Angular'
  ]

  const commonSoftSkills = [
    'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 
    'Project Management', 'Critical Thinking', 'Adaptability', 'Time Management',
    'Creativity', 'Analytical Skills', 'Customer Service', 'Presentation Skills'
  ]

  const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  const levelConfig = {
    Beginner:     { bars: 1, color: 'bg-red-400',    text: 'text-red-600'    },
    Intermediate: { bars: 2, color: 'bg-yellow-400', text: 'text-yellow-600' },
    Advanced:     { bars: 3, color: 'bg-blue-500',   text: 'text-blue-600'   },
    Expert:       { bars: 4, color: 'bg-green-500',  text: 'text-green-600'  },
  }

  return (
    <div className="space-y-8">
      {/* AI Skills Generation */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <FiZap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">AI Skills Generator</h3>
              <p className="text-sm text-gray-600">Generate relevant skills based on your experience and projects</p>
            </div>
          </div>
          <button
            onClick={generateAISkills}
            disabled={isGeneratingSkills}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isGeneratingSkills ? <><FiRefreshCw size={16} className="animate-spin" />Generating...</> : <><FiZap size={16} />Generate Skills</>}
          </button>
        </div>
      </div>

      {/* Technical Skills */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiCode size={24} className="text-violet-600" />
          <h3 className="text-xl font-semibold text-gray-800">Technical Skills</h3>
        </div>

        {/* Add input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTechnicalSkill}
            onChange={(e) => setNewTechnicalSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTechnicalSkill()}
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Add a technical skill..."
          />
          <Button onClick={addTechnicalSkill} className="flex items-center gap-2">
            <FiPlus size={16} />Add
          </Button>
        </div>

        {/* Quick add */}
        <div className="mb-5">
          <p className="text-sm text-gray-600 mb-2">Quick add popular skills:</p>
          <div className="flex flex-wrap gap-2">
            {commonTechnicalSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => {
                  if (!data.technical.some(s => (s.name || s).toLowerCase() === skill.toLowerCase())) {
                    onChange('skills', null, { ...data, technical: [...data.technical, { name: skill, level: 'Intermediate' }] })
                  }
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-violet-100 text-gray-700 rounded-full transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>

        {/* ATS-style skill cards */}
        {data.technical.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiCode size={32} className="mx-auto mb-2 opacity-50" />
            <p>No technical skills added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.technical.map((skill, index) => {
              const level = skill.level || 'Intermediate'
              const cfg = levelConfig[level] || levelConfig.Intermediate
              return (
                <div key={index} className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-sm">{skill.name || skill}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={level}
                        onChange={(e) => updateTechnicalSkillLevel(index, e.target.value)}
                        className={`text-xs font-medium border-0 bg-transparent focus:outline-none cursor-pointer ${cfg.text}`}
                      >
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <button onClick={() => removeTechnicalSkill(index)} className="text-red-400 hover:text-red-600">
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>
                  {/* Proficiency bar */}
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4].map(bar => (
                      <div
                        key={bar}
                        onClick={() => updateTechnicalSkillLevel(index, LEVELS[bar - 1])}
                        className={`h-1.5 flex-1 rounded-full cursor-pointer transition-colors ${
                          bar <= cfg.bars ? cfg.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Soft Skills */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiUsers size={24} className="text-fuchsia-600" />
          <h3 className="text-xl font-semibold text-gray-800">Soft Skills</h3>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newSoftSkill}
            onChange={(e) => setNewSoftSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSoftSkill()}
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-fuchsia-500 transition-colors"
            placeholder="Add a soft skill..."
          />
          <Button onClick={addSoftSkill} className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700">
            <FiPlus size={16} />Add
          </Button>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Quick add popular skills:</p>
          <div className="flex flex-wrap gap-2">
            {commonSoftSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => {
                  if (!data.soft.includes(skill)) {
                    onChange('skills', null, { ...data, soft: [...data.soft, skill] })
                  }
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-fuchsia-100 text-gray-700 rounded-full transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
        {data.soft.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiUsers size={32} className="mx-auto mb-2 opacity-50" />
            <p>No soft skills added yet</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.soft.map((skill, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-2 bg-fuchsia-100 text-fuchsia-800 rounded-full">
                <span className="font-medium text-sm">{skill}</span>
                <button onClick={() => removeSoftSkill(index)} className="text-fuchsia-500 hover:text-fuchsia-700">
                  <FiX size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills Summary */}
      <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <FiTrendingUp size={20} className="text-violet-600" />
          <h4 className="font-semibold text-gray-800">Skills Summary</h4>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium text-gray-700">Technical:</span><span className="ml-2 text-violet-600 font-semibold">{data.technical.length}</span></div>
          <div><span className="font-medium text-gray-700">Soft:</span><span className="ml-2 text-fuchsia-600 font-semibold">{data.soft.length}</span></div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Total: <span className="font-semibold">{data.technical.length + data.soft.length}</span> skills
          {data.technical.length + data.soft.length >= 10 && <span className="ml-2 text-green-600 font-medium">✓ Great skill diversity!</span>}
          {data.technical.length + data.soft.length < 5 && <span className="ml-2 text-orange-600 font-medium">⚠ Add more skills for better ATS score</span>}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button onClick={onPrev} variant="outline">← Previous</Button>
        <Button onClick={handleNext}>Next Step →</Button>
      </div>
    </div>
  )
}

export default Skills