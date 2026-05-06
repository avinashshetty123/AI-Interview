import { useState } from 'react'
import { FiUser, FiMail, FiPhone, FiMapPin, FiLinkedin, FiGithub, FiGlobe, FiCamera } from 'react-icons/fi'

const PersonalInfo = ({ data = {}, onChange, onNext }) => {
  const [errors, setErrors] = useState({})

  const urlPatterns = {
    linkedin: { re: /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/, hint: 'https://linkedin.com/in/username' },
    github:   { re: /^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/,   hint: 'https://github.com/username' },
    website:  { re: /^https?:\/\/.+\..+/,                              hint: 'https://example.com' },
  }

  const handleChange = (field, value) => {
    onChange('personalInfo', field, value)
    // Real-time URL validation
    if (urlPatterns[field]) {
      if (value && !urlPatterns[field].re.test(value)) {
        setErrors(prev => ({ ...prev, [field]: `Enter a valid URL — e.g. ${urlPatterns[field].hint}` }))
      } else {
        setErrors(prev => ({ ...prev, [field]: '' }))
      }
    } else if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        handleChange('profilePicture', e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

const validate = () => {
    const newErrors = {}
    const requiredFields = ['fullName', 'email', 'phone', 'location']
    
    requiredFields.forEach(field => {
      if (!data[field]?.trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`
      }
    })

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    Object.entries(urlPatterns).forEach(([field, { re, hint }]) => {
      if (data[field] && !re.test(data[field])) {
        newErrors[field] = `Enter a valid URL — e.g. ${hint}`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      onNext()
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 flex items-center justify-center overflow-hidden">
            {data?.profilePicture ? (
              <img src={data.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <FiUser size={48} className="text-white" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
            <FiCamera size={16} className="text-gray-600" />
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
        <p className="text-sm text-gray-500">Upload your professional photo (optional)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
          <div className="relative">
            <FiUser size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={data.fullName || ''}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
              }`}
              placeholder="John Doe"
            />
          </div>
          {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
          <div className="relative">
            <FiMail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
              }`}
              placeholder="john@example.com"
            />
          </div>
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
          <div className="relative">
            <FiPhone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={data.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
              }`}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
          <div className="relative">
            <FiMapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={data.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.location ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
              }`}
              placeholder="New York, NY"
            />
          </div>
          {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn Profile</label>
          <div className="relative">
            <FiLinkedin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={data.linkedin || ''}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.linkedin ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
              }`}
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>
          {errors.linkedin && <p className="text-sm text-red-600 mt-1">{errors.linkedin}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub Profile</label>
          <div className="relative">
            <FiGithub size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={data.github || ''}
              onChange={(e) => handleChange('github', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.github ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
              }`}
              placeholder="https://github.com/johndoe"
            />
          </div>
          {errors.github && <p className="text-sm text-red-600 mt-1">{errors.github}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Personal Website</label>
          <div className="relative">
            <FiGlobe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={data.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.website ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
              }`}
              placeholder="https://johndoe.com"
            />
          </div>
          {errors.website && <p className="text-sm text-red-600 mt-1">{errors.website}</p>}
        </div>
      </div>

      <div className="flex justify-end">
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

export default PersonalInfo