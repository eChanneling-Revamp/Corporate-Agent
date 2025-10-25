import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { debounce } from 'lodash'

// Hook for lazy loading data with infinite scroll
export function useLazyLoading<T>(
  loadFunction: (page: number, limit: number) => Promise<T[]>,
  initialLimit: number = 20
) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

    try {
      const newData = await loadFunction(page, initialLimit)
      
      if (newData.length === 0) {
        setHasMore(false)
      } else {
        setData(prev => [...prev, ...newData])
        setPage(prev => prev + 1)
        
        if (newData.length < initialLimit) {
          setHasMore(false)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [loadFunction, page, initialLimit, isLoading, hasMore])

  const reset = useCallback(() => {
    setData([])
    setPage(0)
    setHasMore(true)
    setError(null)
  }, [])

  // Load initial data
  useEffect(() => {
    if (data.length === 0 && !isLoading) {
      loadMore()
    }
  }, [])

  return {
    data,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset
  }
}

// Hook for optimized search with debouncing
export function useOptimizedSearch<T>(
  searchFunction: (query: string, filters: any) => Promise<T[]>,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<any>({})
  const [results, setResults] = useState<T[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string, searchFilters: any) => {
      if (!searchQuery.trim() && Object.keys(searchFilters).length === 0) {
        setResults([])
        return
      }

      setIsSearching(true)
      setError(null)

      try {
        const searchResults = await searchFunction(searchQuery, searchFilters)
        setResults(searchResults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, debounceMs),
    [searchFunction, debounceMs]
  )

  // Execute search when query or filters change
  useEffect(() => {
    debouncedSearch(query, filters)
    
    // Cleanup function to cancel debounced calls
    return () => {
      debouncedSearch.cancel()
    }
  }, [query, filters, debouncedSearch])

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery)
  }, [])

  const updateFilters = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  const clearSearch = useCallback(() => {
    setQuery('')
    setFilters({})
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    filters,
    results,
    isSearching,
    error,
    updateQuery,
    updateFilters,
    clearSearch
  }
}

// Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const startTimeRef = useRef<number>()
  const renderCountRef = useRef(0)

  useEffect(() => {
    startTimeRef.current = performance.now()
    renderCountRef.current++
  })

  useEffect(() => {
    return () => {
      if (startTimeRef.current) {
        const renderTime = performance.now() - startTimeRef.current
        console.log(`${componentName} render #${renderCountRef.current}: ${renderTime.toFixed(2)}ms`)
      }
    }
  })

  return {
    renderCount: renderCountRef.current,
    markStart: () => { startTimeRef.current = performance.now() },
    markEnd: (operation: string) => {
      if (startTimeRef.current) {
        const duration = performance.now() - startTimeRef.current
        console.log(`${componentName} ${operation}: ${duration.toFixed(2)}ms`)
      }
    }
  }
}

// Hook for virtualized lists (for large datasets)
export function useVirtualization(
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    )

    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, itemCount])

  const totalHeight = itemCount * itemHeight

  const getItemStyle = useCallback((index: number) => ({
    position: 'absolute' as const,
    top: index * itemHeight,
    height: itemHeight,
    width: '100%'
  }), [itemHeight])

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  return {
    visibleRange,
    totalHeight,
    getItemStyle,
    handleScroll
  }
}

// Hook for optimized API calls with caching
export function useOptimizedApi<T>(
  apiCall: () => Promise<T>,
  cacheKey: string,
  cacheTTL: number = 300000 // 5 minutes default
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    const cached = cacheRef.current.get(cacheKey)
    const now = Date.now()

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && (now - cached.timestamp) < cacheTTL) {
      setData(cached.data)
      return cached.data
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      
      // Cache the result
      cacheRef.current.set(cacheKey, { data: result, timestamp: now })
      
      setData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API call failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [apiCall, cacheKey, cacheTTL])

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => fetchData(true), [fetchData])

  const clearCache = useCallback(() => {
    cacheRef.current.delete(cacheKey)
  }, [cacheKey])

  return {
    data,
    isLoading,
    error,
    refresh,
    clearCache
  }
}

// Hook for batch operations
export function useBatchOperations<T>(
  batchOperation: (items: T[]) => Promise<any>,
  batchSize: number = 10,
  maxWaitTime: number = 1000
) {
  const queueRef = useRef<T[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()
  const [isProcessing, setIsProcessing] = useState(false)

  const processBatch = useCallback(async () => {
    if (queueRef.current.length === 0 || isProcessing) return

    const itemsToProcess = [...queueRef.current]
    queueRef.current = []

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    setIsProcessing(true)

    try {
      await batchOperation(itemsToProcess)
    } catch (error) {
      console.error('Batch operation failed:', error)
      // Re-add failed items to queue for retry
      queueRef.current = [...itemsToProcess, ...queueRef.current]
    } finally {
      setIsProcessing(false)
    }
  }, [batchOperation, isProcessing])

  const addToBatch = useCallback((item: T) => {
    queueRef.current.push(item)

    // Process immediately if batch is full
    if (queueRef.current.length >= batchSize) {
      processBatch()
      return
    }

    // Schedule processing if not already scheduled
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(processBatch, maxWaitTime)
    }
  }, [batchSize, maxWaitTime, processBatch])

  const flush = useCallback(() => {
    processBatch()
  }, [processBatch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    addToBatch,
    flush,
    isProcessing,
    queueLength: queueRef.current.length
  }
}

// Hook for memory-efficient data processing
export function useMemoryEfficient<T, R>(
  data: T[],
  processor: (chunk: T[]) => R[],
  chunkSize: number = 100
) {
  const [processedData, setProcessedData] = useState<R[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const processData = useCallback(async () => {
    if (data.length === 0) return

    setIsProcessing(true)
    setProgress(0)

    const results: R[] = []
    const totalChunks = Math.ceil(data.length / chunkSize)

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const chunkResults = processor(chunk)
      results.push(...chunkResults)

      const currentChunk = Math.floor(i / chunkSize) + 1
      setProgress((currentChunk / totalChunks) * 100)

      // Allow UI to update between chunks
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    setProcessedData(results)
    setIsProcessing(false)
  }, [data, processor, chunkSize])

  useEffect(() => {
    processData()
  }, [processData])

  return {
    processedData,
    isProcessing,
    progress
  }
}

// Hook for intersection observer (lazy loading images, infinite scroll)
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback()
          }
        })
      },
      {
        threshold: 0.1,
        ...options
      }
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
      observer.disconnect()
    }
  }, [callback, options])

  return targetRef
}

// Hook for web workers (CPU-intensive tasks)
export function useWebWorker<T, R>(
  workerScript: string,
  dependencies: any[] = []
) {
  const workerRef = useRef<Worker>()
  const [isWorking, setIsWorking] = useState(false)

  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(workerScript)
    
    return () => {
      // Cleanup worker
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, dependencies)

  const execute = useCallback((data: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }

      setIsWorking(true)

      const handleMessage = (event: MessageEvent) => {
        setIsWorking(false)
        workerRef.current?.removeEventListener('message', handleMessage)
        workerRef.current?.removeEventListener('error', handleError)
        resolve(event.data)
      }

      const handleError = (error: ErrorEvent) => {
        setIsWorking(false)
        workerRef.current?.removeEventListener('message', handleMessage)
        workerRef.current?.removeEventListener('error', handleError)
        reject(error)
      }

      workerRef.current.addEventListener('message', handleMessage)
      workerRef.current.addEventListener('error', handleError)
      workerRef.current.postMessage(data)
    })
  }, [])

  return {
    execute,
    isWorking
  }
}