import { useState } from 'react'
import { FiBook, FiPlus, FiTrash2, FiCalendar, FiMapPin } from 'react-icons/fi'

const Education = ({ data, onChange, onNext, onPrev }) => {
  const [errors, setErrors] = useState({})
  
  // Ensure data is always an array
  const educationData = Array.isArray(data) ? data : [];

  const addEducation = () => {
    const newEducation = {
      id: Date.now(),
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      description: '',
      isCurrentlyStudying: false
    }
    onChange('education', null, [...educationData, newEducation])
  }

  const removeEducation = (index) => {
    const updated = educationData.filter((_, i) => i !== index)
    onChange('education', null, updated)
  }

  const validate = () => {
    const newErrors = {}
    
    educationData.forEach((edu, index) => {
      if (!edu.degree?.trim()) {
        newErrors[`${index}-degree`] = 'Degree is required'
      }
      if (!edu.institution?.trim()) {
        newErrors[`${index}-institution`] = 'Institution is required'
      }
      // Only require end date if not currently studying
      if (!edu.endDate?.trim() && !edu.isCurrentlyStudying) {
        newErrors[`${index}-endDate`] = 'End date is required (or check "Currently studying here")';
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (educationData.length === 0) {
      setErrors({ general: 'At least one education entry is required' })
      return
    }
    if (validate()) {
      onNext()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Education</h2>
        <p className="text-gray-600">Add your educational background and qualifications</p>
      </div>

      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium">{errors.general}</p>
        </div>
      )}

      {educationData.length === 0 ? (
        <div className="text-center py-16 bg-red-50 rounded-lg border-2 border-red-200">
          <FiBook size={32} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-700 mb-2">Education Required *</h3>
          <p className="text-red-600 mb-6">At least one education entry is required for your resume</p>
          <button
            onClick={addEducation}
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <FiPlus size={16} />
            Add Education
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {educationData.map((edu, index) => (
            <div key={edu.id || index} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FiBook size={18} className="text-blue-600" />
                  Education #{index + 1}
                </h3>
                {educationData.length > 1 && (
                  <button
                    onClick={() => removeEducation(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Degree */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Degree / Qualification *
                  </label>
                  <input
                    type="text"
                    value={edu.degree || ''}
                    onChange={(e) => {
                      const updated = [...educationData];
                      updated[index] = { ...updated[index], degree: e.target.value };
                      onChange('education', null, updated);
                      
                      // Clear errors for this field
                      if (errors[`${index}-degree`]) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[`${index}-degree`];
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`${index}-degree`] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Bachelor of Science in Computer Science"
                  />
                  {errors[`${index}-degree`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}-degree`]}</p>}
                </div>

                {/* Institution */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution *
                  </label>
                  <input
                    type="text"
                    value={edu.institution || ''}
                    onChange={(e) => {
                      const updated = [...educationData];
                      updated[index] = { ...updated[index], institution: e.target.value };
                      onChange('education', null, updated);
                      
                      // Clear errors for this field
                      if (errors[`${index}-institution`]) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[`${index}-institution`];
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`${index}-institution`] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="University of California, Berkeley"
                  />
                  {errors[`${index}-institution`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}-institution`]}</p>}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <FiMapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={edu.location || ''}
                      onChange={(e) => {
                        const updated = [...educationData];
                        updated[index] = { ...updated[index], location: e.target.value };
                        onChange('education', null, updated);
                      }}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Berkeley, CA"
                    />
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <FiCalendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="month"
                      value={edu.startDate || ''}
                      onChange={(e) => {
                        const updated = [...educationData];
                        updated[index] = { ...updated[index], startDate: e.target.value };
                        onChange('education', null, updated);
                      }}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date {!edu.isCurrentlyStudying && '*'}
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <FiCalendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="month"
                        value={edu.isCurrentlyStudying ? '' : (edu.endDate || '')}
                        onChange={(e) => {
                          const updated = [...educationData];
                          updated[index] = { ...updated[index], endDate: e.target.value };
                          onChange('education', null, updated);
                          
                          // Clear errors for this field
                          if (errors[`${index}-endDate`]) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[`${index}-endDate`];
                              return newErrors;
                            });
                          }
                        }}
                        disabled={edu.isCurrentlyStudying}
                        className={`w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          edu.isCurrentlyStudying ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 
                          errors[`${index}-endDate`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder={edu.isCurrentlyStudying ? 'Currently studying' : 'Select end date'}
                      />
                      {edu.isCurrentlyStudying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 rounded-md">
                          <span className="text-sm text-gray-600 font-medium">Currently Studying</span>
                        </div>
                      )}
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
                      <input
                        type="checkbox"
                        checked={Boolean(edu.isCurrentlyStudying)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          
                          // Update the education item
                          const updated = [...educationData];
                          updated[index] = { 
                            ...updated[index], 
                            isCurrentlyStudying: isChecked,
                            endDate: isChecked ? '' : updated[index].endDate
                          };
                          
                          // Call parent onChange
                          onChange('education', null, updated);
                          
                          // Clear validation error if currently studying
                          if (isChecked && errors[`${index}-endDate`]) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[`${index}-endDate`];
                              return newErrors;
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700 select-none">
                        I am currently studying here
                      </span>
                    </label>
                  </div>
                  {errors[`${index}-endDate`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}-endDate`]}</p>}
                </div>

                {/* GPA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GPA (Optional)
                  </label>
                  <input
                    type="text"
                    value={edu.gpa || ''}
                    onChange={(e) => {
                      const updated = [...educationData];
                      updated[index] = { ...updated[index], gpa: e.target.value };
                      onChange('education', null, updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3.8/4.0"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={edu.description || ''}
                    onChange={(e) => {
                      const updated = [...educationData];
                      updated[index] = { ...updated[index], description: e.target.value };
                      onChange('education', null, updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Relevant coursework, honors, achievements, or activities..."
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add More Button */}
          <button
            onClick={addEducation}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center justify-center gap-2"
          >
            <FiPlus size={20} />
            Add Another Education
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
        >
          ← Previous
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
        >
          Next Step →
        </button>
      </div>
    </div>
  )
}

export default Education