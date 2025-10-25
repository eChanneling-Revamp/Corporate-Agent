import { NextApiRequest, NextApiResponse } from 'next'
import performanceMonitor, { withPerformanceTracking } from '../../../lib/performanceMonitor'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { timeRange } = req.query
    
    let timeFilter: { start: number; end: number } | undefined
    
    if (timeRange && typeof timeRange === 'string') {
      const now = Date.now()
      const ranges: Record<string, number> = {
        '1h': 3600000,      // 1 hour
        '6h': 21600000,     // 6 hours  
        '24h': 86400000,    // 24 hours
        '7d': 604800000,    // 7 days
        '30d': 2592000000   // 30 days
      }
      
      const rangeMs = ranges[timeRange]
      if (rangeMs) {
        timeFilter = {
          start: now - rangeMs,
          end: now
        }
      }
    }

    const metrics = performanceMonitor.getDetailedMetrics(timeFilter)
    
    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Performance metrics error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance metrics'
    })
  }
}

export default withPerformanceTracking(handler, 'GET /api/performance/metrics')