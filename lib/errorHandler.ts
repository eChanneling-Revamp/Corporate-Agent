import { showToast } from '../components/common/ToastProvider'
import axios, { AxiosError } from 'axios'

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

// Custom error class
export class AppError extends Error {
  type: ErrorType
  statusCode?: number
  details?: any

  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, statusCode?: number, details?: any) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.statusCode = statusCode
    this.details = details
  }
}

// Error messages
const errorMessages: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Network error. Please check your internet connection.',
  [ErrorType.VALIDATION]: 'Please check your input and try again.',
  [ErrorType.AUTHENTICATION]: 'Please login to continue.',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.SERVER]: 'Server error. Please try again later.',
  [ErrorType.TIMEOUT]: 'Request timeout. Please try again.',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred.'
}

// Determine error type from status code
const getErrorTypeFromStatus = (status: number): ErrorType => {
  if (status === 401) return ErrorType.AUTHENTICATION
  if (status === 403) return ErrorType.AUTHORIZATION
  if (status === 404) return ErrorType.NOT_FOUND
  if (status === 422 || status === 400) return ErrorType.VALIDATION
  if (status === 408) return ErrorType.TIMEOUT
  if (status >= 500) return ErrorType.SERVER
  return ErrorType.UNKNOWN
}

// Main error handler
export const handleError = (error: any, showNotification: boolean = true): AppError => {
  let appError: AppError

  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>
    
    if (axiosError.response) {
      // Server responded with error
      const status = axiosError.response.status
      const errorType = getErrorTypeFromStatus(status)
      const message = axiosError.response.data?.message || errorMessages[errorType]
      const details = axiosError.response.data?.errors || axiosError.response.data?.details
      
      appError = new AppError(message, errorType, status, details)
    } else if (axiosError.request) {
      // Request was made but no response received
      appError = new AppError(
        'No response from server. Please check your connection.',
        ErrorType.NETWORK
      )
    } else {
      // Request setup error
      appError = new AppError(
        axiosError.message || 'Failed to make request',
        ErrorType.UNKNOWN
      )
    }
  } 
  // Handle regular errors
  else if (error instanceof Error) {
    // Check for specific error types
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      appError = new AppError(error.message, ErrorType.NETWORK)
    } else if (error.name === 'TimeoutError') {
      appError = new AppError(error.message, ErrorType.TIMEOUT)
    } else {
      appError = new AppError(error.message, ErrorType.UNKNOWN)
    }
  }
  // Handle string errors
  else if (typeof error === 'string') {
    appError = new AppError(error, ErrorType.UNKNOWN)
  }
  // Unknown error type
  else {
    appError = new AppError('An unexpected error occurred', ErrorType.UNKNOWN)
  }

  // Log error for debugging
  console.error('[Error Handler]:', {
    type: appError.type,
    message: appError.message,
    statusCode: appError.statusCode,
    details: appError.details,
    originalError: error
  })

  // Show notification if requested
  if (showNotification) {
    showErrorNotification(appError)
  }

  return appError
}

// Show error notification based on error type
const showErrorNotification = (error: AppError) => {
  const duration = error.type === ErrorType.NETWORK ? 10000 : 5000
  
  switch (error.type) {
    case ErrorType.NETWORK:
      showToast.error(error.message, { duration })
      break
    case ErrorType.AUTHENTICATION:
      showToast.error(error.message, { duration })
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/auth/login'
      }, 2000)
      break
    case ErrorType.VALIDATION:
      if (error.details && Array.isArray(error.details)) {
        error.details.forEach((detail: any) => {
          showToast.error(detail.message || detail, { duration: 7000 })
        })
      } else {
        showToast.error(error.message, { duration })
      }
      break
    case ErrorType.AUTHORIZATION:
      showToast.warning(error.message, { duration })
      break
    case ErrorType.NOT_FOUND:
      showToast.warning(error.message, { duration })
      break
    case ErrorType.SERVER:
      showToast.error(error.message, { duration })
      break
    case ErrorType.TIMEOUT:
      showToast.error(error.message, { duration })
      break
    default:
      showToast.error(error.message, { duration })
  }
}

// Retry mechanism for failed requests
export const retryRequest = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) {
      throw error
    }
    
    const appError = handleError(error, false)
    
    // Don't retry for certain error types
    if ([
      ErrorType.AUTHENTICATION,
      ErrorType.AUTHORIZATION,
      ErrorType.VALIDATION,
      ErrorType.NOT_FOUND
    ].includes(appError.type)) {
      throw error
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Retry with exponential backoff
    return retryRequest(fn, retries - 1, delay * backoff, backoff)
  }
}

// Handle async operations with loading state
export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  options: {
    loadingMessage?: string
    successMessage?: string
    errorMessage?: string
    showLoading?: boolean
    showSuccess?: boolean
    showError?: boolean
    onError?: (error: AppError) => void
    onSuccess?: (data: T) => void
  } = {}
): Promise<T | null> => {
  const {
    loadingMessage = 'Processing...',
    successMessage = 'Operation completed successfully',
    showLoading = true,
    showSuccess = true,
    showError = true,
    onError,
    onSuccess
  } = options

  let loadingToastId: string | undefined

  try {
    // Show loading toast
    if (showLoading) {
      loadingToastId = showToast.loading(loadingMessage)
    }

    // Execute operation
    const result = await operation()

    // Dismiss loading toast
    if (loadingToastId) {
      showToast.dismiss(loadingToastId)
    }

    // Show success toast
    if (showSuccess) {
      showToast.success(successMessage)
    }

    // Call success callback
    if (onSuccess) {
      onSuccess(result)
    }

    return result
  } catch (error) {
    // Dismiss loading toast
    if (loadingToastId) {
      showToast.dismiss(loadingToastId)
    }

    // Handle error
    const appError = handleError(error, showError)

    // Call error callback
    if (onError) {
      onError(appError)
    }

    return null
  }
}

// Validation error formatter
export const formatValidationErrors = (errors: any): string[] => {
  const messages: string[] = []
  
  if (Array.isArray(errors)) {
    errors.forEach(error => {
      if (typeof error === 'string') {
        messages.push(error)
      } else if (error.message) {
        messages.push(error.message)
      } else if (error.msg) {
        messages.push(error.msg)
      }
    })
  } else if (typeof errors === 'object') {
    Object.entries(errors).forEach(([field, error]) => {
      if (typeof error === 'string') {
        messages.push(`${field}: ${error}`)
      } else if (Array.isArray(error)) {
        error.forEach(e => messages.push(`${field}: ${e}`))
      }
    })
  }
  
  return messages
}

// Global error boundary handler
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    handleError(event.reason)
    event.preventDefault()
  })

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    handleError(event.error)
    event.preventDefault()
  })

  // Network status monitoring
  window.addEventListener('online', () => {
    showToast.online()
  })

  window.addEventListener('offline', () => {
    showToast.offline()
  })
}

// Export for use in API interceptors
export const apiErrorInterceptor = (error: any) => {
  const appError = handleError(error)
  
  // Redirect to login if authentication error
  if (appError.type === ErrorType.AUTHENTICATION) {
    window.location.href = '/auth/login'
  }
  
  return Promise.reject(appError)
}
