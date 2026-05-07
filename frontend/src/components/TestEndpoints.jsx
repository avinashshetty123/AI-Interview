import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { apiUrl } from '../lib/api'

const TestEndpoints = () => {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState({})

  const testEndpoint = async (name, url) => {
    setLoading(prev => ({ ...prev, [name]: true }))
    try {
      const response = await fetch(url)
      const data = await response.json()
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          status: response.status, 
          data: data,
          success: response.ok 
        } 
      }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          status: 'ERROR', 
          data: error.message,
          success: false 
        } 
      }))
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }))
    }
  }

  const endpoints = [
    { name: 'Health Check', url: apiUrl('/health') },
    { name: 'Test Routes', url: apiUrl('/test-routes') },
    { name: 'Debug Test', url: apiUrl('/debug/test') },
    { name: 'Debug Sessions', url: apiUrl('/debug/sessions') },
    { name: 'Debug Session 1', url: apiUrl('/debug/session/1') },
    { name: 'Original Sessions', url: apiUrl('/sessions/all') },
    { name: 'Original Session 1', url: apiUrl('/session/1/qa') },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
              🔧 Backend Endpoint Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {endpoints.map((endpoint) => (
                <Card key={endpoint.name} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                    <p className="text-sm text-gray-600">{endpoint.url}</p>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => testEndpoint(endpoint.name, endpoint.url)}
                      disabled={loading[endpoint.name]}
                      className="w-full mb-3"
                    >
                      {loading[endpoint.name] ? 'Testing...' : 'Test Endpoint'}
                    </Button>
                    
                    {results[endpoint.name] && (
                      <div className={`p-3 rounded-lg text-sm ${
                        results[endpoint.name].success 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="font-semibold mb-2">
                          Status: {results[endpoint.name].status}
                        </div>
                        <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                          {JSON.stringify(results[endpoint.name].data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TestEndpoints
