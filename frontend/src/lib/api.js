const defaultApiUrl = import.meta.env.DEV ? 'http://localhost:8080/api' : '/api'
const configuredApiUrl = import.meta.env.VITE_BACKEND_URL
const isLocalhostApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(configuredApiUrl || '')

export const API_BASE_URL = (
  import.meta.env.PROD && isLocalhostApi ? '/api' : configuredApiUrl || defaultApiUrl
).replace(/\/+$/, '')

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}
