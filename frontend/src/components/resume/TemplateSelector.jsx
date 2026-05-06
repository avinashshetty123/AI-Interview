import { useState } from 'react'
import { FiZap, FiGrid, FiList } from 'react-icons/fi'
import TemplateCard from './TemplateCard'
import TemplateGuidance from './TemplateGuidance'

const TemplateSelector = ({ 
  templates, 
  selectedTemplate, 
  onTemplateSelect,
  showGuidance = true 
}) => {
  const [layout, setLayout] = useState('horizontal') // 'horizontal' or 'vertical'
  const [selectedCategory, setSelectedCategory] = useState('all')

  const getTemplatesByCategory = () => {
    const categories = {}
    templates.forEach(template => {
      if (!categories[template.category]) {
        categories[template.category] = []
      }
      categories[template.category].push(template)
    })
    return categories
  }

  const getFilteredTemplates = () => {
    if (selectedCategory === 'all') {
      return templates
    }
    return templates.filter(template => template.category === selectedCategory)
  }

  const categories = ['all', ...Object.keys(getTemplatesByCategory())]

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full flex items-center justify-center">
            <FiZap size={24} className="text-white" />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-800">Choose Your Perfect Template</h4>
            <p className="text-gray-600">Select a professionally designed template that matches your industry</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Layout Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Layout:</span>
            <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setLayout('horizontal')}
                className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  layout === 'horizontal'
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FiList size={16} />
                List
              </button>
              <button
                onClick={() => setLayout('vertical')}
                className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  layout === 'vertical'
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FiGrid size={16} />
                Grid
              </button>
            </div>
          </div>

          {/* Selected Template Info */}
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Currently Selected:</div>
            <div className="font-semibold text-violet-600">
              {templates.find(t => t.id === selectedTemplate)?.name || 'Modern Professional'}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All Templates' : `${category} Templates`}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Display */}
      {layout === 'horizontal' ? (
        <div className="space-y-4">
          {getFilteredTemplates().map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate === template.id}
              onSelect={onTemplateSelect}
              layout="horizontal"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(getTemplatesByCategory()).map(([category, categoryTemplates]) => {
            // Filter by selected category if not 'all'
            if (selectedCategory !== 'all' && selectedCategory !== category) {
              return null
            }

            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px bg-gradient-to-r from-gray-300 to-transparent flex-1"></div>
                  <h5 className="text-lg font-bold text-gray-700 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                    {category} Templates
                  </h5>
                  <div className="h-px bg-gradient-to-l from-gray-300 to-transparent flex-1"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categoryTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplate === template.id}
                      onSelect={onTemplateSelect}
                      layout="vertical"
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Template Count */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Showing {getFilteredTemplates().length} of {templates.length} templates
          {selectedCategory !== 'all' && ` in ${selectedCategory} category`}
        </p>
      </div>

      {/* Template Guidance */}
      {showGuidance && <TemplateGuidance />}
    </div>
  )
}

export default TemplateSelector