import { NextApiRequest, NextApiResponse } from 'next'
import { performance } from 'perf_hooks'

// Performance metrics interface
interface PerformanceMetrics {
  id: string
  timestamp: number
  type: 'api' | 'render' | 'database' | 'cache' | 'network'
  name: string
  duration: number
  metadata?: Record<string, any>
  userId?: string
  userAgent?: string
  ip?: string
}

// Memory metrics interface
interface MemoryMetrics {
  timestamp: number
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
  arrayBuffers: number
}

// Database performance metrics
interface DatabaseMetrics {
  queryCount: number
  totalDuration: number
  averageDuration: number
  slowQueries: Array<{
    query: string
    duration: number
    timestamp: number
  }>
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private memoryMetrics: MemoryMetrics[] = []
  private dbMetrics: DatabaseMetrics = {
    queryCount: 0,
    totalDuration: 0,
    averageDuration: 0,
    slowQueries: []
  }
  private maxMetrics = 10000 // Limit memory usage
  private slowQueryThreshold = 1000 // 1 second

  // Record performance metric
  recordMetric(metric: Omit<PerformanceMetrics, 'id' | 'timestamp'>) {
    const performanceMetric: PerformanceMetrics = {
      ...metric,
      id: this.generateId(),
      timestamp: Date.now()
    }

    this.metrics.push(performanceMetric)

    // Clean up old metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2)
    }

    // Log critical performance issues
    if (metric.duration > 5000) {
      console.error('Critical performance issue:', performanceMetric)
    } else if (metric.duration > 1000) {
      console.warn('Performance warning:', performanceMetric)
    }
  }

  // Record memory metrics
  recordMemoryMetrics() {
    const memoryUsage = process.memoryUsage()
    const memoryMetric: MemoryMetrics = {
      timestamp: Date.now(),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024) // MB
    }

    this.memoryMetrics.push(memoryMetric)

    // Keep only last 1000 memory metrics
    if (this.memoryMetrics.length > 1000) {
      this.memoryMetrics = this.memoryMetrics.slice(-500)
    }

    // Alert on high memory usage
    if (memoryMetric.heapUsed > 512) { // 512MB
      console.warn('High memory usage detected:', memoryMetric)
    }
  }

  // Record database query performance
  recordDbQuery(query: string, duration: number) {
    this.dbMetrics.queryCount++
    this.dbMetrics.totalDuration += duration
    this.dbMetrics.averageDuration = this.dbMetrics.totalDuration / this.dbMetrics.queryCount

    // Record slow queries
    if (duration > this.slowQueryThreshold) {
      this.dbMetrics.slowQueries.push({
        query: query.substring(0, 200), // Truncate long queries
        duration,
        timestamp: Date.now()
      })

      // Keep only last 100 slow queries
      if (this.dbMetrics.slowQueries.length > 100) {
        this.dbMetrics.slowQueries = this.dbMetrics.slowQueries.slice(-50)
      }
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    const now = Date.now()
    const lastHourMetrics = this.metrics.filter(m => now - m.timestamp < 3600000) // 1 hour

    const summary = {
      totalMetrics: this.metrics.length,
      lastHourMetrics: lastHourMetrics.length,
      averageResponseTime: this.calculateAverage(lastHourMetrics.map(m => m.duration)),
      slowRequests: lastHourMetrics.filter(m => m.duration > 1000).length,
      criticalIssues: lastHourMetrics.filter(m => m.duration > 5000).length,
      metricsByType: this.groupMetricsByType(lastHourMetrics),
      memoryUsage: this.getCurrentMemoryUsage(),
      databaseMetrics: { ...this.dbMetrics }
    }

    return summary
  }

  // Get detailed metrics for analysis
  getDetailedMetrics(timeRange?: { start: number; end: number }) {
    let filteredMetrics = this.metrics

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    return {
      metrics: filteredMetrics,
      memoryMetrics: this.memoryMetrics,
      databaseMetrics: this.dbMetrics,
      analysis: this.analyzeMetrics(filteredMetrics)
    }
  }

  // Performance analysis
  private analyzeMetrics(metrics: PerformanceMetrics[]) {
    if (metrics.length === 0) return null

    const durations = metrics.map(m => m.duration)
    const analysis = {
      count: metrics.length,
      average: this.calculateAverage(durations),
      median: this.calculateMedian(durations),
      p95: this.calculatePercentile(durations, 95),
      p99: this.calculatePercentile(durations, 99),
      min: Math.min(...durations),
      max: Math.max(...durations),
      slowestEndpoints: this.getSlowestEndpoints(metrics),
      errorRate: this.calculateErrorRate(metrics),
      throughput: this.calculateThroughput(metrics)
    }

    return analysis
  }

  // Helper methods
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length)
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const sorted = [...numbers].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  private calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0
    const sorted = [...numbers].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  private groupMetricsByType(metrics: PerformanceMetrics[]) {
    const grouped: Record<string, { count: number; averageDuration: number }> = {}
    
    metrics.forEach(metric => {
      if (!grouped[metric.type]) {
        grouped[metric.type] = { count: 0, averageDuration: 0 }
      }
      grouped[metric.type].count++
    })

    // Calculate averages
    Object.keys(grouped).forEach(type => {
      const typeMetrics = metrics.filter(m => m.type === type)
      grouped[type].averageDuration = this.calculateAverage(
        typeMetrics.map(m => m.duration)
      )
    })

    return grouped
  }

  private getSlowestEndpoints(metrics: PerformanceMetrics[]) {
    const endpointMetrics: Record<string, number[]> = {}
    
    metrics.forEach(metric => {
      if (!endpointMetrics[metric.name]) {
        endpointMetrics[metric.name] = []
      }
      endpointMetrics[metric.name].push(metric.duration)
    })

    const slowestEndpoints = Object.entries(endpointMetrics)
      .map(([name, durations]) => ({
        name,
        averageDuration: this.calculateAverage(durations),
        maxDuration: Math.max(...durations),
        callCount: durations.length
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 10)

    return slowestEndpoints
  }

  private calculateErrorRate(metrics: PerformanceMetrics[]): number {
    const errorMetrics = metrics.filter(m => m.metadata?.error)
    return metrics.length > 0 ? (errorMetrics.length / metrics.length) * 100 : 0
  }

  private calculateThroughput(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0
    const timeSpan = Math.max(...metrics.map(m => m.timestamp)) - Math.min(...metrics.map(m => m.timestamp))
    return timeSpan > 0 ? (metrics.length / (timeSpan / 1000)) : 0 // requests per second
  }

  private getCurrentMemoryUsage() {
    if (this.memoryMetrics.length === 0) return null
    return this.memoryMetrics[this.memoryMetrics.length - 1]
  }

  // Clear old metrics (can be called periodically)
  clearOldMetrics(olderThanHours: number = 24) {
    const cutoff = Date.now() - (olderThanHours * 3600000)
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    this.memoryMetrics = this.memoryMetrics.filter(m => m.timestamp > cutoff)
  }

  // Export metrics for external analysis
  exportMetrics() {
    return {
      timestamp: Date.now(),
      performance: this.metrics,
      memory: this.memoryMetrics,
      database: this.dbMetrics,
      summary: this.getPerformanceSummary()
    }
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor()

// Middleware to automatically track API performance
export function withPerformanceTracking(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any>,
  name?: string
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = performance.now()
    const requestId = Math.random().toString(36).substring(2, 15)

    try {
      // Execute the handler
      const result = await handler(req, res)
      
      // Record successful request
      const duration = performance.now() - startTime
      performanceMonitor.recordMetric({
        type: 'api',
        name: name || `${req.method} ${req.url}`,
        duration,
        metadata: {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          requestId,
          userAgent: req.headers['user-agent'],
          contentLength: res.get('content-length')
        },
        userId: (req as any).user?.id,
        userAgent: req.headers['user-agent'] as string,
        ip: req.ip || req.connection.remoteAddress
      })

      return result
    } catch (error) {
      // Record failed request
      const duration = performance.now() - startTime
      performanceMonitor.recordMetric({
        type: 'api',
        name: name || `${req.method} ${req.url}`,
        duration,
        metadata: {
          method: req.method,
          url: req.url,
          requestId,
          error: error instanceof Error ? error.message : 'Unknown error',
          userAgent: req.headers['user-agent']
        },
        userId: (req as any).user?.id,
        userAgent: req.headers['user-agent'] as string,
        ip: req.ip || req.connection.remoteAddress
      })

      throw error
    }
  }
}

// React hook for client-side performance monitoring
export function usePerformanceMonitoring() {
  const recordClientMetric = (metric: Omit<PerformanceMetrics, 'id' | 'timestamp'>) => {
    // Send to server for logging
    fetch('/api/performance/client-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    }).catch(console.error)
  }

  const measurePageLoad = () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      recordClientMetric({
        type: 'render',
        name: 'page-load',
        duration: navigation.loadEventEnd - navigation.fetchStart,
        metadata: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        }
      })
    }
  }

  const measureNetworkRequest = (url: string, duration: number, size?: number) => {
    recordClientMetric({
      type: 'network',
      name: url,
      duration,
      metadata: {
        size,
        url
      }
    })
  }

  return {
    recordClientMetric,
    measurePageLoad,
    measureNetworkRequest
  }
}

// Performance monitoring utilities
export const performanceUtils = {
  // Measure function execution time
  measureFunction: <T>(fn: () => T, name: string): T => {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    performanceMonitor.recordMetric({
      type: 'render',
      name,
      duration
    })
    
    return result
  },

  // Measure async function execution time
  measureAsyncFunction: async <T>(fn: () => Promise<T>, name: string): Promise<T> => {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    performanceMonitor.recordMetric({
      type: 'render',
      name,
      duration
    })
    
    return result
  },

  // Database query performance wrapper
  measureDatabaseQuery: async <T>(
    query: () => Promise<T>,
    queryString: string
  ): Promise<T> => {
    const start = performance.now()
    try {
      const result = await query()
      const duration = performance.now() - start
      
      performanceMonitor.recordDbQuery(queryString, duration)
      performanceMonitor.recordMetric({
        type: 'database',
        name: 'db-query',
        duration,
        metadata: { query: queryString.substring(0, 100) }
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      performanceMonitor.recordMetric({
        type: 'database',
        name: 'db-query',
        duration,
        metadata: { 
          query: queryString.substring(0, 100),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }
}

// Start memory monitoring (call this in your app initialization)
export function startMemoryMonitoring(intervalMs: number = 60000) {
  setInterval(() => {
    performanceMonitor.recordMemoryMetrics()
  }, intervalMs)
}

// Cleanup old metrics (call this periodically)
export function startMetricsCleanup(intervalHours: number = 6) {
  setInterval(() => {
    performanceMonitor.clearOldMetrics(24) // Keep 24 hours of metrics
  }, intervalHours * 3600000)
}

export default performanceMonitor