import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '../../../lib/prisma'

// Validation schemas
const performanceFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  timeRange: z.enum(['TODAY', 'YESTERDAY', 'THIS_WEEK', 'LAST_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'LAST_QUARTER', 'THIS_YEAR', 'CUSTOM']).optional().default('THIS_MONTH'),
  agentId: z.string().cuid().optional(),
  agentIds: z.array(z.string().cuid()).optional(),
  hospitalId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
  performanceType: z.enum(['INDIVIDUAL', 'TEAM', 'HOSPITAL', 'DEPARTMENT', 'SYSTEM']).optional().default('INDIVIDUAL'),
  metrics: z.array(z.enum([
    'appointments_booked',
    'appointments_completed',
    'revenue_generated',
    'call_volume',
    'call_duration',
    'response_time',
    'customer_satisfaction',
    'first_call_resolution',
    'conversion_rate',
    'productivity_score',
    'utilization_rate',
    'quality_score'
  ])).optional(),
  includeGoals: z.string().transform(val => val === 'true').optional().default(true),
  includeComparisons: z.string().transform(val => val === 'true').optional().default(true),
  includeRankings: z.string().transform(val => val === 'true').optional().default(false),
  groupBy: z.enum(['hour', 'day', 'week', 'month', 'agent', 'hospital', 'department']).optional().default('day'),
  sortBy: z.enum(['performance_score', 'appointments', 'revenue', 'satisfaction', 'name']).optional().default('performance_score'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.string().transform(val => parseInt(val)).optional().default(50),
  offset: z.string().transform(val => parseInt(val)).optional().default(0)
})

const goalUpdateSchema = z.object({
  agentId: z.string().cuid(),
  goals: z.object({
    appointmentsTarget: z.number().min(0).optional(),
    revenueTarget: z.number().min(0).optional(),
    satisfactionTarget: z.number().min(1).max(5).optional(),
    utilizationTarget: z.number().min(0).max(100).optional(),
    qualityTarget: z.number().min(0).max(100).optional(),
    periodType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional().default('MONTHLY'),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format"
    }).optional(),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format"
    }).optional()
  })
})

const performanceAlertSchema = z.object({
  metric: z.enum(['appointments', 'revenue', 'satisfaction', 'utilization', 'quality']),
  threshold: z.number(),
  operator: z.enum(['above', 'below', 'equals']),
  agentIds: z.array(z.string().cuid()).optional(),
  frequency: z.enum(['REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY']).optional().default('DAILY'),
  isActive: z.boolean().optional().default(true)
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
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Performance analytics API error:', error)
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
    const { action, agentId, compareWith } = req.query
    
    if (action === 'leaderboard') {
      return await getPerformanceLeaderboard(req, res)
    }
    
    if (action === 'goals' && agentId) {
      const { timeRange, dateFrom, dateTo } = req.query
      const dateRange = calculateDateRange(timeRange as string, dateFrom as string, dateTo as string)
      const goalsData = await getAgentGoalsData(agentId as string, dateRange)
      return res.json({ success: true, data: goalsData })
    }
    
    if (action === 'compare' && agentId && compareWith) {
      return res.json({ success: true, data: { message: 'Compare feature not implemented' } })
    }
    
    if (action === 'trends') {
      return res.json({ success: true, data: { message: 'Trends feature not implemented' } })
    }
    
    if (action === 'benchmarks') {
      return res.json({ success: true, data: { message: 'Benchmarks feature not implemented' } })
    }
    
    if (agentId) {
      return await getIndividualPerformance(req, res, agentId as string)
    }
    
    return await getPerformanceOverview(req, res)
  } catch (error) {
    throw error
  }
}

async function getPerformanceOverview(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedFilters = performanceFiltersSchema.parse(req.query)
    const currentUser = req.headers['x-user-id'] as string
    
    const {
      dateFrom,
      dateTo,
      timeRange,
      hospitalId,
      departmentId,
      performanceType,
      metrics,
      includeGoals,
      includeComparisons,
      includeRankings,
      groupBy,
      sortBy,
      sortOrder,
      limit,
      offset
    } = validatedFilters

    const dateRange = calculateDateRange(timeRange, dateFrom, dateTo)
    
    // Get performance data based on type
    let performanceData: any = {}
    
    switch (performanceType) {
      case 'INDIVIDUAL':
        performanceData = await getIndividualPerformanceData(dateRange, validatedFilters)
        break
      case 'TEAM':
        performanceData = await getTeamPerformanceData(dateRange, validatedFilters)
        break
      case 'HOSPITAL':
        performanceData = await getHospitalPerformanceData(dateRange, validatedFilters)
        break
      case 'DEPARTMENT':
        performanceData = await getDepartmentPerformanceData(dateRange, validatedFilters)
        break
      case 'SYSTEM':
        performanceData = await getSystemPerformanceData(dateRange, validatedFilters)
        break
    }

    // Get goals and comparisons if requested
    const goals = includeGoals ? await getPerformanceGoals(performanceType, validatedFilters) : null
    const comparisons = includeComparisons ? await getPerformanceComparisons(dateRange, validatedFilters) : null
    const rankings = includeRankings ? await getPerformanceRankings(dateRange, validatedFilters) : null

    const response = {
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange,
        performanceType,
        filters: validatedFilters
      },
      summary: performanceData.summary,
      agents: performanceData.agents || [],
      teams: performanceData.teams || [],
      hospitals: performanceData.hospitals || [],
      departments: performanceData.departments || [],
      goals,
      comparisons,
      rankings,
      insights: await generatePerformanceInsights(performanceData, dateRange),
      pagination: {
        total: performanceData.agents?.length || performanceData.teams?.length || 0,
        limit,
        offset,
        hasMore: false
      }
    }

    // Log performance report access
    await prisma.activityLog.create({
      data: {
        userId: currentUser || 'anonymous',
        action: 'PERFORMANCE_REPORT_ACCESSED',
        entityType: 'PerformanceReport',
        entityId: `performance_${performanceType.toLowerCase()}`,
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

async function getIndividualPerformance(req: NextApiRequest, res: NextApiResponse, agentId: string) {
  try {
    const validatedFilters = performanceFiltersSchema.parse(req.query)
    const dateRange = calculateDateRange(validatedFilters.timeRange, validatedFilters.dateFrom, validatedFilters.dateTo)
    
    // Get agent details
    const agent = await getAgentDetails(agentId)
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    // Calculate individual performance metrics
    const performanceMetrics = await calculateIndividualMetrics(agentId, dateRange)
    const goals = await getAgentGoalsData(agentId, dateRange)
    const trends = await getAgentTrends(agentId, dateRange)
    const achievements = await getAgentAchievements(agentId, dateRange)
    const feedback = await getAgentFeedback(agentId, dateRange)

    const response = {
      agent,
      dateRange,
      performance: performanceMetrics,
      goals,
      trends,
      achievements,
      feedback,
      recommendations: await generateAgentRecommendations(agentId, performanceMetrics, goals)
    }

    res.status(200).json({ data: response })
  } catch (error) {
    throw error
  }
}

async function getPerformanceLeaderboard(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedFilters = performanceFiltersSchema.parse(req.query)
    const dateRange = calculateDateRange(validatedFilters.timeRange, validatedFilters.dateFrom, validatedFilters.dateTo)
    
    // Get leaderboard data
    const leaderboard = await calculateLeaderboard(dateRange, validatedFilters)
    
    res.status(200).json({
      data: {
        dateRange,
        leaderboard,
        lastUpdated: new Date().toISOString()
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

    if (action === 'set_alert') {
      return await setPerformanceAlert(req, res)
    }
    
    if (action === 'export') {
      return await exportPerformanceData(req, res)
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) {
    throw error
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { action } = req.query
    const currentUser = req.headers['x-user-id'] as string

    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (action === 'update_goals') {
      return await updateAgentGoals(req, res)
    }

    return res.status(400).json({ error: 'Invalid action' })
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

async function getIndividualPerformanceData(dateRange: any, filters: any) {
  // Mock individual performance data
  return {
    summary: {
      totalAgents: 15,
      activeAgents: 13,
      avgPerformanceScore: 78.5,
      topPerformerScore: 92.3,
      improvementRate: 12.5
    },
    agents: [
      {
        id: 'agent_1',
        name: 'John Smith',
        avatar: '/avatars/john.jpg',
        role: 'Senior Agent',
        department: 'Booking Services',
        performanceScore: 92.3,
        rank: 1,
        metrics: {
          appointmentsBooked: 145,
          appointmentsCompleted: 138,
          revenueGenerated: 13800,
          customerSatisfaction: 4.8,
          responseTime: 12,
          conversionRate: 89.5,
          utilizationRate: 95.2
        },
        goals: {
          appointmentsTarget: 140,
          achievementRate: 103.6,
          status: 'exceeded'
        },
        trends: {
          thisWeek: 'up',
          lastMonth: 'up',
          quarterOverQuarter: 'up'
        }
      },
      {
        id: 'agent_2',
        name: 'Sarah Johnson',
        avatar: '/avatars/sarah.jpg',
        role: 'Agent',
        department: 'Customer Support',
        performanceScore: 85.7,
        rank: 2,
        metrics: {
          appointmentsBooked: 120,
          appointmentsCompleted: 115,
          revenueGenerated: 11500,
          customerSatisfaction: 4.6,
          responseTime: 15,
          conversionRate: 82.3,
          utilizationRate: 87.5
        },
        goals: {
          appointmentsTarget: 125,
          achievementRate: 96.0,
          status: 'on_track'
        },
        trends: {
          thisWeek: 'up',
          lastMonth: 'steady',
          quarterOverQuarter: 'up'
        }
      }
    ]
  }
}

async function getTeamPerformanceData(dateRange: any, filters: any) {
  return {
    summary: {
      totalTeams: 5,
      avgTeamScore: 82.1,
      topTeamScore: 89.5,
      teamImprovement: 8.3
    },
    teams: [
      {
        id: 'team_1',
        name: 'Booking Services',
        lead: 'Mike Wilson',
        members: 8,
        performanceScore: 89.5,
        rank: 1,
        metrics: {
          totalAppointments: 890,
          totalRevenue: 89000,
          avgSatisfaction: 4.7,
          teamUtilization: 91.2
        }
      }
    ]
  }
}

async function getHospitalPerformanceData(dateRange: any, filters: any) {
  return {
    summary: {
      totalHospitals: 3,
      avgHospitalScore: 84.2,
      topHospitalScore: 88.1,
      hospitalImprovement: 5.7
    },
    hospitals: [
      {
        id: 'hospital_1',
        name: 'Central Hospital',
        agents: 12,
        performanceScore: 88.1,
        rank: 1,
        metrics: {
          totalAppointments: 1250,
          totalRevenue: 125000,
          avgSatisfaction: 4.6,
          utilizationRate: 89.3
        }
      }
    ]
  }
}

async function getDepartmentPerformanceData(dateRange: any, filters: any) {
  return {
    summary: {
      totalDepartments: 4,
      avgDepartmentScore: 81.5,
      topDepartmentScore: 86.8
    },
    departments: [
      {
        id: 'dept_1',
        name: 'Cardiology',
        agents: 6,
        performanceScore: 86.8,
        rank: 1
      }
    ]
  }
}

async function getSystemPerformanceData(dateRange: any, filters: any) {
  return {
    summary: {
      overallScore: 83.2,
      systemHealth: 'Good',
      improvementRate: 7.8,
      benchmarkComparison: 'Above Average'
    }
  }
}

async function getAgentDetails(agentId: string) {
  // Mock agent data - in real implementation, fetch from users table
  return {
    id: agentId,
    name: 'John Smith',
    email: 'john.smith@hospital.com',
    avatar: '/avatars/john.jpg',
    role: 'Senior Agent',
    department: 'Booking Services',
    joinDate: '2023-01-15',
    experience: '2 years',
    certifications: ['Customer Service Excellence', 'Medical Terminology'],
    languages: ['English', 'Spanish'],
    shift: 'Day Shift (9AM-5PM)',
    status: 'Active'
  }
}

async function calculateIndividualMetrics(agentId: string, dateRange: any) {
  // Mock individual metrics calculation
  return {
    currentPeriod: {
      appointmentsBooked: 145,
      appointmentsCompleted: 138,
      appointmentsCancelled: 7,
      revenueGenerated: 13800,
      callsHandled: 280,
      avgCallDuration: 185,
      customerSatisfaction: 4.8,
      responseTime: 12,
      firstCallResolution: 89.5,
      conversionRate: 82.3,
      utilizationRate: 95.2,
      qualityScore: 88.7,
      productivityScore: 91.2,
      overallScore: 92.3
    },
    previousPeriod: {
      appointmentsBooked: 132,
      appointmentsCompleted: 125,
      revenueGenerated: 12500,
      customerSatisfaction: 4.6,
      overallScore: 87.1
    },
    changes: {
      appointmentsBooked: 9.8,
      appointmentsCompleted: 10.4,
      revenueGenerated: 10.4,
      customerSatisfaction: 4.3,
      overallScore: 6.0
    }
  }
}

async function getAgentGoalsData(agentId: string, dateRange: any) {
  return {
    current: {
      appointmentsTarget: 140,
      revenueTarget: 14000,
      satisfactionTarget: 4.5,
      utilizationTarget: 90,
      qualityTarget: 85
    },
    achievements: {
      appointmentsAchieved: 145,
      revenueAchieved: 13800,
      satisfactionAchieved: 4.8,
      utilizationAchieved: 95.2,
      qualityAchieved: 88.7
    },
    progress: {
      appointments: 103.6,
      revenue: 98.6,
      satisfaction: 106.7,
      utilization: 105.8,
      quality: 104.4
    },
    status: {
      appointments: 'exceeded',
      revenue: 'on_track',
      satisfaction: 'exceeded',
      utilization: 'exceeded',
      quality: 'exceeded'
    }
  }
}

async function getAgentTrends(agentId: string, dateRange: any) {
  return {
    daily: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointments: Math.floor(Math.random() * 10) + 3,
      revenue: Math.floor(Math.random() * 1000) + 300,
      satisfaction: (Math.random() * 1 + 4).toFixed(1)
    })),
    weekly: Array.from({ length: 12 }, (_, i) => ({
      week: `Week ${i + 1}`,
      appointments: Math.floor(Math.random() * 50) + 20,
      revenue: Math.floor(Math.random() * 5000) + 2000,
      satisfaction: (Math.random() * 1 + 4).toFixed(1)
    })),
    monthly: Array.from({ length: 6 }, (_, i) => ({
      month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'long' }),
      appointments: Math.floor(Math.random() * 200) + 100,
      revenue: Math.floor(Math.random() * 20000) + 10000,
      satisfaction: (Math.random() * 1 + 4).toFixed(1)
    }))
  }
}

async function getAgentAchievements(agentId: string, dateRange: any) {
  return [
    {
      id: 'achievement_1',
      title: 'Top Performer',
      description: 'Highest booking rate for 3 consecutive months',
      earnedDate: '2024-01-15',
      category: 'Performance',
      badge: 'gold'
    },
    {
      id: 'achievement_2',
      title: 'Customer Favorite',
      description: 'Maintained 4.8+ satisfaction rating',
      earnedDate: '2024-01-10',
      category: 'Service',
      badge: 'silver'
    }
  ]
}

async function getAgentFeedback(agentId: string, dateRange: any) {
  return {
    recent: [
      {
        id: 'feedback_1',
        from: 'Manager',
        date: '2024-01-20',
        type: 'positive',
        message: 'Excellent customer service skills and exceeded monthly targets',
        rating: 5
      },
      {
        id: 'feedback_2',
        from: 'Customer',
        date: '2024-01-18',
        type: 'positive',
        message: 'Very helpful and professional. Made the booking process easy.',
        rating: 5
      }
    ],
    summary: {
      totalFeedback: 28,
      averageRating: 4.7,
      positivePercentage: 92.3,
      improvementAreas: ['Response time during peak hours']
    }
  }
}

async function generateAgentRecommendations(agentId: string, metrics: any, goals: any) {
  return [
    {
      type: 'improvement',
      priority: 'medium',
      title: 'Optimize Peak Hour Performance',
      description: 'Focus on reducing response time during 10-11 AM peak hours',
      actionItems: [
        'Review call queue management techniques',
        'Practice quick assessment scripts',
        'Use templates for common inquiries'
      ]
    },
    {
      type: 'opportunity',
      priority: 'low',
      title: 'Revenue Growth Potential',
      description: 'Only 1.4% away from revenue target - consider upselling opportunities',
      actionItems: [
        'Identify premium service opportunities',
        'Suggest add-on services to patients',
        'Focus on higher-value appointments'
      ]
    }
  ]
}

async function calculateLeaderboard(dateRange: any, filters: any) {
  return {
    topPerformers: [
      {
        rank: 1,
        agentId: 'agent_1',
        name: 'John Smith',
        score: 92.3,
        change: 5.2,
        avatar: '/avatars/john.jpg'
      },
      {
        rank: 2,
        agentId: 'agent_2',
        name: 'Sarah Johnson',
        score: 85.7,
        change: 2.1,
        avatar: '/avatars/sarah.jpg'
      },
      {
        rank: 3,
        agentId: 'agent_3',
        name: 'Mike Davis',
        score: 84.1,
        change: -1.3,
        avatar: '/avatars/mike.jpg'
      }
    ],
    categories: {
      appointments: [
        { agentId: 'agent_1', name: 'John Smith', value: 145 },
        { agentId: 'agent_4', name: 'Lisa Brown', value: 142 },
        { agentId: 'agent_2', name: 'Sarah Johnson', value: 120 }
      ],
      revenue: [
        { agentId: 'agent_1', name: 'John Smith', value: 13800 },
        { agentId: 'agent_4', name: 'Lisa Brown', value: 13200 },
        { agentId: 'agent_2', name: 'Sarah Johnson', value: 11500 }
      ],
      satisfaction: [
        { agentId: 'agent_1', name: 'John Smith', value: 4.8 },
        { agentId: 'agent_5', name: 'Tom Wilson', value: 4.7 },
        { agentId: 'agent_2', name: 'Sarah Johnson', value: 4.6 }
      ]
    }
  }
}

async function getPerformanceGoals(performanceType: string, filters: any) {
  return {
    system: {
      appointmentTarget: 1500,
      revenueTarget: 150000,
      satisfactionTarget: 4.5,
      utilizationTarget: 85
    },
    achievements: {
      appointmentAchieved: 1420,
      revenueAchieved: 142000,
      satisfactionAchieved: 4.6,
      utilizationAchieved: 88.2
    }
  }
}

async function getPerformanceComparisons(dateRange: any, filters: any) {
  return {
    previousPeriod: {
      appointments: { current: 1420, previous: 1280, change: 10.9 },
      revenue: { current: 142000, previous: 128000, change: 10.9 },
      satisfaction: { current: 4.6, previous: 4.4, change: 4.5 }
    },
    industry: {
      appointments: { current: 1420, benchmark: 1300, position: 'above' },
      satisfaction: { current: 4.6, benchmark: 4.3, position: 'above' }
    }
  }
}

async function getPerformanceRankings(dateRange: any, filters: any) {
  return {
    agents: [
      { rank: 1, name: 'John Smith', score: 92.3 },
      { rank: 2, name: 'Sarah Johnson', score: 85.7 },
      { rank: 3, name: 'Mike Davis', score: 84.1 }
    ],
    departments: [
      { rank: 1, name: 'Booking Services', score: 89.5 },
      { rank: 2, name: 'Customer Support', score: 83.2 }
    ]
  }
}

async function generatePerformanceInsights(performanceData: any, dateRange: any) {
  return [
    {
      type: 'trend',
      severity: 'positive',
      title: 'Overall Performance Trending Up',
      description: 'Team performance has improved by 12.5% compared to last month',
      recommendation: 'Continue current training programs and recognize top performers'
    },
    {
      type: 'alert',
      severity: 'warning',
      title: 'Agent Utilization Below Target',
      description: '3 agents are below 85% utilization target',
      recommendation: 'Review workload distribution and provide additional training'
    },
    {
      type: 'opportunity',
      severity: 'info',
      title: 'Revenue Growth Potential',
      description: 'Top 5 agents could increase team revenue by 15% if performance patterns are replicated',
      recommendation: 'Implement peer mentoring program for knowledge sharing'
    }
  ]
}

async function setPerformanceAlert(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = performanceAlertSchema.parse(req.body)
    const currentUser = req.headers['x-user-id'] as string

    const alertId = `alert_${Date.now()}`
    
    await prisma.activityLog.create({
      data: {
        userId: currentUser,
        action: 'PERFORMANCE_ALERT_CREATED',
        entityType: 'PerformanceAlert',
        entityId: alertId,
        details: {
          ...validatedData,
          createdAt: new Date().toISOString()
        }
      }
    })

    res.status(201).json({
      message: 'Performance alert created successfully',
      data: {
        alertId,
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

async function updateAgentGoals(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = goalUpdateSchema.parse(req.body)
    const currentUser = req.headers['x-user-id'] as string

    await prisma.activityLog.create({
      data: {
        userId: currentUser,
        action: 'AGENT_GOALS_UPDATED',
        entityType: 'AgentGoals',
        entityId: validatedData.agentId,
        details: {
          goals: validatedData.goals,
          updatedAt: new Date().toISOString()
        }
      }
    })

    res.status(200).json({
      message: 'Agent goals updated successfully',
      data: {
        agentId: validatedData.agentId,
        goals: validatedData.goals,
        updatedAt: new Date().toISOString()
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

async function exportPerformanceData(req: NextApiRequest, res: NextApiResponse) {
  const { format = 'excel', type = 'summary' } = req.body

  const exportData = {
    format,
    type,
    filename: `performance_report_${type}_${new Date().toISOString().split('T')[0]}.${format}`,
    size: '3.2MB',
    downloadUrl: `/api/analytics/performance/export/${format}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }

  res.status(200).json({
    message: 'Export request processed successfully',
    data: exportData
  })
}
