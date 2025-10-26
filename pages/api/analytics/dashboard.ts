import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const dashboardFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  timeRange: z.enum(['TODAY', 'YESTERDAY', 'THIS_WEEK', 'LAST_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'LAST_QUARTER', 'THIS_YEAR', 'CUSTOM']).optional().default('TODAY'),
  agentId: z.string().cuid().optional(),
  hospitalId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
  refresh: z.string().transform(val => val === 'true').optional().default(false),
  includeComparisons: z.string().transform(val => val === 'true').optional().default(true),
  includeForecasts: z.string().transform(val => val === 'true').optional().default(false)
})

const customMetricsSchema = z.object({
  metrics: z.array(z.enum([
    'appointments_total',
    'appointments_completed',
    'appointments_cancelled',
    'revenue_total',
    'revenue_per_appointment',
    'agent_utilization',
    'patient_satisfaction',
    'booking_conversion',
    'no_show_rate',
    'average_wait_time',
    'call_volume',
    'response_time'
  ])).min(1),
  groupBy: z.enum(['hour', 'day', 'week', 'month', 'agent', 'hospital', 'department']).optional().default('day'),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional().default('sum')
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
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Dashboard analytics API error:', error)
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
    const { widget, export: exportFormat } = req.query
    
    if (widget) {
      return await getWidgetData(req, res, widget as string)
    }
    
    if (exportFormat) {
      return await exportDashboardData(req, res, exportFormat as string)
    }
    
    return await getDashboardData(req, res)
  } catch (error) {
    throw error
  }
}

async function getDashboardData(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedFilters = dashboardFiltersSchema.parse(req.query)
    const currentUser = req.headers['x-user-id'] as string
    
    const {
      dateFrom,
      dateTo,
      timeRange,
      agentId,
      hospitalId,
      departmentId,
      refresh,
      includeComparisons,
      includeForecasts
    } = validatedFilters

    // Calculate date range based on timeRange
    const dateRange = calculateDateRange(timeRange, dateFrom, dateTo)
    
    // Get dashboard metrics (in a real implementation, these would be calculated from actual data)
    const metrics = await calculateDashboardMetrics(dateRange, {
      agentId,
      hospitalId,
      departmentId,
      includeComparisons,
      includeForecasts
    })

    // Get real-time data
    const realTimeData = await getRealTimeMetrics()

    // Get charts data
    const chartsData = await getDashboardCharts(dateRange, {
      agentId,
      hospitalId,
      departmentId
    })

    // Get recent activities
    const recentActivities = await getRecentActivities(currentUser, 10)

    // Get alerts and notifications
    const alerts = await getDashboardAlerts(dateRange)

    const dashboardData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange,
        filters: {
          agentId,
          hospitalId,
          departmentId
        },
        refreshedAt: refresh ? new Date().toISOString() : null
      },
      summary: metrics.summary,
      kpis: metrics.kpis,
      comparisons: includeComparisons ? metrics.comparisons : null,
      forecasts: includeForecasts ? metrics.forecasts : null,
      realTime: realTimeData,
      charts: chartsData,
      recentActivities,
      alerts,
      performance: {
        pageLoadTime: Math.random() * 1000 + 500, // Mock load time
        dataFreshness: 'Real-time',
        lastUpdate: new Date().toISOString()
      }
    }

    // Log dashboard access
    await prisma.activityLog.create({
      data: {
        userId: currentUser || 'anonymous',
        action: 'DASHBOARD_ACCESSED',
        entityType: 'Dashboard',
        entityId: 'main_dashboard',
        details: {
          filters: validatedFilters,
          accessedAt: new Date().toISOString()
        }
      }
    })

    res.status(200).json({
      data: dashboardData,
      cache: {
        ttl: 300, // 5 minutes
        lastGenerated: new Date().toISOString()
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

async function getWidgetData(req: NextApiRequest, res: NextApiResponse, widgetId: string) {
  const validatedFilters = dashboardFiltersSchema.parse(req.query)
  const dateRange = calculateDateRange(validatedFilters.timeRange, validatedFilters.dateFrom, validatedFilters.dateTo)

  let widgetData: any = {}

  switch (widgetId) {
    case 'appointments_summary':
      widgetData = await getAppointmentsSummaryWidget(dateRange, validatedFilters)
      break
    case 'revenue_overview':
      widgetData = await getRevenueOverviewWidget(dateRange, validatedFilters)
      break
    case 'agent_performance':
      widgetData = await getAgentPerformanceWidget(dateRange, validatedFilters)
      break
    case 'patient_satisfaction':
      widgetData = await getPatientSatisfactionWidget(dateRange, validatedFilters)
      break
    case 'call_center_metrics':
      widgetData = await getCallCenterMetricsWidget(dateRange, validatedFilters)
      break
    case 'booking_trends':
      widgetData = await getBookingTrendsWidget(dateRange, validatedFilters)
      break
    default:
      return res.status(404).json({ error: 'Widget not found' })
  }

  res.status(200).json({
    data: {
      widgetId,
      ...widgetData,
      lastUpdated: new Date().toISOString()
    }
  })
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { action } = req.query
    
    if (action === 'custom_metrics') {
      return await getCustomMetrics(req, res)
    }
    
    if (action === 'export_config') {
      return await saveDashboardConfig(req, res)
    }
    
    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) {
    throw error
  }
}

async function getCustomMetrics(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = customMetricsSchema.parse(req.body)
    const dateRange = calculateDateRange('THIS_WEEK') // Default range for custom metrics
    
    const customData = await calculateCustomMetrics(validatedData, dateRange)
    
    res.status(200).json({
      data: customData
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
    case 'YESTERDAY':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      return {
        from: yesterday.toISOString(),
        to: today.toISOString()
      }
    case 'THIS_WEEK':
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      return {
        from: startOfWeek.toISOString(),
        to: now.toISOString()
      }
    case 'LAST_WEEK':
      const lastWeekStart = new Date(today)
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7)
      const lastWeekEnd = new Date(lastWeekStart)
      lastWeekEnd.setDate(lastWeekStart.getDate() + 7)
      return {
        from: lastWeekStart.toISOString(),
        to: lastWeekEnd.toISOString()
      }
    case 'THIS_MONTH':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        from: startOfMonth.toISOString(),
        to: now.toISOString()
      }
    case 'LAST_MONTH':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        from: lastMonthStart.toISOString(),
        to: lastMonthEnd.toISOString()
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

async function calculateDashboardMetrics(dateRange: any, filters: any) {
  // Mock calculation - in real implementation, query actual data
  const mockMetrics = {
    summary: {
      totalAppointments: 245,
      completedAppointments: 220,
      cancelledAppointments: 15,
      noShowAppointments: 10,
      totalRevenue: 24500,
      averageRevenue: 100,
      newPatients: 45,
      returningPatients: 200
    },
    kpis: [
      {
        id: 'appointment_completion_rate',
        name: 'Completion Rate',
        value: 89.8,
        unit: '%',
        trend: 'up',
        change: 2.3,
        target: 90,
        status: 'warning'
      },
      {
        id: 'revenue_per_appointment',
        name: 'Revenue per Appointment',
        value: 100,
        unit: '$',
        trend: 'up',
        change: 5.2,
        target: 95,
        status: 'good'
      },
      {
        id: 'patient_satisfaction',
        name: 'Patient Satisfaction',
        value: 4.6,
        unit: '/5',
        trend: 'up',
        change: 0.2,
        target: 4.5,
        status: 'good'
      },
      {
        id: 'agent_utilization',
        name: 'Agent Utilization',
        value: 78.5,
        unit: '%',
        trend: 'down',
        change: -1.8,
        target: 80,
        status: 'warning'
      }
    ],
    comparisons: filters.includeComparisons ? {
      previousPeriod: {
        appointments: {
          current: 245,
          previous: 220,
          change: 11.4,
          trend: 'up'
        },
        revenue: {
          current: 24500,
          previous: 22000,
          change: 11.4,
          trend: 'up'
        }
      },
      yearOverYear: {
        appointments: {
          current: 245,
          previous: 200,
          change: 22.5,
          trend: 'up'
        },
        revenue: {
          current: 24500,
          previous: 20000,
          change: 22.5,
          trend: 'up'
        }
      }
    } : null,
    forecasts: filters.includeForecasts ? {
      nextWeek: {
        appointments: 280,
        revenue: 28000,
        confidence: 85
      },
      nextMonth: {
        appointments: 1200,
        revenue: 120000,
        confidence: 75
      }
    } : null
  }

  return mockMetrics
}

async function getRealTimeMetrics() {
  return {
    activeAgents: 12,
    currentCalls: 8,
    queueLength: 3,
    avgWaitTime: 45, // seconds
    onlinePatients: 156,
    todayBookings: 23,
    systemStatus: 'healthy',
    lastUpdated: new Date().toISOString()
  }
}

async function getDashboardCharts(dateRange: any, filters: any) {
  return {
    appointmentsTrend: {
      type: 'line',
      data: [
        { date: '2024-01-01', appointments: 45, revenue: 4500 },
        { date: '2024-01-02', appointments: 52, revenue: 5200 },
        { date: '2024-01-03', appointments: 38, revenue: 3800 },
        { date: '2024-01-04', appointments: 61, revenue: 6100 },
        { date: '2024-01-05', appointments: 49, revenue: 4900 }
      ]
    },
    appointmentsByStatus: {
      type: 'donut',
      data: [
        { status: 'Completed', count: 220, percentage: 89.8 },
        { status: 'Cancelled', count: 15, percentage: 6.1 },
        { status: 'No Show', count: 10, percentage: 4.1 }
      ]
    },
    revenueByHospital: {
      type: 'bar',
      data: [
        { hospital: 'Central Hospital', revenue: 12000, appointments: 120 },
        { hospital: 'City Medical', revenue: 8500, appointments: 85 },
        { hospital: 'Health Plus', revenue: 4000, appointments: 40 }
      ]
    },
    agentPerformance: {
      type: 'horizontal_bar',
      data: [
        { agent: 'Agent 1', bookings: 45, satisfaction: 4.8 },
        { agent: 'Agent 2', bookings: 38, satisfaction: 4.6 },
        { agent: 'Agent 3', bookings: 52, satisfaction: 4.7 },
        { agent: 'Agent 4', bookings: 41, satisfaction: 4.5 }
      ]
    }
  }
}

async function getRecentActivities(userId: string, limit: number) {
  try {
    const activities = await prisma.activityLog.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      timestamp: activity.createdAt,
      description: generateActivityDescription(activity.action, activity.entityType)
    }))
  } catch (error) {
    // Return mock data if query fails
    return [
      {
        id: '1',
        action: 'APPOINTMENT_CREATED',
        entityType: 'Appointment',
        entityId: 'apt_123',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        description: 'Created new appointment'
      },
      {
        id: '2',
        action: 'PAYMENT_PROCESSED',
        entityType: 'Payment',
        entityId: 'pay_456',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        description: 'Processed payment'
      }
    ]
  }
}

async function getDashboardAlerts(dateRange: any) {
  return [
    {
      id: 'alert_1',
      type: 'warning',
      title: 'High No-Show Rate',
      message: 'No-show rate is above 5% threshold',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      severity: 'medium',
      actionRequired: true
    },
    {
      id: 'alert_2',
      type: 'info',
      title: 'System Maintenance',
      message: 'Scheduled maintenance at 2:00 AM',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      severity: 'low',
      actionRequired: false
    }
  ]
}

// Widget-specific functions
async function getAppointmentsSummaryWidget(dateRange: any, filters: any) {
  return {
    title: 'Appointments Summary',
    data: {
      total: 245,
      completed: 220,
      pending: 10,
      cancelled: 15,
      completionRate: 89.8,
      trend: {
        direction: 'up',
        percentage: 12.5
      }
    }
  }
}

async function getRevenueOverviewWidget(dateRange: any, filters: any) {
  return {
    title: 'Revenue Overview',
    data: {
      total: 24500,
      average: 100,
      target: 25000,
      targetProgress: 98,
      trend: {
        direction: 'up',
        percentage: 15.2
      },
      breakdown: [
        { source: 'Consultations', amount: 18000, percentage: 73.5 },
        { source: 'Procedures', amount: 4500, percentage: 18.4 },
        { source: 'Lab Tests', amount: 2000, percentage: 8.1 }
      ]
    }
  }
}

async function getAgentPerformanceWidget(dateRange: any, filters: any) {
  return {
    title: 'Agent Performance',
    data: {
      totalAgents: 12,
      activeAgents: 10,
      avgBookingsPerAgent: 20.4,
      topPerformer: {
        name: 'Agent 1',
        bookings: 45,
        satisfaction: 4.8
      },
      performanceDistribution: [
        { range: '40+', count: 2 },
        { range: '30-39', count: 4 },
        { range: '20-29', count: 4 },
        { range: '<20', count: 2 }
      ]
    }
  }
}

async function getPatientSatisfactionWidget(dateRange: any, filters: any) {
  return {
    title: 'Patient Satisfaction',
    data: {
      averageRating: 4.6,
      totalResponses: 180,
      responseRate: 73.5,
      ratingDistribution: [
        { rating: 5, count: 120, percentage: 66.7 },
        { rating: 4, count: 35, percentage: 19.4 },
        { rating: 3, count: 15, percentage: 8.3 },
        { rating: 2, count: 7, percentage: 3.9 },
        { rating: 1, count: 3, percentage: 1.7 }
      ],
      trend: {
        direction: 'up',
        change: 0.2
      }
    }
  }
}

async function getCallCenterMetricsWidget(dateRange: any, filters: any) {
  return {
    title: 'Call Center Metrics',
    data: {
      totalCalls: 456,
      answeredCalls: 432,
      missedCalls: 24,
      answerRate: 94.7,
      avgWaitTime: 45,
      avgCallDuration: 180,
      firstCallResolution: 87.5,
      peakHours: ['10:00-11:00', '14:00-15:00'],
      callDistribution: [
        { hour: '09:00', calls: 25 },
        { hour: '10:00', calls: 45 },
        { hour: '11:00', calls: 52 },
        { hour: '14:00', calls: 48 },
        { hour: '15:00', calls: 41 }
      ]
    }
  }
}

async function getBookingTrendsWidget(dateRange: any, filters: any) {
  return {
    title: 'Booking Trends',
    data: {
      totalBookings: 245,
      onlineBookings: 180,
      phoneBookings: 65,
      onlinePercentage: 73.5,
      conversionRate: 45.2,
      popularTimeSlots: [
        { time: '10:00', bookings: 35 },
        { time: '11:00', bookings: 42 },
        { time: '14:00', bookings: 38 }
      ],
      bookingChannels: [
        { channel: 'Website', bookings: 120, percentage: 49.0 },
        { channel: 'Mobile App', bookings: 60, percentage: 24.5 },
        { channel: 'Phone', bookings: 65, percentage: 26.5 }
      ]
    }
  }
}

async function calculateCustomMetrics(config: any, dateRange: any) {
  // Mock custom metrics calculation
  const { metrics, groupBy, aggregation } = config
  
  return {
    metrics: metrics.map((metric: string) => ({
      name: metric,
      value: Math.floor(Math.random() * 1000),
      unit: getMetricUnit(metric),
      trend: Math.random() > 0.5 ? 'up' : 'down',
      change: Math.floor(Math.random() * 20) - 10
    })),
    groupBy,
    aggregation,
    data: generateMockTimeSeriesData(metrics, groupBy)
  }
}

function getMetricUnit(metric: string): string {
  const units: Record<string, string> = {
    'appointments_total': 'count',
    'revenue_total': '$',
    'revenue_per_appointment': '$',
    'agent_utilization': '%',
    'patient_satisfaction': '/5',
    'booking_conversion': '%',
    'no_show_rate': '%',
    'average_wait_time': 'min',
    'response_time': 'sec'
  }
  
  return units[metric] || 'count'
}

function generateMockTimeSeriesData(metrics: string[], groupBy: string) {
  const dataPoints = groupBy === 'hour' ? 24 : groupBy === 'day' ? 7 : 30
  
  return Array.from({ length: dataPoints }, (_, i) => {
    const dataPoint: any = { period: i + 1 }
    
    metrics.forEach(metric => {
      dataPoint[metric] = Math.floor(Math.random() * 100)
    })
    
    return dataPoint
  })
}

function generateActivityDescription(action: string, entityType: string): string {
  const descriptions: Record<string, string> = {
    'APPOINTMENT_CREATED': 'Created new appointment',
    'APPOINTMENT_UPDATED': 'Updated appointment details',
    'PAYMENT_PROCESSED': 'Processed payment',
    'REPORT_GENERATED': 'Generated report',
    'TASK_ASSIGNED': 'Assigned task',
    'USER_LOGIN': 'Logged into system'
  }
  
  return descriptions[action] || `${action.toLowerCase()} ${entityType.toLowerCase()}`
}

async function exportDashboardData(req: NextApiRequest, res: NextApiResponse, format: string) {
  // Mock export functionality
  const exportData = {
    format,
    filename: `dashboard_export_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`,
    size: '2.5MB',
    downloadUrl: `/api/analytics/dashboard/export/${format.toLowerCase()}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }

  res.status(200).json({
    data: exportData
  })
}

async function saveDashboardConfig(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = req.headers['x-user-id'] as string
    const config = req.body

    // Save dashboard configuration
    await prisma.activityLog.create({
      data: {
        userId: currentUser,
        action: 'DASHBOARD_CONFIG_SAVED',
        entityType: 'DashboardConfig',
        entityId: `config_${currentUser}`,
        details: config
      }
    })

    res.status(200).json({
      message: 'Dashboard configuration saved successfully',
      data: {
        configId: `config_${currentUser}`,
        savedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    throw error
  }
}
