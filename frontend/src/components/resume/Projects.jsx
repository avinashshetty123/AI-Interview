import { useState } from 'react'
import { FiTarget, FiPlus, FiTrash2, FiGithub, FiExternalLink, FiCode, FiZap, FiRefreshCw } from 'react-icons/fi'
import { Button } from '../ui/button'

const Projects = ({ data = [], onChange, onNext, onPrev, onOptimizeText }) => {
  const [errors, setErrors] = useState({})
  const [optimizing, setOptimizing] = useState({})

  const addProject = () => {
    const newProject = {
      id: Date.now(),
      name: '',
      description: '',
      technologies: [],
      githubUrl: '',
      liveUrl: '',
      startDate: '',
      endDate: '',
      highlights: ['']
    }
    onChange('projects', null, [...data, newProject])
  }

  const updateProject = (index, field, value) => {
    const updated = [...data]
    updated[index][field] = value
    onChange('projects', null, updated)
  }

  const removeProject = (index) => {
    const updated = data.filter((_, i) => i !== index)
    onChange('projects', null, updated)
  }

  const addTechnology = (projectIndex, tech) => {
    if (tech.trim()) {
      const updated = [...data]
      updated[projectIndex].technologies.push(tech.trim())
      onChange('projects', null, updated)
    }
  }

  const removeTechnology = (projectIndex, techIndex) => {
    const updated = [...data]
    updated[projectIndex].technologies = updated[projectIndex].technologies.filter((_, i) => i !== techIndex)
    onChange('projects', null, updated)
  }

  const addHighlight = (projectIndex) => {
    const updated = [...data]
    updated[projectIndex].highlights.push('')
    onChange('projects', null, updated)
  }

  const updateHighlight = (projectIndex, highlightIndex, value) => {
    const updated = [...data]
    updated[projectIndex].highlights[highlightIndex] = value
    onChange('projects', null, updated)
  }

  const removeHighlight = (projectIndex, highlightIndex) => {
    const updated = [...data]
    updated[projectIndex].highlights = updated[projectIndex].highlights.filter((_, i) => i !== highlightIndex)
    onChange('projects', null, updated)
  }

  const optimizeDescription = async (index) => {
    if (!onOptimizeText || !data[index]?.description) return
    
    setOptimizing(prev => ({ ...prev, [`${index}_description`]: true }))
    
    try {
      const optimizedText = await onOptimizeText(
        data[index].description, 
        'project',
        { name: data[index].name, technologies: data[index].technologies }
      )
      
      if (optimizedText && optimizedText !== data[index].description) {
        updateProject(index, 'description', optimizedText)
      }
    } catch (error) {
      console.error('Failed to optimize description:', error)
    } finally {
      setOptimizing(prev => ({ ...prev, [`${index}_description`]: false }))
    }
  }

  const validateUrl = (url, type) => {
    if (!url) return true // Optional fields
    
    try {
      const urlObj = new URL(url)
      
      switch (type) {
        case 'github':
          return urlObj.hostname === 'github.com' || urlObj.hostname === 'www.github.com'
        case 'live':
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
        default:
          return true
      }
    } catch {
      return false
    }
  }

  const validate = () => {
    const newErrors = {}
    data.forEach((project, index) => {
      if (!project.name?.trim()) newErrors[`${index}_name`] = 'Project name is required'
      if (!project.description?.trim()) newErrors[`${index}_description`] = 'Project description is required'
      
      // URL validations
      if (project.githubUrl && !validateUrl(project.githubUrl, 'github')) {
        newErrors[`${index}_githubUrl`] = 'Please enter a valid GitHub URL (e.g., https://github.com/username/project)'
      }
      
      if (project.liveUrl && !validateUrl(project.liveUrl, 'live')) {
        newErrors[`${index}_liveUrl`] = 'Please enter a valid URL (e.g., https://example.com)'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    // Projects are optional, so we can proceed even with no entries
    if (data.length > 0 && !validate()) {
      return // Only validate if there are entries
    }
    onNext()
  }

  const commonTechnologies = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'MongoDB', 'PostgreSQL',
    'Express.js', 'Next.js', 'Vue.js', 'Django', 'Flask', 'AWS', 'Docker', 'Git'
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Projects</h3>
        <Button onClick={addProject} className="flex items-center gap-2">
          <FiPlus size={16} />
          Add Project
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-green-50 rounded-xl border border-green-200">
          <FiTarget size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="text-lg font-medium text-green-700 mb-2">No Projects (Optional)</h3>
          <p className="text-green-600 mb-4">You can add projects to showcase your skills, or skip this section</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={addProject} className="bg-green-600 hover:bg-green-700">
              Add Project
            </Button>
            <Button onClick={onNext} variant="outline" className="border-green-300 text-green-700">
              Skip This Section
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((project, index) => (
            <div key={project.id} className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Project {index + 1}</h4>
                <Button
                  onClick={() => removeProject(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                >
                  <FiTrash2 size={16} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={project.name}
                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors[`${index}_name`] ? 'border-red-300' : 'border-gray-200 focus:border-violet-500'
                    }`}
                    placeholder="E-commerce Website"
                  />
                  {errors[`${index}_name`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}_name`]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="month"
                    value={project.startDate}
                    onChange={(e) => updateProject(index, 'startDate', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="month"
                    value={project.endDate}
                    onChange={(e) => updateProject(index, 'endDate', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub URL</label>
                  <div className="relative">
                    <FiGithub size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      value={project.githubUrl}
                      onChange={(e) => updateProject(index, 'githubUrl', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        errors[`${index}_githubUrl`] ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
                      }`}
                      placeholder="https://github.com/username/project"
                    />
                  </div>
                  {errors[`${index}_githubUrl`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}_githubUrl`]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Live Demo URL</label>
                  <div className="relative">
                    <FiExternalLink size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      value={project.liveUrl}
                      onChange={(e) => updateProject(index, 'liveUrl', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        errors[`${index}_liveUrl`] ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
                      }`}
                      placeholder="https://myproject.com"
                    />
                  </div>
                  {errors[`${index}_liveUrl`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}_liveUrl`]}</p>}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Project Description *</label>
                  {onOptimizeText && (
                    <Button
                      onClick={() => optimizeDescription(index)}
                      disabled={optimizing[`${index}_description`] || !project.description?.trim()}
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
                  value={project.description}
                  onChange={(e) => updateProject(index, 'description', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors[`${index}_description`] ? 'border-red-300' : 'border-gray-200 focus:border-violet-500'
                  }`}
                  rows="3"
                  placeholder="Brief description of what the project does and its purpose..."
                />
                {errors[`${index}_description`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}_description`]}</p>}
              </div>

              {/* Technologies */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Technologies Used</label>
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {commonTechnologies.map((tech) => (
                      <button
                        key={tech}
                        onClick={() => {
                          if (!project.technologies.includes(tech)) {
                            addTechnology(index, tech)
                          }
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-violet-100 text-gray-700 rounded-md transition-colors"
                      >
                        + {tech}
                      </button>
                    ))}
                  </div>
                </div>
                
                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {project.technologies.map((tech, techIndex) => (
                      <div key={techIndex} className="flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm">
                        <FiCode size={12} />
                        <span>{tech}</span>
                        <button
                          onClick={() => removeTechnology(index, techIndex)}
                          className="ml-1 text-violet-600 hover:text-violet-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTechnology(index, e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="Type a technology and press Enter..."
                />
              </div>

              {/* Project Highlights */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Key Features/Highlights</label>
                  <Button
                    onClick={() => addHighlight(index)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <FiPlus size={14} />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {project.highlights.map((highlight, highlightIndex) => (
                    <div key={highlightIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={highlight}
                        onChange={(e) => updateHighlight(index, highlightIndex, e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
                        placeholder="• Implemented user authentication system..."
                      />
                      {project.highlights.length > 1 && (
                        <Button
                          onClick={() => removeHighlight(index, highlightIndex)}
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

export default Projects