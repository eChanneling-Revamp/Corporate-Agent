import axios from 'axios'
import Cookies from 'js-cookie'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = Cookies.get('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          
          const { token } = response.data
          Cookies.set('authToken', token)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('authToken')
        Cookies.remove('refreshToken')
        window.location.href = '/auth/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials)
    
    // Set cookies on successful login
    if (response.data.token) {
      Cookies.set('authToken', response.data.token, { expires: 1 }) // 1 day
      Cookies.set('refreshToken', response.data.refreshToken, { expires: 7 }) // 7 days
    }
    
    return response
  },
  
  register: async (userData: {
    email: string
    password: string
    name: string
    companyName: string
    contactNumber: string
  }) => {
    return await apiClient.post('/auth/register', userData)
  },
  
  verifyEmail: async (token: string) => {
    return await apiClient.post('/auth/verify-email', { token })
  },
  
  refreshToken: async (refreshToken: string) => {
    return await apiClient.post('/auth/refresh', { refreshToken })
  },
  
  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      Cookies.remove('authToken')
      Cookies.remove('refreshToken')
    }
  },
  
  forgotPassword: async (email: string) => {
    return await apiClient.post('/auth/forgot-password', { email })
  },
  
  resetPassword: async (token: string, password: string) => {
    return await apiClient.post('/auth/reset-password', { token, password })
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    return await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
  },
  
  updateProfile: async (profileData: {
    name?: string
    companyName?: string
    contactNumber?: string
  }) => {
    return await apiClient.patch('/auth/profile', profileData)
  },
  
  getProfile: async () => {
    return await apiClient.get('/auth/profile')
  },
}

export default apiClient