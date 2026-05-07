const defaultApiUrl = import.meta.env.DEV ? 'http://localhost:8080/api' : '/api'

export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || defaultApiUrl).replace(/\/+$/, '')

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}
