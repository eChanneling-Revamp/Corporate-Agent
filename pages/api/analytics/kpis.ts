import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const kpiFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  timeRange: z.enum(['TODAY', 'YESTERDAY', 'THIS_WEEK', 'LAST_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'LAST_QUARTER', 'THIS_YEAR', 'CUSTOM']).optional().default('THIS_MONTH'),
  kpiCategories: z.array(z.enum(['OPERATIONAL', 'FINANCIAL', 'CUSTOMER', 'AGENT', 'QUALITY', 'EFFICIENCY'])).optional(),
  hospitalId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
  agentId: z.string().cuid().optional(),
  includeTargets: z.string().transform(val => val === 'true').optional().default(true),
  includeComparisons: z.string().transform(val => val === 'true').optional().default(true),
  includeTrends: z.string().transform(val => val === 'true').optional().default(true),
  includeForecasts: z.string().transform(val => val === 'true').optional().default(false),
  aggregationLevel: z.enum(['INDIVIDUAL', 'TEAM', 'DEPARTMENT', 'HOSPITAL', 'SYSTEM']).optional().default('SYSTEM')
})

const kpiTargetSchema = z.object({
  kpiId: z.string(),
  targetValue: z.number(),
  targetType: z.enum(['ABSOLUTE', 'PERCENTAGE', 'RATIO']),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
  entityType: z.enum(['SYSTEM', 'HOSPITAL', 'DEPARTMENT', 'AGENT']).optional().default('SYSTEM'),
  entityId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  alertThresholds: z.object({
    warning: z.number().optional(),
    critical: z.number().optional()
  }).optional()
})

const kpiDefinitionSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  category: z.enum(['OPERATIONAL', 'FINANCIAL', 'CUSTOMER', 'AGENT', 'QUALITY', 'EFFICIENCY']),
  metricType: z.enum(['COUNT', 'PERCENTAGE', 'RATIO', 'AVERAGE', 'SUM', 'RATE']),
  formula: z.string(),
  unit: z.string(),
  displayFormat: z.enum(['NUMBER', 'PERCENTAGE', 'CURRENCY', 'TIME', 'RATIO']),
  isHigherBetter: z.boolean().optional().default(true),
  frequency: z.enum(['REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']).optional().default('DAILY'),
  dataSource: z.object({
    tables: z.array(z.string()),
    filters: z.record(z.string(), z.any()).optional(),
    aggregations: z.record(z.string(), z.string()).optional()
  }),
  visualization: z.object({
    chartType: z.enum(['NUMBER', 'GAUGE', 'LINE', 'BAR', 'DONUT']).optional().default('NUMBER'),
    colorScheme: z.enum(['GREEN_RED', 'BLUE_ORANGE', 'CUSTOM']).optional().default('GREEN_RED'),
    thresholds: z.object({
      excellent: z.number().optional(),
      good: z.number().optional(),
      warning: z.number().optional(),
      critical: z.number().optional()
    }).optional()
  }).optional(),
  isActive: z.boolean().optional().default(true),
  accessLevel: z.enum(['PUBLIC', 'RESTRICTED', 'PRIVATE']).optional().default('PUBLIC')
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res)
        break
      case 'POST':
        await handlePost(req, res)
        break
      case 'PUT':
        await handlePut(req, res)
        break
      case 'DELETE':
        await handleDelete(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('KPIs analytics API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { action, kpiId, category, export: exportFormat } = req.query
    
    if (action === 'definitions') {
      return await getKpiDefinitions(req, res)
    }
    
    if (action === 'targets' && kpiId) {
      return await getKpiTargets(req, res, kpiId as string)
    }
    
    if (action === 'history' && kpiId) {
      return await getKpiHistory(req, res, kpiId as string)
    }
    
    if (action === 'scorecard') {
      return await getKpiScorecard(req, res)
    }
    
    if (action === 'benchmarks') {
      return await getKpiBenchmarks(req, res)
    }
    
    if (category) {
      return await getKpisByCategory(req, res, category as string)
    }
    
    if (exportFormat) {
      return await exportKpiData(req, res, exportFormat as string)
    }
    
    if (kpiId) {
      return await getKpiDetails(req, res, kpiId as string)
    }
    
    return await getKpisOverview(req, res)
  } catch (error) {
    throw error
  }
}

async function getKpisOverview(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedFilters = kpiFiltersSchema.parse(req.query)
    const currentUser = req.headers['x-user-id'] as string
    
    const {
      dateFrom,
      dateTo,
      timeRange,
      kpiCategories,
      hospitalId,
      departmentId,
      agentId,
      includeTargets,
      includeComparisons,
      includeTrends,
      includeForecasts,
      aggregationLevel
    } = validatedFilters

    const dateRange = calculateDateRange(timeRange, dateFrom, dateTo)
    
    // Get KPI data
    const kpis = await calculateKpis(dateRange, validatedFilters)
    
    // Get targets if requested
    const targets = includeTargets ? await getKpiTargetsData(kpis, validatedFilters) : null
    
    // Get comparisons if requested
    const comparisons = includeComparisons ? await getKpiComparisons(dateRange, validatedFilters) : null
    
    // Get trends if requested
    const trends = includeTrends ? await getKpiTrends(kpis, dateRange) : null
    
    // Get forecasts if requested
    const forecasts = includeForecasts ? await getKpiForecasts(kpis, dateRange) : null
    
    // Generate insights
    const insights = await generateKpiInsights(kpis, targets, trends)

    const response = {
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange,
        aggregationLevel,
        filters: validatedFilters
      },
      summary: {
        totalKpis: kpis.length,
        onTargetKpis: kpis.filter((kpi: any) => kpi.status === 'on_target').length,
        aboveTargetKpis: kpis.filter((kpi: any) => kpi.status === 'above_target').length,
        belowTargetKpis: kpis.filter((kpi: any) => kpi.status === 'below_target').length,
        overallScore: calculateOverallScore(kpis),
        improvementRate: calculateImprovementRate(kpis, comparisons)
      },
      kpis,
      targets,
      comparisons,
      trends,
      forecasts,
      insights,
      alerts: await generateKpiAlerts(kpis, targets),
      recommendations: await generateKpiRecommendations(kpis, insights)
    }

    // Log KPI access
    await prisma.activityLog.create({
      data: {
        userId: currentUser || 'anonymous',
        action: 'KPI_OVERVIEW_ACCESSED',
        entityType: 'KPIOverview',
        entityId: `kpi_overview_${aggregationLevel.toLowerCase()}`,
        details: {
          filters: validatedFilters,
          accessedAt: new Date().toISOString()
        }
      }
    })

    res.status(200).json({ data: response })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      })
    } else {
      throw error
    }
  }
}

async function getKpiDetails(req: NextApiRequest, res: NextApiResponse, kpiId: string) {
  try {
    const validatedFilters = kpiFiltersSchema.parse(req.query)
    const dateRange = calculateDateRange(validatedFilters.timeRange, validatedFilters.dateFrom, validatedFilters.dateTo)
    
    // Get detailed KPI data
    const kpiDetail = await getKpiDetailData(kpiId, dateRange, validatedFilters)
    
    if (!kpiDetail) {
      return res.status(404).json({ error: 'KPI not found' })
    }

    const response = {
      kpi: kpiDetail,
      history: await getKpiHistoryData(kpiId, dateRange),
      targets: await getKpiTargetData(kpiId, dateRange),
      breakdowns: await getKpiBreakdowns(kpiId, dateRange, validatedFilters),
      correlations: await getKpiCorrelations(kpiId, dateRange),
      insights: await generateKpiSpecificInsights(kpiDetail)
    }

    res.status(200).json({ data: response })
  } catch (error) {
    throw error
  }
}

async function getKpisByCategory(req: NextApiRequest, res: NextApiResponse, category: string) {
  try {
    const validatedFilters = kpiFiltersSchema.parse(req.query)
    const dateRange = calculateDateRange(validatedFilters.timeRange, validatedFilters.dateFrom, validatedFilters.dateTo)
    
    const categoryKpis = await getKpisByCategoryData(category, dateRange, validatedFilters)
    
    res.status(200).json({
      data: {
        category,
        dateRange,
        kpis: categoryKpis,
        summary: {
          totalKpis: categoryKpis.length,
          averageScore: categoryKpis.reduce((sum: number, kpi: any) => sum + kpi.score, 0) / categoryKpis.length,
          categoryTrend: calculateCategoryTrend(categoryKpis)
        }
      }
    })
  } catch (error) {
    throw error
  }
}

async function getKpiScorecard(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedFilters = kpiFiltersSchema.parse(req.query)
    const dateRange = calculateDateRange(validatedFilters.timeRange, validatedFilters.dateFrom, validatedFilters.dateTo)
    
    const scorecard = await generateKpiScorecard(dateRange, validatedFilters)
    
    res.status(200).json({
      data: {
        scorecard,
        metadata: {
          generatedAt: new Date().toISOString(),
          dateRange,
          scoringMethod: 'Weighted Average',
          totalPossibleScore: 100
        }
      }
    })
  } catch (error) {
    throw error
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { action } = req.query
    const currentUser = req.headers['x-user-id'] as string

    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (action === 'set_target') {
      return await setKpiTarget(req, res)
    }
    
    if (action === 'create_kpi') {
      return await createKpiDefinition(req, res)
    }
    
    if (action === 'calculate') {
      return await calculateCustomKpi(req, res)
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) {
    throw error
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { kpiId, action } = req.query
    const currentUser = req.headers['x-user-id'] as string

    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (action === 'update_target') {
      return await updateKpiTarget(req, res, kpiId as string)
    }
    
    if (action === 'update_definition') {
      return await updateKpiDefinition(req, res, kpiId as string)
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) {
    throw error
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { kpiId } = req.query
    const currentUser = req.headers['x-user-id'] as string

    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!kpiId) {
      return res.status(400).json({ error: 'KPI ID is required' })
    }

    await deleteKpiDefinition(req, res, kpiId as string)
  } catch (error) {
    throw error
  }
}

// Helper functions
function calculateDateRange(timeRange: string, dateFrom?: string, dateTo?: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (timeRange) {
    case 'TODAY':
      return {
        from: today.toISOString(),
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      }
    case 'THIS_WEEK':
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      return {
        from: startOfWeek.toISOString(),
        to: now.toISOString()
      }
    case 'THIS_MONTH':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        from: startOfMonth.toISOString(),
        to: now.toISOString()
      }
    case 'THIS_QUARTER':
      const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
      return {
        from: quarterStart.toISOString(),
        to: now.toISOString()
      }
    case 'CUSTOM':
      return {
        from: dateFrom || today.toISOString(),
        to: dateTo || now.toISOString()
      }
    default:
      return {
        from: today.toISOString(),
        to: now.toISOString()
      }
  }
}

async function calculateKpis(dateRange: any, filters: any) {
  // Mock KPI calculations - in real implementation, these would be calculated from actual data
  const kpis = [
    {
      id: 'appointment_completion_rate',
      name: 'Appointment Completion Rate',
      category: 'OPERATIONAL',
      value: 89.5,
      unit: '%',
      target: 90,
      previousValue: 87.2,
      change: 2.3,
      changeType: 'increase',
      status: 'warning', // below_target, on_target, above_target
      score: 89.5,
      trend: 'up',
      lastUpdated: new Date().toISOString(),
      formula: '(Completed Appointments / Total Appointments) * 100',
      visualization: {
        chartType: 'GAUGE',
        colorScheme: 'GREEN_RED'
      }
    },
    {
      id: 'revenue_per_appointment',
      name: 'Revenue per Appointment',
      category: 'FINANCIAL',
      value: 105.50,
      unit: '$',
      target: 100,
      previousValue: 98.20,
      change: 7.4,
      changeType: 'increase',
      status: 'above_target',
      score: 105.5,
      trend: 'up',
      lastUpdated: new Date().toISOString(),
      formula: 'Total Revenue / Total Appointments',
      visualization: {
        chartType: 'NUMBER',
        colorScheme: 'GREEN_RED'
      }
    },
    {
      id: 'customer_satisfaction',
      name: 'Customer Satisfaction Score',
      category: 'CUSTOMER',
      value: 4.6,
      unit: '/5',
      target: 4.5,
      previousValue: 4.4,
      change: 4.5,
      changeType: 'increase',
      status: 'above_target',
      score: 92,
      trend: 'up',
      lastUpdated: new Date().toISOString(),
      formula: 'Average of all customer ratings',
      visualization: {
        chartType: 'GAUGE',
        colorScheme: 'GREEN_RED'
      }
    },
    {
      id: 'agent_utilization',
      name: 'Agent Utilization Rate',
      category: 'AGENT',
      value: 78.5,
      unit: '%',
      target: 85,
      previousValue: 80.1,
      change: -2.0,
      changeType: 'decrease',
      status: 'below_target',
      score: 78.5,
      trend: 'down',
      lastUpdated: new Date().toISOString(),
      formula: '(Active Time / Total Available Time) * 100',
      visualization: {
        chartType: 'BAR',
        colorScheme: 'GREEN_RED'
      }
    },
    {
      id: 'first_call_resolution',
      name: 'First Call Resolution Rate',
      category: 'QUALITY',
      value: 87.3,
      unit: '%',
      target: 85,
      previousValue: 85.8,
      change: 1.7,
      changeType: 'increase',
      status: 'above_target',
      score: 87.3,
      trend: 'up',
      lastUpdated: new Date().toISOString(),
      formula: '(Resolved on First Call / Total Calls) * 100',
      visualization: {
        chartType: 'DONUT',
        colorScheme: 'GREEN_RED'
      }
    },
    {
      id: 'average_response_time',
      name: 'Average Response Time',
      category: 'EFFICIENCY',
      value: 12.5,
      unit: 'seconds',
      target: 15,
      previousValue: 14.2,
      change: -12.0,
      changeType: 'decrease',
      status: 'above_target', // Lower is better for response time
      score: 83.3,
      trend: 'down',
      lastUpdated: new Date().toISOString(),
      formula: 'Sum of Response Times / Number of Interactions',
      visualization: {
        chartType: 'LINE',
        colorScheme: 'GREEN_RED'
      }
    }
  ]

  // Filter by categories if specified
  if (filters.kpiCategories && filters.kpiCategories.length > 0) {
    return kpis.filter(kpi => filters.kpiCategories.includes(kpi.category))
  }

  return kpis
}

async function getKpiTargetsData(kpis: any[], filters: any) {
  return kpis.map(kpi => ({
    kpiId: kpi.id,
    target: kpi.target,
    currentValue: kpi.value,
    achievement: (kpi.value / kpi.target) * 100,
    status: kpi.status,
    daysToTarget: calculateDaysToTarget(kpi),
    targetHistory: generateTargetHistory(kpi.id)
  }))
}

async function getKpiComparisons(dateRange: any, filters: any) {
  return {
    previousPeriod: {
      appointmentCompletion: { current: 89.5, previous: 87.2, change: 2.6 },
      revenuePerAppointment: { current: 105.50, previous: 98.20, change: 7.4 },
      customerSatisfaction: { current: 4.6, previous: 4.4, change: 4.5 }
    },
    industryBenchmark: {
      appointmentCompletion: { current: 89.5, benchmark: 85.0, position: 'above' },
      customerSatisfaction: { current: 4.6, benchmark: 4.2, position: 'above' },
      responseTime: { current: 12.5, benchmark: 18.0, position: 'above' }
    },
    yearOverYear: {
      appointmentCompletion: { current: 89.5, previous: 82.1, change: 9.0 },
      revenue: { current: 105.50, previous: 89.30, change: 18.1 }
    }
  }
}

async function getKpiTrends(kpis: any[], dateRange: any) {
  return kpis.map(kpi => ({
    kpiId: kpi.id,
    trend: kpi.trend,
    trendData: generateTrendData(kpi.id, 30), // Last 30 days
    volatility: calculateKpiVolatility(kpi.id),
    forecast: generateShortTermForecast(kpi)
  }))
}

async function getKpiForecasts(kpis: any[], dateRange: any) {
  return kpis.map(kpi => ({
    kpiId: kpi.id,
    forecast: generateKpiForecast(kpi, 30), // 30 days forecast
    confidence: Math.random() * 20 + 75, // 75-95% confidence
    model: 'Linear Regression with Seasonality'
  }))
}

async function generateKpiInsights(kpis: any[], targets: any, trends: any) {
  const insights = []

  // Performance insights
  const belowTargetKpis = kpis.filter(kpi => kpi.status === 'below_target')
  if (belowTargetKpis.length > 0) {
    insights.push({
      type: 'performance',
      severity: 'warning',
      title: `${belowTargetKpis.length} KPIs Below Target`,
      description: `Focus needed on: ${belowTargetKpis.map(k => k.name).join(', ')}`,
      kpis: belowTargetKpis.map(k => k.id),
      recommendation: 'Review processes and implement improvement actions'
    })
  }

  // Trend insights
  const decliningKpis = kpis.filter(kpi => kpi.trend === 'down')
  if (decliningKpis.length > 0) {
    insights.push({
      type: 'trend',
      severity: 'warning',
      title: `${decliningKpis.length} KPIs Showing Declining Trend`,
      description: `Declining metrics: ${decliningKpis.map(k => k.name).join(', ')}`,
      kpis: decliningKpis.map(k => k.id),
      recommendation: 'Investigate root causes and implement corrective measures'
    })
  }

  // Achievement insights
  const excellentKpis = kpis.filter(kpi => kpi.status === 'above_target' && kpi.change > 10)
  if (excellentKpis.length > 0) {
    insights.push({
      type: 'achievement',
      severity: 'positive',
      title: `${excellentKpis.length} KPIs Showing Excellent Performance`,
      description: `Outstanding results in: ${excellentKpis.map(k => k.name).join(', ')}`,
      kpis: excellentKpis.map(k => k.id),
      recommendation: 'Document best practices and replicate success factors'
    })
  }

  return insights
}

async function generateKpiAlerts(kpis: any[], targets: any) {
  const alerts = []

  kpis.forEach(kpi => {
    if (kpi.status === 'below_target' && Math.abs(kpi.change) > 5) {
      alerts.push({
        id: `alert_${kpi.id}`,
        kpiId: kpi.id,
        type: 'threshold',
        severity: kpi.value < kpi.target * 0.9 ? 'critical' : 'warning',
        title: `${kpi.name} Below Target`,
        message: `Current value ${kpi.value}${kpi.unit} is below target ${kpi.target}${kpi.unit}`,
        timestamp: new Date().toISOString(),
        actionRequired: true
      })
    }

    if (kpi.trend === 'down' && kpi.change < -10) {
      alerts.push({
        id: `trend_alert_${kpi.id}`,
        kpiId: kpi.id,
        type: 'trend',
        severity: 'warning',
        title: `${kpi.name} Significant Decline`,
        message: `${Math.abs(kpi.change).toFixed(1)}% decrease from previous period`,
        timestamp: new Date().toISOString(),
        actionRequired: true
      })
    }
  })

  return alerts
}

async function generateKpiRecommendations(kpis: any[], insights: any[]) {
  const recommendations = []

  // Operational recommendations
  const operationalKpis = kpis.filter(kpi => kpi.category === 'OPERATIONAL' && kpi.status === 'below_target')
  if (operationalKpis.length > 0) {
    recommendations.push({
      category: 'OPERATIONAL',
      priority: 'high',
      title: 'Improve Operational Efficiency',
      description: 'Review appointment scheduling and completion processes',
      actions: [
        'Analyze appointment cancellation patterns',
        'Implement automated reminder system',
        'Optimize staff scheduling during peak hours'
      ],
      expectedImpact: 'Medium',
      timeframe: '2-4 weeks'
    })
  }

  // Agent performance recommendations
  const agentKpis = kpis.filter(kpi => kpi.category === 'AGENT' && kpi.status === 'below_target')
  if (agentKpis.length > 0) {
    recommendations.push({
      category: 'AGENT',
      priority: 'medium',
      title: 'Enhance Agent Performance',
      description: 'Implement training and support programs for agents',
      actions: [
        'Provide additional training on booking procedures',
        'Implement peer mentoring program',
        'Review workload distribution'
      ],
      expectedImpact: 'High',
      timeframe: '1-2 months'
    })
  }

  return recommendations
}

function calculateOverallScore(kpis: any[]): number {
  if (kpis.length === 0) return 0
  
  const totalScore = kpis.reduce((sum, kpi) => sum + kpi.score, 0)
  return Math.round(totalScore / kpis.length)
}

function calculateImprovementRate(kpis: any[], comparisons: any): number {
  if (!comparisons) return 0
  
  const improvingKpis = kpis.filter(kpi => kpi.changeType === 'increase' && kpi.change > 0)
  return Math.round((improvingKpis.length / kpis.length) * 100)
}

function calculateDaysToTarget(kpi: any): number | null {
  if (kpi.status === 'above_target' || kpi.status === 'on_target') return null
  
  const currentRate = kpi.change / 30 // Assuming change is over 30 days
  if (currentRate <= 0) return null
  
  const gap = kpi.target - kpi.value
  return Math.ceil(gap / currentRate)
}

function generateTargetHistory(kpiId: string) {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - i))
    return {
      month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      target: 90 + Math.random() * 10,
      actual: 85 + Math.random() * 15
    }
  })
}

function generateTrendData(kpiId: string, days: number) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    return {
      date: date.toISOString().split('T')[0],
      value: 85 + Math.sin(i * 0.1) * 5 + Math.random() * 10
    }
  })
}

function calculateKpiVolatility(kpiId: string): number {
  // Mock volatility calculation
  return Math.random() * 0.2 + 0.05 // 5-25% volatility
}

function generateShortTermForecast(kpi: any) {
  const days = 7
  return Array.from({ length: days }, (_, i) => {
    const trend = kpi.changeType === 'increase' ? 1.001 : 0.999
    return {
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      predicted: kpi.value * Math.pow(trend, i + 1) + (Math.random() - 0.5) * 2
    }
  })
}

function generateKpiForecast(kpi: any, days: number) {
  return Array.from({ length: days }, (_, i) => {
    const trend = kpi.changeType === 'increase' ? 1.001 : 0.999
    const seasonal = 1 + 0.05 * Math.sin((i / 7) * 2 * Math.PI)
    const baseValue = kpi.value * Math.pow(trend, i + 1) * seasonal
    
    return {
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      predicted: baseValue,
      confidenceInterval: {
        lower: baseValue * 0.9,
        upper: baseValue * 1.1
      }
    }
  })
}

// Implementation stubs for remaining functions
async function getKpiDetailData(kpiId: string, dateRange: any, filters: any) {
  // Mock implementation - in real app, fetch detailed KPI data
  return {
    id: kpiId,
    name: 'Appointment Completion Rate',
    description: 'Percentage of scheduled appointments that are completed',
    category: 'OPERATIONAL',
    currentValue: 89.5,
    target: 90,
    unit: '%',
    status: 'warning'
  }
}

async function getKpiHistoryData(kpiId: string, dateRange: any) {
  return generateTrendData(kpiId, 30)
}

async function getKpiTargetData(kpiId: string, dateRange: any) {
  return {
    current: 90,
    history: generateTargetHistory(kpiId)
  }
}

async function getKpiBreakdowns(kpiId: string, dateRange: any, filters: any) {
  return {
    byHospital: [
      { name: 'Central Hospital', value: 92.1 },
      { name: 'City Medical', value: 87.3 }
    ],
    byAgent: [
      { name: 'Agent 1', value: 95.2 },
      { name: 'Agent 2', value: 88.7 }
    ]
  }
}

async function getKpiCorrelations(kpiId: string, dateRange: any) {
  return [
    {
      withKpi: 'customer_satisfaction',
      correlation: 0.78,
      strength: 'strong'
    }
  ]
}

async function generateKpiSpecificInsights(kpiDetail: any) {
  return [
    {
      type: 'optimization',
      message: 'Peak performance occurs during 10-11 AM slot',
      confidence: 0.85
    }
  ]
}

async function getKpisByCategoryData(category: string, dateRange: any, filters: any) {
  const allKpis = await calculateKpis(dateRange, filters)
  return allKpis.filter(kpi => kpi.category === category)
}

function calculateCategoryTrend(categoryKpis: any[]): string {
  const upTrend = categoryKpis.filter(kpi => kpi.trend === 'up').length
  const downTrend = categoryKpis.filter(kpi => kpi.trend === 'down').length
  
  if (upTrend > downTrend) return 'improving'
  if (downTrend > upTrend) return 'declining'
  return 'stable'
}

async function generateKpiScorecard(dateRange: any, filters: any) {
  const kpis = await calculateKpis(dateRange, filters)
  
  return {
    overallScore: calculateOverallScore(kpis),
    categoryScores: {
      OPERATIONAL: 87.5,
      FINANCIAL: 92.1,
      CUSTOMER: 89.3,
      AGENT: 78.5,
      QUALITY: 85.7,
      EFFICIENCY: 83.2
    },
    gradeBreakdown: {
      excellent: kpis.filter(kpi => kpi.score >= 90).length,
      good: kpis.filter(kpi => kpi.score >= 80 && kpi.score < 90).length,
      average: kpis.filter(kpi => kpi.score >= 70 && kpi.score < 80).length,
      poor: kpis.filter(kpi => kpi.score < 70).length
    }
  }
}

// CRUD operations for KPI management
async function setKpiTarget(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = kpiTargetSchema.parse(req.body)
    const currentUser = req.headers['x-user-id'] as string

    const targetId = `target_${Date.now()}`
    
    await prisma.activityLog.create({
      data: {
        userId: currentUser,
        action: 'KPI_TARGET_SET',
        entityType: 'KPITarget',
        entityId: targetId,
        details: {
          ...validatedData,
          targetId,
          createdAt: new Date().toISOString()
        }
      }
    })

    res.status(201).json({
      message: 'KPI target set successfully',
      data: {
        targetId,
        ...validatedData,
        createdAt: new Date().toISOString()
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      })
    } else {
      throw error
    }
  }
}

async function createKpiDefinition(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = kpiDefinitionSchema.parse(req.body)
    const currentUser = req.headers['x-user-id'] as string

    const kpiId = `kpi_${Date.now()}`
    
    await prisma.activityLog.create({
      data: {
        userId: currentUser,
        action: 'KPI_DEFINITION_CREATED',
        entityType: 'KPIDefinition',
        entityId: kpiId,
        details: {
          ...validatedData,
          kpiId,
          createdBy: currentUser,
          createdAt: new Date().toISOString()
        }
      }
    })

    res.status(201).json({
      message: 'KPI definition created successfully',
      data: {
        kpiId,
        ...validatedData,
        createdAt: new Date().toISOString()
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      })
    } else {
      throw error
    }
  }
}

async function calculateCustomKpi(req: NextApiRequest, res: NextApiResponse) {
  const { formula, dataSource, timeRange } = req.body
  
  // Mock custom KPI calculation
  const result = {
    value: Math.random() * 100,
    calculatedAt: new Date().toISOString(),
    formula,
    dataPoints: Math.floor(Math.random() * 1000) + 100
  }
  
  res.status(200).json({
    message: 'Custom KPI calculated successfully',
    data: result
  })
}

async function updateKpiTarget(req: NextApiRequest, res: NextApiResponse, kpiId: string) {
  const currentUser = req.headers['x-user-id'] as string
  const updates = req.body

  await prisma.activityLog.create({
    data: {
      userId: currentUser,
      action: 'KPI_TARGET_UPDATED',
      entityType: 'KPITarget',
      entityId: kpiId,
      details: {
        updates,
        updatedAt: new Date().toISOString()
      }
    }
  })

  res.status(200).json({
    message: 'KPI target updated successfully',
    data: {
      kpiId,
      updates,
      updatedAt: new Date().toISOString()
    }
  })
}

async function updateKpiDefinition(req: NextApiRequest, res: NextApiResponse, kpiId: string) {
  const currentUser = req.headers['x-user-id'] as string
  const updates = req.body

  await prisma.activityLog.create({
    data: {
      userId: currentUser,
      action: 'KPI_DEFINITION_UPDATED',
      entityType: 'KPIDefinition',
      entityId: kpiId,
      details: {
        updates,
        updatedAt: new Date().toISOString()
      }
    }
  })

  res.status(200).json({
    message: 'KPI definition updated successfully',
    data: {
      kpiId,
      updates,
      updatedAt: new Date().toISOString()
    }
  })
}

async function deleteKpiDefinition(req: NextApiRequest, res: NextApiResponse, kpiId: string) {
  const currentUser = req.headers['x-user-id'] as string

  await prisma.activityLog.create({
    data: {
      userId: currentUser,
      action: 'KPI_DEFINITION_DELETED',
      entityType: 'KPIDefinition',
      entityId: kpiId,
      details: {
        deletedAt: new Date().toISOString()
      }
    }
  })

  res.status(200).json({
    message: 'KPI definition deleted successfully',
    data: {
      kpiId,
      deletedAt: new Date().toISOString()
    }
  })
}

async function getKpiDefinitions(req: NextApiRequest, res: NextApiResponse) {
  const mockDefinitions = [
    {
      id: 'appointment_completion_rate',
      name: 'Appointment Completion Rate',
      category: 'OPERATIONAL',
      metricType: 'PERCENTAGE',
      formula: '(Completed Appointments / Total Appointments) * 100',
      unit: '%',
      isActive: true
    },
    {
      id: 'revenue_per_appointment',
      name: 'Revenue per Appointment',
      category: 'FINANCIAL',
      metricType: 'AVERAGE',
      formula: 'Total Revenue / Total Appointments',
      unit: '$',
      isActive: true
    }
  ]

  res.status(200).json({
    data: mockDefinitions
  })
}

async function getKpiTargets(req: NextApiRequest, res: NextApiResponse, kpiId: string) {
  const mockTargets = {
    current: {
      value: 90,
      period: 'MONTHLY',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    history: generateTargetHistory(kpiId)
  }

  res.status(200).json({
    data: mockTargets
  })
}

async function getKpiHistory(req: NextApiRequest, res: NextApiResponse, kpiId: string) {
  const history = generateTrendData(kpiId, 90) // 90 days of history

  res.status(200).json({
    data: {
      kpiId,
      history,
      statistics: {
        average: 87.5,
        minimum: 75.2,
        maximum: 95.8,
        standardDeviation: 4.3
      }
    }
  })
}

async function getKpiBenchmarks(req: NextApiRequest, res: NextApiResponse) {
  const benchmarks = {
    industry: {
      appointmentCompletion: 85.0,
      customerSatisfaction: 4.2,
      responseTime: 18.0,
      agentUtilization: 80.0
    },
    topPerformers: {
      appointmentCompletion: 95.0,
      customerSatisfaction: 4.8,
      responseTime: 8.0,
      agentUtilization: 90.0
    },
    internal: {
      best: 92.3,
      average: 85.7,
      worst: 78.1
    }
  }

  res.status(200).json({
    data: benchmarks
  })
}

async function exportKpiData(req: NextApiRequest, res: NextApiResponse, format: string) {
  const exportData = {
    format,
    filename: `kpi_report_${new Date().toISOString().split('T')[0]}.${format}`,
    size: '2.8MB',
    downloadUrl: `/api/analytics/kpis/export/${format}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }

  res.status(200).json({
    data: exportData
  })
}
