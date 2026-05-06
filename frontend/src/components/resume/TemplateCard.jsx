import { FiCheck } from 'react-icons/fi'

const TemplateCard = ({ 
  template, 
  isSelected, 
  onSelect, 
  layout = 'vertical' // 'vertical' or 'horizontal'
}) => {
  const handleClick = () => {
    onSelect(template.id)
  }

  if (layout === 'horizontal') {
    return (
      <div
        className={`group relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
          isSelected
            ? 'border-violet-500 bg-gradient-to-r from-violet-50 to-fuchsia-50 shadow-lg ring-2 ring-violet-200'
            : 'border-gray-200 hover:border-violet-300 bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-violet-50'
        }`}
        onClick={handleClick}
      >
        {/* Selection Badge */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-full p-2 shadow-lg animate-pulse">
            <FiCheck size={16} />
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Mini Preview */}
          <div className="flex-shrink-0 w-20 h-24 bg-gradient-to-br from-gray-100 via-gray-50 to-white rounded-lg flex items-center justify-center relative overflow-hidden border border-gray-200 group-hover:border-violet-300 transition-colors">
            {/* Mock Resume Layout */}
            <div className="absolute inset-2 space-y-1">
              {/* Header */}
              <div className="h-1 bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full w-3/4"></div>
              <div className="h-0.5 bg-gray-300 rounded w-1/2"></div>
              
              {/* Content Lines */}
              <div className="space-y-0.5 pt-1">
                <div className="h-0.5 bg-gray-400 rounded w-full"></div>
                <div className="h-0.5 bg-gray-300 rounded w-4/5"></div>
                <div className="h-0.5 bg-gray-300 rounded w-3/4"></div>
              </div>
              
              {/* Section */}
              <div className="pt-1">
                <div className="h-0.5 bg-violet-300 rounded w-1/3 mb-0.5"></div>
                <div className="space-y-0.5">
                  <div className="h-0.5 bg-gray-300 rounded w-full"></div>
                  <div className="h-0.5 bg-gray-300 rounded w-5/6"></div>
                </div>
              </div>
            </div>
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-semibold text-violet-600 shadow-lg">
                Preview
              </div>
            </div>
          </div>

          {/* Template Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h6 className="font-bold text-lg text-gray-800 group-hover:text-violet-700 transition-colors truncate">
                {template.name}
              </h6>
              <div className="flex items-center gap-2 ml-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  template.atsScore >= 95 ? 'bg-green-500' :
                  template.atsScore >= 90 ? 'bg-yellow-500' : 'bg-orange-500'
                }`}></div>
                <span className="text-sm font-semibold text-gray-700">
                  {template.atsScore}%
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {template.description}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 px-2 py-1 rounded-full font-medium border border-violet-200">
                {template.category}
              </span>
              <span className="text-xs text-gray-500 truncate ml-2">
                {template.bestFor}
              </span>
            </div>
          </div>
        </div>
        
        {/* Selection Indicator */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl transition-all duration-300 ${
          isSelected
            ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
            : 'bg-transparent group-hover:bg-gradient-to-r group-hover:from-violet-300 group-hover:to-fuchsia-300'
        }`}></div>
      </div>
    )
  }

  // Vertical layout (original)
  return (
    <div
      className={`group relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
        isSelected
          ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-fuchsia-50 shadow-xl ring-4 ring-violet-200'
          : 'border-gray-200 hover:border-violet-300 bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-violet-50'
      }`}
      onClick={handleClick}
    >
      {/* Selection Badge */}
      {isSelected && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-full p-3 shadow-lg animate-pulse">
          <FiCheck size={20} />
        </div>
      )}
      
      {/* Template Preview */}
      <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 via-gray-50 to-white rounded-xl mb-6 flex items-center justify-center relative overflow-hidden border border-gray-200 group-hover:border-violet-300 transition-colors">
        {/* Mock Resume Layout */}
        <div className="absolute inset-4 space-y-2">
          {/* Header */}
          <div className="h-3 bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full w-3/4"></div>
          <div className="h-2 bg-gray-300 rounded w-1/2"></div>
          
          {/* Content Lines */}
          <div className="space-y-1 pt-2">
            <div className="h-1.5 bg-gray-400 rounded w-full"></div>
            <div className="h-1.5 bg-gray-300 rounded w-4/5"></div>
            <div className="h-1.5 bg-gray-300 rounded w-3/4"></div>
          </div>
          
          {/* Section */}
          <div className="pt-2">
            <div className="h-2 bg-violet-300 rounded w-1/3 mb-1"></div>
            <div className="space-y-1">
              <div className="h-1 bg-gray-300 rounded w-full"></div>
              <div className="h-1 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
          
          {/* Another Section */}
          <div className="pt-2">
            <div className="h-2 bg-fuchsia-300 rounded w-1/4 mb-1"></div>
            <div className="space-y-1">
              <div className="h-1 bg-gray-300 rounded w-4/5"></div>
              <div className="h-1 bg-gray-300 rounded w-3/5"></div>
            </div>
          </div>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold text-violet-600 shadow-lg">
            Preview Template
          </div>
        </div>
      </div>
      
      {/* Template Info */}
      <div className="space-y-4">
        <div>
          <h6 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-violet-700 transition-colors">
            {template.name}
          </h6>
          <p className="text-sm text-gray-600 leading-relaxed">
            {template.description}
          </p>
        </div>
        
        {/* ATS Score Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              template.atsScore >= 95 ? 'bg-green-500' :
              template.atsScore >= 90 ? 'bg-yellow-500' : 'bg-orange-500'
            }`}></div>
            <span className="text-sm font-semibold text-gray-700">
              ATS Score: 
              <span className={`ml-1 ${
                template.atsScore >= 95 ? 'text-green-600' :
                template.atsScore >= 90 ? 'text-yellow-600' : 'text-orange-600'
              }`}>
                {template.atsScore}%
              </span>
            </span>
          </div>
          
          <span className="text-xs bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 px-3 py-1 rounded-full font-medium border border-violet-200">
            {template.category}
          </span>
        </div>
        
        {/* Best For */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Best For
          </div>
          <div className="text-sm text-gray-700 font-medium">
            {template.bestFor}
          </div>
        </div>
        
        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {[
            template.atsScore >= 95 && 'ATS Optimized',
            template.category === 'Professional' && 'Clean Design',
            template.category === 'Creative' && 'Eye-catching',
            template.category === 'Minimal' && 'Simple',
            template.category === 'Executive' && 'Sophisticated',
            template.category === 'Technical' && 'Skills Focused'
          ].filter(Boolean).map((feature, index) => (
            <span key={index} className="text-xs bg-white text-gray-600 px-2 py-1 rounded-md border border-gray-200 font-medium">
              {feature}
            </span>
          ))}
        </div>
      </div>
      
      {/* Selection Indicator */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all duration-300 ${
        isSelected
          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
          : 'bg-transparent group-hover:bg-gradient-to-r group-hover:from-violet-300 group-hover:to-fuchsia-300'
      }`}></div>
    </div>
  )
}

export default TemplateCard