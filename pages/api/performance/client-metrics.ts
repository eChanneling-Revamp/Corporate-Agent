import { NextApiRequest, NextApiResponse } from 'next'
import performanceMonitor, { withPerformanceTracking } from '../../../lib/performanceMonitor'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'POST':
      return handleClientMetrics(req, res)
    case 'GET':
      return getClientMetrics(req, res)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleClientMetrics(req: NextApiRequest, res: NextApiResponse) {
  try {
    const clientMetric = req.body
    
    // Validate client metric
    if (!clientMetric.type || !clientMetric.name || typeof clientMetric.duration !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid client metric format'
      })
    }

    // Add client-side indicator to metadata
    const enhancedMetric = {
      ...clientMetric,
      metadata: {
        ...clientMetric.metadata,
        source: 'client',
        userAgent: req.headers['user-agent'],
        timestamp: Date.now()
      },
      userAgent: req.headers['user-agent'],
      ip: (req as any).ip || req.socket?.remoteAddress || 'unknown'
    }

    // Record the client metric
    performanceMonitor.recordMetric(enhancedMetric)
    
    res.status(200).json({
      success: true,
      message: 'Client metric recorded'
    })
  } catch (error) {
    console.error('Client metrics error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to record client metric'
    })
  }
}

async function getClientMetrics(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { timeRange = '1h' } = req.query
    
    // Get detailed metrics and filter for client-side metrics
    const now = Date.now()
    const ranges: Record<string, number> = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000
    }
    
    const rangeMs = ranges[timeRange as string] || ranges['1h']
    const timeFilter = {
      start: now - rangeMs,
      end: now
    }

    const allMetrics = performanceMonitor.getDetailedMetrics(timeFilter)
    
    // Filter for client metrics
    const clientMetrics = allMetrics.metrics.filter(
      metric => metric.metadata?.source === 'client'
    )

    // Analyze client-specific performance
    const clientAnalysis = {
      totalMetrics: clientMetrics.length,
      pageLoadMetrics: clientMetrics.filter(m => m.name === 'page-load'),
      networkMetrics: clientMetrics.filter(m => m.type === 'network'),
      renderMetrics: clientMetrics.filter(m => m.type === 'render'),
      averagePageLoadTime: calculateAverage(
        clientMetrics
          .filter(m => m.name === 'page-load')
          .map(m => m.duration)
      ),
      averageNetworkTime: calculateAverage(
        clientMetrics
          .filter(m => m.type === 'network')
          .map(m => m.duration)
      )
    }

    res.status(200).json({
      success: true,
      data: {
        metrics: clientMetrics,
        analysis: clientAnalysis
      },
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Get client metrics error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve client metrics'
    })
  }
}

function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length)
}

export default withPerformanceTracking(handler, 'Client Metrics API')
