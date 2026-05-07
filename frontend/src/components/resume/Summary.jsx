import { useState } from 'react'
import { FiEdit3, FiZap, FiRefreshCw, FiCheck } from 'react-icons/fi'
import { apiUrl } from '../../lib/api'

const Summary = ({ data, onChange, onNext, onPrev, resumeData, onOptimizeText }) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  const getSkillName = (skill) => {
    if (typeof skill === 'string') return skill
    if (skill && typeof skill === 'object') return skill.name || skill.label || skill.title || skill.value || ''
    return ''
  }

  const cleanSummaryText = (text) => {
    return String(text || '')
      .replace(/\[object Object\]/gi, '')
      .replace(/\s+,/g, ',')
      .replace(/,\s*,+/g, ',')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  const generateAISummary = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(apiUrl('/resume/generate-summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          personalInfo: resumeData.personalInfo,
          skills: resumeData.skills,
          experience: resumeData.experience,
          education: resumeData.education
        })
      })
      
      const result = await response.json()
      if (result.success) {
        onChange(null, 'summary', cleanSummaryText(result.summary))
      }
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const optimizeSummary = async () => {
    if (!onOptimizeText || !data?.trim()) return
    
    setIsOptimizing(true)
    try {
      const optimizedText = await onOptimizeText(
        data, 
        'summary',
        { 
          skills: [...(resumeData.skills?.technical || []), ...(resumeData.skills?.soft || [])]
            .map(getSkillName)
            .filter(Boolean),
          experience: resumeData.experience?.length || 0
        }
      )
      
      if (optimizedText && optimizedText !== data) {
        onChange(null, 'summary', cleanSummaryText(optimizedText))
      }
    } catch (error) {
      console.error('Failed to optimize summary:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const applySuggestion = (suggestion) => {
    onChange(null, 'summary', suggestion)
  }

  const wordCount = data.split(' ').filter(word => word.trim()).length
  const isOptimal = wordCount >= 50 && wordCount <= 150

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Professional Summary</h2>
        <p className="text-gray-600">Create an ATS-optimized summary that highlights your key achievements</p>
      </div>

      {/* AI Generation Section */}
      <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 p-6 rounded-xl border border-violet-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full flex items-center justify-center">
              <FiZap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">AI Summary Generator</h3>
              <p className="text-sm text-gray-600">Let AI create a perfect summary based on your information</p>
            </div>
          </div>
          <button
            onClick={generateAISummary}
            disabled={isGenerating}
            className="px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <FiRefreshCw size={16} className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FiZap size={16} className="mr-2" />
                Generate Summary
              </>
            )}
          </button>
        </div>
        
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">AI Suggestions:</p>
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex-1 text-sm text-gray-700">{suggestion}</div>
                <button
                  onClick={() => applySuggestion(suggestion)}
                  className="px-3 py-1 text-xs bg-violet-100 text-violet-700 rounded-md hover:bg-violet-200 transition-colors"
                >
                  Use This
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Input Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-700">
            Professional Summary
          </label>
          <div className="flex items-center gap-2">
            {onOptimizeText && (
              <button
                onClick={optimizeSummary}
                disabled={isOptimizing || !data?.trim()}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isOptimizing ? (
                  <FiRefreshCw size={14} className="animate-spin" />
                ) : (
                  <FiZap size={14} />
                )}
                {isOptimizing ? 'Optimizing...' : 'AI Optimize'}
              </button>
            )}
            <div className={`text-sm font-medium ${isOptimal ? 'text-green-600' : 'text-orange-600'}`}>
              {wordCount} words {isOptimal ? '✓ Optimal' : '(50-150 recommended)'}
            </div>
          </div>
        </div>
        
        <div className="relative">
          <textarea
            value={data}
            onChange={(e) => onChange(null, 'summary', e.target.value)}
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors resize-none"
            rows={8}
            placeholder="Write a compelling professional summary that highlights your key achievements, skills, and career objectives. Focus on quantifiable results and relevant experience that matches your target role..."
          />
          <FiEdit3 size={18} className="absolute top-4 right-4 text-gray-400" />
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">💡 ATS Optimization Tips:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Include relevant keywords from your target job description</li>
            <li>• Quantify achievements with specific numbers and percentages</li>
            <li>• Keep it between 50-150 words for optimal ATS scanning</li>
            <li>• Focus on your most recent and relevant experience</li>
            <li>• Use action verbs like "achieved," "developed," "managed"</li>
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
        >
          Next Step →
        </button>
      </div>
    </div>
  )
}

export default Summary
