import axios from 'axios'
import useAuthStore from '../store/authStore'

// In production (Render static site) VITE_API_URL is set to the backend URL,
// e.g. https://resumeiq-api.onrender.com
// In development the Vite proxy forwards /api → http://localhost:5000 so
// we just use the relative path '/api'.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
})

// Attach JWT to every request
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
