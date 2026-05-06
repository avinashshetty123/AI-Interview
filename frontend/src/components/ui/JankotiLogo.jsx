import React from 'react'
import logo from '../../assets/Logo.png'

const JankotiLogo = ({ size = 'md', className = '' }) => {
  const heights = { sm: 'h-6', md: 'h-8', lg: 'h-10', xl: 'h-12' }
  return (
    <img src={logo} alt="Jankoti" className={`${heights[size]} w-auto ${className}`} />
  )
}

export const JankotiBranding = ({ className = '' }) => (
  <div className={`flex flex-col items-center ${className}`}>
    <img src={logo} alt="Jankoti" className="h-7 w-auto" />
  </div>
)

export const JankotiWatermark = ({ className = '' }) => (
  <div className={`flex items-center justify-center opacity-60 ${className}`}>
    <img src={logo} alt="Jankoti" className="h-4 w-auto" />
  </div>
)

export default JankotiLogo
