import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
import { connectSocket, disconnectSocket } from '../socketClient'

// API Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
}

// Error messages mapping
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Session expired. Please login again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'The data provided is invalid.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
  502: 'Service temporarily unavailable.',
  503: 'Service is under maintenance.',
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    },
  })

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add auth token
      const token = Cookies.get('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Add correlation ID for request tracking
      config.headers['X-Correlation-ID'] = generateCorrelationId()

      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data)
      }

      return config
    },
    (error) => {
      console.error('Request error:', error)
      return Promise.reject(error)
    }
  )

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Response from ${response.config.url}:`, response.data)
      }
      return response
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean, _retryCount?: number }
      
      // Handle network errors
      if (!error.response) {
        handleNetworkError()
        return Promise.reject(error)
      }

      const { status, data } = error.response

      // Handle 401 - Token expired
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        
        try {
          const refreshToken = Cookies.get('refreshToken')
          if (refreshToken) {
            const response = await refreshAuthToken(refreshToken)
            const { token } = response.data
            
            Cookies.set('authToken', token, { expires: 1 })
            
            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            
            return client(originalRequest)
          }
        } catch (refreshError) {
          handleAuthError()
          return Promise.reject(refreshError)
        }
      }

      // Handle rate limiting with retry
      if (status === 429 && (!originalRequest._retryCount || originalRequest._retryCount < API_CONFIG.retryAttempts)) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
        
        const retryAfter = parseInt(error.response.headers['retry-after'] || '3')
        await delay(retryAfter * 1000)
        
        return client(originalRequest)
      }

      // Handle server errors with retry
      if (status >= 500 && (!originalRequest._retryCount || originalRequest._retryCount < API_CONFIG.retryAttempts)) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
        
        await delay(API_CONFIG.retryDelay * originalRequest._retryCount)
        
        return client(originalRequest)
      }

      // Show error message
      const errorMessage = (data as any)?.message || ERROR_MESSAGES[status] || 'An unexpected error occurred'
      
      // Don't show toast for canceled requests or specific error codes
      if (error.code !== 'ECONNABORTED' && status !== 401) {
        toast.error(errorMessage)
      }

      return Promise.reject(error)
    }
  )

  return client
}

// Utility functions
const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const handleNetworkError = () => {
  toast.error('Network error. Please check your internet connection.')
}

const handleAuthError = () => {
  Cookies.remove('authToken')
  Cookies.remove('refreshToken')
  disconnectSocket()
  
  toast.error('Your session has expired. Please login again.')
  
  // Redirect to login after a short delay
  setTimeout(() => {
    window.location.href = '/auth/login'
  }, 2000)
}

const refreshAuthToken = async (refreshToken: string) => {
  return axios.post(`${API_CONFIG.baseURL}/api/auth/refresh`, {
    refreshToken,
  })
}

// Create the API client instance
const apiClient = createApiClient()

// Enhanced API wrapper with loading states
export class ApiService {
  private static loadingRequests = new Map<string, boolean>()
  
  static async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const key = `GET:${url}`
    this.setLoading(key, true)
    
    try {
      const response = await apiClient.get<T>(url, config)
      return response.data
    } finally {
      this.setLoading(key, false)
    }
  }
  
  static async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const key = `POST:${url}`
    this.setLoading(key, true)
    
    try {
      const response = await apiClient.post<T>(url, data, config)
      return response.data
    } finally {
      this.setLoading(key, false)
    }
  }
  
  static async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const key = `PUT:${url}`
    this.setLoading(key, true)
    
    try {
      const response = await apiClient.put<T>(url, data, config)
      return response.data
    } finally {
      this.setLoading(key, false)
    }
  }
  
  static async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const key = `PATCH:${url}`
    this.setLoading(key, true)
    
    try {
      const response = await apiClient.patch<T>(url, data, config)
      return response.data
    } finally {
      this.setLoading(key, false)
    }
  }
  
  static async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const key = `DELETE:${url}`
    this.setLoading(key, true)
    
    try {
      const response = await apiClient.delete<T>(url, config)
      return response.data
    } finally {
      this.setLoading(key, false)
    }
  }
  
  static isLoading(key: string): boolean {
    return this.loadingRequests.get(key) || false
  }
  
  private static setLoading(key: string, value: boolean) {
    if (value) {
      this.loadingRequests.set(key, true)
    } else {
      this.loadingRequests.delete(key)
    }
  }
  
  static cancelRequest(key: string) {
    // Implement request cancellation if needed
  }
}

// Export configured axios instance for backward compatibility
export default apiClient

// Export individual HTTP methods for convenience
export const api = {
  get: ApiService.get,
  post: ApiService.post,
  put: ApiService.put,
  patch: ApiService.patch,
  delete: ApiService.delete,
}

// Request builder for complex queries
export class RequestBuilder {
  private params: Record<string, any> = {}
  
  addParam(key: string, value: any): this {
    if (value !== undefined && value !== null && value !== '') {
      this.params[key] = value
    }
    return this
  }
  
  addParams(params: Record<string, any>): this {
    Object.entries(params).forEach(([key, value]) => {
      this.addParam(key, value)
    })
    return this
  }
  
  build(): URLSearchParams {
    return new URLSearchParams(this.params)
  }
  
  toString(): string {
    return this.build().toString()
  }
}

// Batch request handler for multiple API calls
export class BatchRequest {
  private requests: Promise<any>[] = []
  
  add<T>(request: Promise<T>): this {
    this.requests.push(request)
    return this
  }
  
  async execute(): Promise<any[]> {
    return Promise.all(this.requests)
  }
  
  async executeSettled(): Promise<PromiseSettledResult<any>[]> {
    return Promise.allSettled(this.requests)
  }
}

// Cache manager for API responses
export class CacheManager {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static ttl = 5 * 60 * 1000 // 5 minutes default TTL
  
  static set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + (ttl || this.ttl)
    })
  }
  
  static get(key: string): any | null {
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    if (Date.now() > cached.timestamp) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  static clear(): void {
    this.cache.clear()
  }
  
  static remove(key: string): void {
    this.cache.delete(key)
  }
}
