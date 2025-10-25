import { NextApiRequest, NextApiResponse } from 'next'

// Redis type definition (optional dependency)
interface Redis {
  get(key: string): Promise<string | null>
  setex(key: string, ttl: number, value: string): Promise<string>
  keys(pattern: string): Promise<string[]>
  del(...keys: string[]): Promise<number>
}

// Performance optimization utilities and caching layer
class PerformanceOptimizer {
  private static redis: Redis | null = null
  private static cache = new Map<string, { data: any, timestamp: number, ttl: number }>()
  
  // Initialize Redis connection if available
  static async initializeRedis() {
    if (process.env.REDIS_URL && !this.redis) {
      try {
        // Dynamic import for Redis (optional dependency)
        const { Redis: RedisClass } = await import('ioredis')
        this.redis = new RedisClass(process.env.REDIS_URL) as Redis
        console.log('Redis cache initialized')
      } catch (error) {
        console.warn('Redis not available, using in-memory cache:', error)
      }
    }
  }

  // Get cached data
  static async getCache(key: string): Promise<any> {
    try {
      // Try Redis first
      if (this.redis) {
        const cached = await this.redis.get(key)
        if (cached) {
          return JSON.parse(cached)
        }
      }

      // Fall back to in-memory cache
      const memCached = this.cache.get(key)
      if (memCached && Date.now() - memCached.timestamp < memCached.ttl) {
        return memCached.data
      }

      // Clean expired entries
      if (memCached && Date.now() - memCached.timestamp >= memCached.ttl) {
        this.cache.delete(key)
      }

      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  // Set cache data
  static async setCache(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    try {
      // Set in Redis if available
      if (this.redis) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(data))
      }

      // Also set in memory cache as backup
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttlSeconds * 1000
      })
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  // Clear cache by pattern
  static async clearCache(pattern: string): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      }

      // Clear from memory cache
      for (const key of this.cache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          this.cache.delete(key)
        }
      }
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  // Database query optimization
  static optimizeQuery(query: any, options: QueryOptimizationOptions = {}): any {
    const optimized = { ...query }

    // Add default limits to prevent large data sets
    if (!optimized.take && options.defaultLimit !== false) {
      optimized.take = options.defaultLimit || 50
    }

    // Add pagination if not present
    if (optimized.take && !optimized.skip && options.enablePagination) {
      optimized.skip = 0
    }

    // Optimize includes - limit deep nesting
    if (optimized.include && options.limitIncludes) {
      optimized.include = this.limitNestedIncludes(optimized.include, options.maxIncludeDepth || 3)
    }

    // Add indexes hints for common patterns
    if (optimized.where && options.addIndexHints) {
      optimized.where = this.addIndexHints(optimized.where)
    }

    return optimized
  }

  // Limit nested includes to prevent performance issues
  private static limitNestedIncludes(include: any, maxDepth: number, currentDepth = 1): any {
    if (currentDepth >= maxDepth) {
      return true // Just include the relation without further nesting
    }

    if (typeof include === 'object' && include !== null) {
      const result: any = {}
      for (const [key, value] of Object.entries(include)) {
        if (typeof value === 'object' && value !== null && 'include' in value) {
          result[key] = {
            ...value,
            include: this.limitNestedIncludes((value as any).include, maxDepth, currentDepth + 1)
          }
        } else {
          result[key] = value
        }
      }
      return result
    }

    return include
  }

  // Add index hints for common query patterns
  private static addIndexHints(where: any): any {
    const hints = { ...where }

    // Add index hints for date ranges
    if (hints.createdAt && typeof hints.createdAt === 'object') {
      // Ensure date queries are optimized
      hints._indexHint = 'createdAt_idx'
    }

    // Add hints for status queries
    if (hints.status) {
      hints._statusIndexHint = 'status_idx'
    }

    // Add hints for user-based queries
    if (hints.userId || hints.bookedById) {
      hints._userIndexHint = 'user_idx'
    }

    return hints
  }

  // Database connection optimization
  static optimizeConnection() {
    return {
      // Connection pool settings
      pool: {
        max: 20,
        min: 5,
        idle: 10000,
        acquire: 30000,
        evict: 1000
      },
      // Query optimization
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      benchmark: true,
      // Retry configuration
      retry: {
        max: 3,
        match: [
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /ECONNRESET/,
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /ESOCKETTIMEDOUT/,
          /EHOSTUNREACH/,
          /EPIPE/,
          /EAI_AGAIN/,
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/
        ]
      }
    }
  }
}

// Query optimization options interface
interface QueryOptimizationOptions {
  defaultLimit?: number | false
  enablePagination?: boolean
  limitIncludes?: boolean
  maxIncludeDepth?: number
  addIndexHints?: boolean
}

// API Response optimization middleware
export function optimizeApiResponse(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now()

    // Add performance headers
    res.setHeader('X-Response-Time-Start', startTime.toString())
    
    // Enable compression
    res.setHeader('Content-Encoding', 'gzip')
    
    // Add caching headers for GET requests
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    }

    try {
      const result = await handler(req, res)
      
      // Add performance metrics
      const endTime = Date.now()
      res.setHeader('X-Response-Time', `${endTime - startTime}ms`)
      
      return result
    } catch (error) {
      // Log performance issues
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (duration > 5000) { // Log slow requests (>5s)
        console.warn(`Slow API request detected: ${req.url} took ${duration}ms`, {
          method: req.method,
          url: req.url,
          duration,
          error: error instanceof Error ? error.message : error
        })
      }
      
      throw error
    }
  }
}

// Database query caching wrapper
export function withCache(
  key: string, 
  queryFn: () => Promise<any>, 
  ttlSeconds: number = 300,
  options: { skipCache?: boolean } = {}
) {
  return async () => {
    // Skip cache if requested or in development
    if (options.skipCache || process.env.NODE_ENV === 'development') {
      return await queryFn()
    }

    // Try to get from cache first
    const cached = await PerformanceOptimizer.getCache(key)
    if (cached !== null) {
      return cached
    }

    // Execute query and cache result
    const result = await queryFn()
    await PerformanceOptimizer.setCache(key, result, ttlSeconds)
    
    return result
  }
}

// Lazy loading utility for large datasets
export class LazyLoader<T> {
  private items: T[] = []
  private pageSize: number
  private currentPage: number = 0
  private hasMore: boolean = true
  private loadFn: (page: number, pageSize: number) => Promise<T[]>

  constructor(loadFn: (page: number, pageSize: number) => Promise<T[]>, pageSize: number = 20) {
    this.loadFn = loadFn
    this.pageSize = pageSize
  }

  async loadNext(): Promise<T[]> {
    if (!this.hasMore) {
      return []
    }

    const newItems = await this.loadFn(this.currentPage, this.pageSize)
    
    if (newItems.length < this.pageSize) {
      this.hasMore = false
    }

    this.items.push(...newItems)
    this.currentPage++

    return newItems
  }

  getLoadedItems(): T[] {
    return this.items
  }

  hasMoreItems(): boolean {
    return this.hasMore
  }

  reset(): void {
    this.items = []
    this.currentPage = 0
    this.hasMore = true
  }
}

// Performance monitoring utility
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  static recordMetric(key: string, value: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    const values = this.metrics.get(key)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  static getMetrics(key: string): { avg: number, min: number, max: number, count: number } | null {
    const values = this.metrics.get(key)
    if (!values || values.length === 0) {
      return null
    }

    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    }
  }

  static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [key, values] of this.metrics) {
      result[key] = this.getMetrics(key)
    }
    return result
  }
}

// Memory usage optimization
export class MemoryOptimizer {
  static optimizeForLargeDatasets<T>(
    data: T[], 
    processChunkFn: (chunk: T[]) => void,
    chunkSize: number = 1000
  ): void {
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      processChunkFn(chunk)
      
      // Force garbage collection hint (if available)
      if (global.gc) {
        global.gc()
      }
    }
  }

  static async streamProcess<T, R>(
    items: T[],
    processFn: (item: T) => Promise<R>,
    concurrency: number = 10
  ): Promise<R[]> {
    const results: R[] = []
    
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency)
      const batchResults = await Promise.all(batch.map(processFn))
      results.push(...batchResults)
    }
    
    return results
  }
}

// Initialize performance optimizer
PerformanceOptimizer.initializeRedis()

export {
  PerformanceOptimizer
}

export type { QueryOptimizationOptions }