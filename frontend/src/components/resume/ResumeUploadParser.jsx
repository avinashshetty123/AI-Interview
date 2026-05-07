import { useState, useRef } from 'react'
import { FiUploadCloud, FiFile, FiAlertCircle, FiLoader, FiCheckCircle } from 'react-icons/fi'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { apiUrl } from '../../lib/api'

const ResumeUploadParser = ({ onResumeDataParsed, onCancel }) => {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return
    
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|docx|txt)$/i)) {
      setError('Please upload a PDF, DOCX, or TXT file')
      return
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
    
    setFile(selectedFile)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a resume file')
      return
    }

    setLoading(true)
    setError('')
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('resume', file)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 200)

      const response = await fetch(apiUrl('/resume/parse-for-builder'), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (data.success) {
        setTimeout(() => {
          onResumeDataParsed(data.data, data.atsScore, data.suggestions)
        }, 500)
      } else {
        setError(data.error || 'Failed to parse resume')
        setUploadProgress(0)
      }
    } catch (err) {
      console.error('Parse error:', err)
      setError('Network error. Please ensure the backend service is running.')
      setUploadProgress(0)
    } finally {
      setTimeout(() => {
        setLoading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-0 shadow-xl bg-white/90">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 flex items-center justify-center text-white">
            <FiUploadCloud size={24} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
            Import Existing Resume
          </CardTitle>
          <p className="text-gray-600">
            Upload your current resume to automatically fill the resume builder
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
              dragOver 
                ? 'border-violet-400 bg-violet-50 scale-105' 
                : file 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 bg-gray-50 hover:border-violet-400 hover:bg-violet-50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".pdf,.docx,.txt"
              onChange={(e) => handleFileSelect(e.target.files[0])} 
              className="hidden" 
            />

            {file ? (
              <div>
                <div className="flex justify-center mb-4">
                  <FiFile size={48} className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{file.name}</h3>
                <p className="text-gray-600 mb-2">{formatFileSize(file.size)}</p>
                <p className="text-sm font-medium text-violet-600">Click to change file</p>
                
                {loading && uploadProgress > 0 && (
                  <div className="mt-6">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-500"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm mt-2 text-gray-600">
                      Parsing resume... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-center mb-4">
                  <FiUploadCloud size={48} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  Drop your resume here
                </h3>
                <p className="text-gray-600 mb-2">
                  or <span className="font-semibold text-violet-600">click to browse</span>
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOCX, TXT (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Success message */}
          {file && !loading && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <FiCheckCircle size={20} className="text-green-600 shrink-0" />
              <p className="text-green-700 text-sm">
                <strong>{file.name}</strong> is ready to be parsed. Click "Parse Resume" to continue.
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center gap-2">
                <FiAlertCircle size={16} /> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              onClick={onCancel} 
              variant="outline" 
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!file || loading}
              className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FiLoader size={16} className="animate-spin" />
                  <span>Parsing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FiUploadCloud size={16} />
                  <span>Parse Resume</span>
                </div>
              )}
            </Button>
          </div>

          {/* Info section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your resume will be analyzed using AI</li>
              <li>• Personal information, experience, and education will be extracted</li>
              <li>• Skills and projects will be identified automatically</li>
              <li>• You can review and edit all information before finalizing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResumeUploadParser
