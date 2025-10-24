import { useState, useCallback, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

interface UseApiCallOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  showToast?: boolean
  successMessage?: string
  errorMessage?: string
  retryAttempts?: number
  retryDelay?: number
}

interface ApiCallState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: (...args: any[]) => Promise<T | void>
  reset: () => void
  retry: () => Promise<T | void>
}

export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
): ApiCallState<T> {
  const {
    onSuccess,
    onError,
    showToast = true,
    successMessage,
    errorMessage,
    retryAttempts = 0,
    retryDelay = 1000,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const lastArgsRef = useRef<any[]>([])
  const retryCountRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args: any[]): Promise<T | void> => {
      if (!isMountedRef.current) return

      lastArgsRef.current = args
      retryCountRef.current = 0
      setLoading(true)
      setError(null)

      const attemptApiCall = async (attemptNumber: number): Promise<T | void> => {
        try {
          const result = await apiFunction(...args)
          
          if (!isMountedRef.current) return

          setData(result)
          setLoading(false)

          if (showToast && successMessage) {
            toast.success(successMessage)
          }

          onSuccess?.(result)
          return result
        } catch (err: any) {
          if (!isMountedRef.current) return

          const isLastAttempt = attemptNumber >= retryAttempts

          if (!isLastAttempt) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attemptNumber + 1)))
            return attemptApiCall(attemptNumber + 1)
          }

          setError(err)
          setLoading(false)

          if (showToast) {
            const message = errorMessage || err.response?.data?.message || err.message || 'An error occurred'
            toast.error(message)
          }

          onError?.(err)
          throw err
        }
      }

      return attemptApiCall(0)
    },
    [apiFunction, onSuccess, onError, showToast, successMessage, errorMessage, retryAttempts, retryDelay]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
    retryCountRef.current = 0
  }, [])

  const retry = useCallback(() => {
    return execute(...lastArgsRef.current)
  }, [execute])

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry,
  }
}

// Hook for paginated API calls
export function usePaginatedApiCall<T = any>(
  apiFunction: (page: number, pageSize: number, ...args: any[]) => Promise<{ data: T[]; total: number }>,
  pageSize: number = 10
) {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const { data, loading, error, execute } = useApiCall(apiFunction)

  const loadMore = useCallback(
    async (...args: any[]) => {
      if (!hasMore || loading) return

      const result = await execute(page, pageSize, ...args)
      
      if (result) {
        const newItems = [...items, ...result.data]
        setItems(newItems)
        setPage(page + 1)
        setTotalPages(Math.ceil(result.total / pageSize))
        setHasMore(newItems.length < result.total)
      }
    },
    [execute, page, pageSize, items, hasMore, loading]
  )

  const refresh = useCallback(
    async (...args: any[]) => {
      setItems([])
      setPage(1)
      setHasMore(true)
      
      const result = await execute(1, pageSize, ...args)
      
      if (result) {
        setItems(result.data)
        setPage(2)
        setTotalPages(Math.ceil(result.total / pageSize))
        setHasMore(result.data.length < result.total)
      }
    },
    [execute, pageSize]
  )

  return {
    items,
    loading,
    error,
    page: page - 1,
    totalPages,
    hasMore,
    loadMore,
    refresh,
  }
}

// Hook for infinite scroll with API calls
export function useInfiniteApiCall<T = any>(
  apiFunction: (cursor?: string) => Promise<{ data: T[]; nextCursor?: string }>,
  options: UseApiCallOptions = {}
) {
  const [items, setItems] = useState<T[]>([])
  const [cursor, setCursor] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState(true)
  const { loading, error, execute } = useApiCall(apiFunction, options)

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return

    const result = await execute(cursor)
    
    if (result) {
      setItems(prev => [...prev, ...result.data])
      setCursor(result.nextCursor)
      setHasMore(!!result.nextCursor)
    }
  }, [execute, cursor, hasMore, loading])

  const refresh = useCallback(async () => {
    setItems([])
    setCursor(undefined)
    setHasMore(true)
    
    const result = await execute(undefined)
    
    if (result) {
      setItems(result.data)
      setCursor(result.nextCursor)
      setHasMore(!!result.nextCursor)
    }
  }, [execute])

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  }
}

// Hook for debounced API calls (useful for search)
export function useDebouncedApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  delay: number = 500,
  options: UseApiCallOptions = {}
) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const apiCall = useApiCall(apiFunction, options)

  const debouncedExecute = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      return new Promise<T | void>((resolve) => {
        timeoutRef.current = setTimeout(async () => {
          const result = await apiCall.execute(...args)
          resolve(result)
        }, delay)
      })
    },
    [apiCall, delay]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    ...apiCall,
    execute: debouncedExecute,
  }
}

// Hook for polling API calls
export function usePollingApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  interval: number = 5000,
  options: UseApiCallOptions & { enabled?: boolean } = {}
) {
  const { enabled = true, ...apiOptions } = options
  const intervalRef = useRef<NodeJS.Timeout>()
  const apiCall = useApiCall(apiFunction, apiOptions)

  const startPolling = useCallback(
    (...args: any[]) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      // Initial call
      apiCall.execute(...args)

      if (enabled) {
        intervalRef.current = setInterval(() => {
          apiCall.execute(...args)
        }, interval)
      }
    },
    [apiCall, interval, enabled]
  )

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
  }, [])

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    ...apiCall,
    startPolling,
    stopPolling,
  }
}

// Hook for optimistic updates
export function useOptimisticApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  optimisticUpdate: (current: T | null, ...args: any[]) => T,
  options: UseApiCallOptions = {}
) {
  const [optimisticData, setOptimisticData] = useState<T | null>(null)
  const apiCall = useApiCall(apiFunction, {
    ...options,
    onError: (error) => {
      // Revert optimistic update on error
      setOptimisticData(null)
      options.onError?.(error)
    },
  })

  const execute = useCallback(
    async (...args: any[]) => {
      // Apply optimistic update immediately
      const optimistic = optimisticUpdate(apiCall.data, ...args)
      setOptimisticData(optimistic)

      // Make the actual API call
      const result = await apiCall.execute(...args)
      
      // Clear optimistic data once real data is available
      setOptimisticData(null)
      
      return result
    },
    [apiCall, optimisticUpdate]
  )

  return {
    ...apiCall,
    data: optimisticData || apiCall.data,
    execute,
  }
}
