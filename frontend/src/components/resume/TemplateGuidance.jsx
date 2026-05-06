const TemplateGuidance = () => {
  const guidanceData = [
    {
      icon: '🏢',
      title: 'Corporate Roles',
      description: 'Choose Classic or Executive templates for traditional industries like banking, consulting, or law.',
      templates: ['Classic Corporate', 'Executive Leadership'],
      color: 'blue'
    },
    {
      icon: '💻',
      title: 'Tech Positions',
      description: 'Modern or Tech templates work best for software engineering, data science, or IT roles.',
      templates: ['Modern Professional', 'Tech Specialist'],
      color: 'purple'
    },
    {
      icon: '🎨',
      title: 'Creative Fields',
      description: 'Creative templates are perfect for design, marketing, or media positions where personality matters.',
      templates: ['Creative Professional'],
      color: 'pink'
    },
    {
      icon: '📊',
      title: 'Management Roles',
      description: 'Executive templates showcase leadership experience and are ideal for senior positions.',
      templates: ['Executive Leadership', 'Modern Professional'],
      color: 'green'
    },
    {
      icon: '🎯',
      title: 'Entry Level',
      description: 'Clean, minimal templates help focus on education and skills when experience is limited.',
      templates: ['Minimal Clean', 'Modern Professional'],
      color: 'orange'
    },
    {
      icon: '🔍',
      title: 'ATS Optimization',
      description: 'All templates are ATS-friendly, but Minimal Clean offers maximum compatibility.',
      templates: ['Minimal Clean'],
      color: 'emerald'
    }
  ]

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      accent: 'text-blue-700'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      accent: 'text-purple-700'
    },
    pink: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-800',
      accent: 'text-pink-700'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      accent: 'text-green-700'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      accent: 'text-orange-700'
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      accent: 'text-emerald-700'
    }
  }

  return (
    <div className="mt-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
      <h5 className="text-lg font-bold text-blue-800 mb-6 flex items-center gap-2">
        <span className="text-xl">💡</span>
        Template Selection Guide
      </h5>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guidanceData.map((guide, index) => {
          const colors = colorClasses[guide.color]
          
          return (
            <div 
              key={index} 
              className={`${colors.bg} rounded-lg p-4 border ${colors.border} hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl flex-shrink-0">{guide.icon}</span>
                <div className="flex-1">
                  <div className={`font-semibold ${colors.text} mb-2`}>
                    {guide.title}
                  </div>
                  <div className={`text-sm ${colors.accent} leading-relaxed`}>
                    {guide.description}
                  </div>
                </div>
              </div>
              
              {guide.templates.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    Recommended Templates:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {guide.templates.map((template, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-white text-gray-700 px-2 py-1 rounded-md border border-gray-200 font-medium"
                      >
                        {template}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Tips */}
      <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
        <h6 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <span>⚡</span>
          Quick Selection Tips
        </h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span className="text-blue-700">
              <strong>Higher ATS scores</strong> mean better compatibility with applicant tracking systems
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span className="text-blue-700">
              <strong>Match your industry</strong> - conservative fields prefer traditional designs
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span className="text-blue-700">
              <strong>Consider your experience level</strong> - minimal designs work well for entry-level
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span className="text-blue-700">
              <strong>You can always change</strong> your template selection before downloading
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateGuidance