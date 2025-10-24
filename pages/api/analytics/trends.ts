import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const trendsFiltersSchema = z.object({
  metric: z.enum(['appointments', 'revenue', 'agents', 'hospitals', 'doctors', 'patients']).optional(),
  period: z.enum(['7d', '30d', '90d', '6m', '1y']).default('30d'),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
  comparison: z.enum(['previous_period', 'previous_year', 'none']).default('previous_period'),
  agentIds: z.array(z.string().cuid()).optional(),
  hospitalIds: z.array(z.string().cuid()).optional(),
  doctorIds: z.array(z.string().cuid()).optional(),
  specializations: z.array(z.string()).optional(),
  dateFrom: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
  dateTo: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res)
        break
      default:
        res.setHeader('Allow', ['GET'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Analytics trends API error:', error)
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
    const validatedFilters = trendsFiltersSchema.parse(req.query)
    
    const {
      metric,
      period,
      granularity,
      comparison,
      agentIds,
      hospitalIds,
      doctorIds,
      specializations,
      dateFrom,
      dateTo
    } = validatedFilters

    // Calculate date ranges
    const { startDate, endDate, comparisonStartDate, comparisonEndDate } = calculateDateRanges(
      period, 
      comparison, 
      dateFrom, 
      dateTo
    )

    let trends = {}

    if (!metric || metric === 'appointments') {
      trends = { ...trends, appointments: await getAppointmentTrends(
        startDate, endDate, granularity, agentIds, hospitalIds, doctorIds, specializations,
        comparisonStartDate, comparisonEndDate
      )}
    }

    if (!metric || metric === 'revenue') {
      trends = { ...trends, revenue: await getRevenueTrends(
        startDate, endDate, granularity, agentIds, hospitalIds, doctorIds, specializations,
        comparisonStartDate, comparisonEndDate
      )}
    }

    if (!metric || metric === 'agents') {
      trends = { ...trends, agents: await getAgentTrends(
        startDate, endDate, granularity, agentIds,
        comparisonStartDate, comparisonEndDate
      )}
    }

    if (!metric || metric === 'hospitals') {
      trends = { ...trends, hospitals: await getHospitalTrends(
        startDate, endDate, granularity, hospitalIds,
        comparisonStartDate, comparisonEndDate
      )}
    }

    if (!metric || metric === 'doctors') {
      trends = { ...trends, doctors: await getDoctorTrends(
        startDate, endDate, granularity, doctorIds, specializations,
        comparisonStartDate, comparisonEndDate
      )}
    }

    if (!metric || metric === 'patients') {
      trends = { ...trends, patients: await getPatientTrends(
        startDate, endDate, granularity, hospitalIds,
        comparisonStartDate, comparisonEndDate
      )}
    }

    // Calculate overall insights
    const insights = generateTrendInsights(trends, period, comparison)

    res.status(200).json({
      data: {
        trends,
        insights,
        metadata: {
          period,
          granularity,
          comparison,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          comparisonRange: comparison !== 'none' ? {
            start: comparisonStartDate?.toISOString(),
            end: comparisonEndDate?.toISOString()
          } : null,
          filters: {
            agentIds,
            hospitalIds,
            doctorIds,
            specializations
          }
        }
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

async function getAppointmentTrends(
  startDate: Date, 
  endDate: Date, 
  granularity: string,
  agentIds?: string[],
  hospitalIds?: string[],
  doctorIds?: string[],
  specializations?: string[],
  comparisonStartDate?: Date,
  comparisonEndDate?: Date
) {
  // Current period data
  const currentData = await getAppointmentDataForPeriod(
    startDate, endDate, granularity, agentIds, hospitalIds, doctorIds, specializations
  )

  // Comparison period data
  let comparisonData = null
  if (comparisonStartDate && comparisonEndDate) {
    comparisonData = await getAppointmentDataForPeriod(
      comparisonStartDate, comparisonEndDate, granularity, agentIds, hospitalIds, doctorIds, specializations
    )
  }

  return {
    current: currentData,
    comparison: comparisonData,
    summary: {
      total: currentData.reduce((sum, item) => sum + item.count, 0),
      growth: comparisonData ? calculateGrowthRate(
        currentData.reduce((sum, item) => sum + item.count, 0),
        comparisonData.reduce((sum, item) => sum + item.count, 0)
      ) : null,
      trend: analyzeTrend(currentData.map(item => item.count)),
      peak: findPeak(currentData),
      average: calculateAverage(currentData.map(item => item.count))
    }
  }
}

async function getRevenueTrends(
  startDate: Date, 
  endDate: Date, 
  granularity: string,
  agentIds?: string[],
  hospitalIds?: string[],
  doctorIds?: string[],
  specializations?: string[],
  comparisonStartDate?: Date,
  comparisonEndDate?: Date
) {
  // Mock revenue data - in production, this would query actual payment data
  const mockData = generateMockTrendData(startDate, endDate, granularity, 'revenue')
  const mockComparison = comparisonStartDate && comparisonEndDate ? 
    generateMockTrendData(comparisonStartDate, comparisonEndDate, granularity, 'revenue') : null

  return {
    current: mockData,
    comparison: mockComparison,
    summary: {
      total: mockData.reduce((sum, item) => sum + (item.value || 0), 0),
      growth: mockComparison ? calculateGrowthRate(
        mockData.reduce((sum, item) => sum + (item.value || 0), 0),
        mockComparison.reduce((sum, item) => sum + (item.value || 0), 0)
      ) : null,
      trend: analyzeTrend(mockData.map(item => item.value || 0)),
      peak: findPeak(mockData, 'value'),
      average: calculateAverage(mockData.map(item => item.value || 0))
    }
  }
}

async function getAgentTrends(
  startDate: Date, 
  endDate: Date, 
  granularity: string,
  agentIds?: string[],
  comparisonStartDate?: Date,
  comparisonEndDate?: Date
) {
  // Mock agent performance data
  const mockData = generateMockTrendData(startDate, endDate, granularity, 'agents')
  const mockComparison = comparisonStartDate && comparisonEndDate ? 
    generateMockTrendData(comparisonStartDate, comparisonEndDate, granularity, 'agents') : null

  return {
    current: mockData,
    comparison: mockComparison,
    summary: {
      activeAgents: mockData.reduce((sum, item) => sum + item.count, 0) / mockData.length,
      growth: mockComparison ? calculateGrowthRate(
        mockData.reduce((sum, item) => sum + item.count, 0),
        mockComparison.reduce((sum, item) => sum + item.count, 0)
      ) : null,
      trend: analyzeTrend(mockData.map(item => item.count)),
      productivity: calculateAverage(mockData.map(item => item.count))
    }
  }
}

async function getHospitalTrends(
  startDate: Date, 
  endDate: Date, 
  granularity: string,
  hospitalIds?: string[],
  comparisonStartDate?: Date,
  comparisonEndDate?: Date
) {
  const mockData = generateMockTrendData(startDate, endDate, granularity, 'hospitals')
  const mockComparison = comparisonStartDate && comparisonEndDate ? 
    generateMockTrendData(comparisonStartDate, comparisonEndDate, granularity, 'hospitals') : null

  return {
    current: mockData,
    comparison: mockComparison,
    summary: {
      averageBookings: calculateAverage(mockData.map(item => item.count)),
      growth: mockComparison ? calculateGrowthRate(
        mockData.reduce((sum, item) => sum + item.count, 0),
        mockComparison.reduce((sum, item) => sum + item.count, 0)
      ) : null,
      trend: analyzeTrend(mockData.map(item => item.count)),
      topPerformer: findPeak(mockData)
    }
  }
}

async function getDoctorTrends(
  startDate: Date, 
  endDate: Date, 
  granularity: string,
  doctorIds?: string[],
  specializations?: string[],
  comparisonStartDate?: Date,
  comparisonEndDate?: Date
) {
  const mockData = generateMockTrendData(startDate, endDate, granularity, 'doctors')
  const mockComparison = comparisonStartDate && comparisonEndDate ? 
    generateMockTrendData(comparisonStartDate, comparisonEndDate, granularity, 'doctors') : null

  return {
    current: mockData,
    comparison: mockComparison,
    summary: {
      averageBookings: calculateAverage(mockData.map(item => item.count)),
      growth: mockComparison ? calculateGrowthRate(
        mockData.reduce((sum, item) => sum + item.count, 0),
        mockComparison.reduce((sum, item) => sum + item.count, 0)
      ) : null,
      trend: analyzeTrend(mockData.map(item => item.count)),
      utilization: Math.random() * 100 // Mock utilization rate
    }
  }
}

async function getPatientTrends(
  startDate: Date, 
  endDate: Date, 
  granularity: string,
  hospitalIds?: string[],
  comparisonStartDate?: Date,
  comparisonEndDate?: Date
) {
  const mockData = generateMockTrendData(startDate, endDate, granularity, 'patients')
  const mockComparison = comparisonStartDate && comparisonEndDate ? 
    generateMockTrendData(comparisonStartDate, comparisonEndDate, granularity, 'patients') : null

  return {
    current: mockData,
    comparison: mockComparison,
    summary: {
      newPatients: mockData.reduce((sum, item) => sum + Math.floor(item.count * 0.3), 0),
      returningPatients: mockData.reduce((sum, item) => sum + Math.floor(item.count * 0.7), 0),
      growth: mockComparison ? calculateGrowthRate(
        mockData.reduce((sum, item) => sum + item.count, 0),
        mockComparison.reduce((sum, item) => sum + item.count, 0)
      ) : null,
      trend: analyzeTrend(mockData.map(item => item.count))
    }
  }
}

async function getAppointmentDataForPeriod(
  startDate: Date, 
  endDate: Date, 
  granularity: string,
  agentIds?: string[],
  hospitalIds?: string[],
  doctorIds?: string[],
  specializations?: string[]
) {
  // Mock data for now - in production, this would query the actual database
  return generateMockTrendData(startDate, endDate, granularity, 'appointments')
}

function calculateDateRanges(
  period: string, 
  comparison: string, 
  dateFrom?: string, 
  dateTo?: string
) {
  let endDate = dateTo ? new Date(dateTo) : new Date()
  let startDate: Date

  // Calculate start date based on period
  if (dateFrom) {
    startDate = new Date(dateFrom)
  } else {
    startDate = new Date(endDate)
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '6m':
        startDate.setMonth(startDate.getMonth() - 6)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }
  }

  let comparisonStartDate: Date | undefined
  let comparisonEndDate: Date | undefined

  if (comparison === 'previous_period') {
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    comparisonEndDate = new Date(startDate)
    comparisonStartDate = new Date(startDate)
    comparisonStartDate.setDate(comparisonStartDate.getDate() - daysDiff)
  } else if (comparison === 'previous_year') {
    comparisonStartDate = new Date(startDate)
    comparisonStartDate.setFullYear(comparisonStartDate.getFullYear() - 1)
    comparisonEndDate = new Date(endDate)
    comparisonEndDate.setFullYear(comparisonEndDate.getFullYear() - 1)
  }

  return { startDate, endDate, comparisonStartDate, comparisonEndDate }
}

function generateMockTrendData(startDate: Date, endDate: Date, granularity: string, type: string) {
  const data = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const baseValue = type === 'revenue' ? Math.random() * 10000 + 5000 :
                     type === 'appointments' ? Math.random() * 50 + 10 :
                     Math.random() * 20 + 5

    data.push({
      date: new Date(current).toISOString(),
      count: type === 'revenue' ? 0 : Math.floor(baseValue),
      value: type === 'revenue' ? baseValue : undefined
    })

    // Increment date based on granularity
    switch (granularity) {
      case 'day':
        current.setDate(current.getDate() + 1)
        break
      case 'week':
        current.setDate(current.getDate() + 7)
        break
      case 'month':
        current.setMonth(current.getMonth() + 1)
        break
    }
  }

  return data
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100 * 100) / 100
}

function analyzeTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable'
  
  const first = values[0]
  const last = values[values.length - 1]
  const change = ((last - first) / first) * 100
  
  if (change > 5) return 'up'
  if (change < -5) return 'down'
  return 'stable'
}

function findPeak(data: any[], valueKey: string = 'count') {
  if (data.length === 0) return null
  
  return data.reduce((peak, current) => {
    return current[valueKey] > peak[valueKey] ? current : peak
  })
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100
}

function generateTrendInsights(trends: any, period: string, comparison: string) {
  const insights = []

  // Analyze appointment trends
  if (trends.appointments) {
    const { summary } = trends.appointments
    if (summary.growth !== null) {
      if (summary.growth > 10) {
        insights.push({
          type: 'positive',
          metric: 'appointments',
          message: `Appointment bookings increased by ${summary.growth}% compared to the previous period`,
          impact: 'high'
        })
      } else if (summary.growth < -10) {
        insights.push({
          type: 'negative',
          metric: 'appointments',
          message: `Appointment bookings decreased by ${Math.abs(summary.growth)}% compared to the previous period`,
          impact: 'high'
        })
      }
    }

    if (summary.trend === 'up') {
      insights.push({
        type: 'positive',
        metric: 'appointments',
        message: 'Appointment bookings show an upward trend',
        impact: 'medium'
      })
    }
  }

  // Analyze revenue trends
  if (trends.revenue) {
    const { summary } = trends.revenue
    if (summary.growth !== null) {
      if (summary.growth > 15) {
        insights.push({
          type: 'positive',
          metric: 'revenue',
          message: `Revenue increased by ${summary.growth}% compared to the previous period`,
          impact: 'high'
        })
      }
    }
  }

  return insights
}
