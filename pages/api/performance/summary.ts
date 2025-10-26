import { NextApiRequest, NextApiResponse } from 'next'
import performanceMonitor, { withPerformanceTracking } from '../../../lib/performanceMonitor'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const summary = performanceMonitor.getPerformanceSummary()
    
    res.status(200).json({
      success: true,
      data: summary,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Performance summary error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance summary'
    })
  }
}

export default withPerformanceTracking(handler, 'GET /api/performance/summary')
