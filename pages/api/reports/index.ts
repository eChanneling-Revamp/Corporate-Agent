import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const reportCreateSchema = z.object({
  title: z.string().min(3).max(200),
  type: z.enum(['APPOINTMENT_SUMMARY', 'REVENUE_ANALYSIS', 'AGENT_PERFORMANCE', 'CUSTOMER_SATISFACTION', 'OPERATIONAL_METRICS']),
  description: z.string().optional(),
  parameters: z.object({
    dateFrom: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format"
    }),
    dateTo: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format"
    }),
    agentIds: z.array(z.string().cuid()).optional(),
    hospitalIds: z.array(z.string().cuid()).optional(),
    doctorIds: z.array(z.string().cuid()).optional(),
    specializations: z.array(z.string()).optional(),
    appointmentStatuses: z.array(z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED'])).optional(),
    paymentStatuses: z.array(z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'])).optional(),
    groupBy: z.enum(['day', 'week', 'month', 'agent', 'hospital', 'doctor', 'specialization']).optional().default('day'),
    includeCharts: z.boolean().optional().default(true),
    includeDetails: z.boolean().optional().default(false),
    format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).optional().default('PDF')
  }),
  generatedById: z.string().cuid(),
  autoGenerate: z.boolean().optional().default(false),
  shareWithUserIds: z.array(z.string().cuid()).optional()
})

const reportFiltersSchema = z.object({
  type: z.enum(['APPOINTMENT_SUMMARY', 'REVENUE_ANALYSIS', 'AGENT_PERFORMANCE', 'CUSTOMER_SATISFACTION', 'OPERATIONAL_METRICS']).optional(),
  status: z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'FAILED']).optional(),
  generatedById: z.string().cuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().transform(val => parseInt(val)).optional().default(50),
  offset: z.string().transform(val => parseInt(val)).optional().default(0),
  sortBy: z.enum(['createdAt', 'completedAt', 'title', 'type']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
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
    console.error('Reports API error:', error)
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
    const validatedFilters = reportFiltersSchema.parse(req.query)
    
    const {
      type,
      status,
      generatedById,
      dateFrom,
      dateTo,
      search,
      limit,
      offset,
      sortBy,
      sortOrder
    } = validatedFilters

    // Build where clause
    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (status) {
      where.status = status
    }
    
    if (generatedById) {
      where.generatedById = generatedById
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        generatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      take: limit,
      skip: offset
    })

    // Transform reports with additional computed fields
    const transformedReports = await Promise.all(reports.map(async (report) => ({
      ...report,
      parameters: report.parameters as any,
      generationTime: report.completedAt && report.createdAt ? 
        Math.round((new Date(report.completedAt).getTime() - new Date(report.createdAt).getTime()) / 1000) : null,
      isScheduled: report.scheduledAt ? true : false,
      canDownload: report.status === 'COMPLETED' && report.filePath,
      fileSize: report.filePath ? await getFileSize(report.filePath) : null,
      reportAge: Math.ceil((new Date().getTime() - new Date(report.createdAt).getTime()) / (1000 * 3600 * 24))
    })))

    // Get total count for pagination
    const totalCount = await prisma.report.count({ where })

    // Calculate report statistics
    const stats = await calculateReportStats(where)

    res.status(200).json({
      data: transformedReports,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats,
      filters: validatedFilters
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

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = reportCreateSchema.parse(req.body)
    
    const {
      title,
      type,
      description,
      parameters,
      generatedById,
      autoGenerate,
      shareWithUserIds
    } = validatedData

    // Verify generator exists
    const generator = await prisma.user.findUnique({
      where: { id: generatedById },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    if (!generator) {
      return res.status(404).json({ error: 'Report generator not found' })
    }

    if (!generator.isActive) {
      return res.status(409).json({ error: 'Cannot generate report for inactive user' })
    }

    // Validate date range
    const dateFrom = new Date(parameters.dateFrom)
    const dateTo = new Date(parameters.dateTo)
    
    if (dateFrom > dateTo) {
      return res.status(400).json({ error: 'Invalid date range: from date must be before to date' })
    }

    // Check if date range is too large (business rule)
    const daysDifference = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 3600 * 24))
    if (daysDifference > 365) {
      return res.status(400).json({ 
        error: 'Date range too large. Maximum allowed range is 365 days.',
        requestedDays: daysDifference
      })
    }

    // Validate referenced entities exist
    await validateReportParameters(parameters)

    // Create the report
    const report = await prisma.$transaction(async (tx) => {
      const newReport = await tx.report.create({
        data: {
          title,
          type,
          description,
          parameters: parameters as any,
          generatedById,
          status: autoGenerate ? 'PENDING' : 'PENDING',
          // You might want to add fields like shareWithUserIds to your schema
        },
        include: {
          generatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      })

      // Log report creation
      await tx.activityLog.create({
        data: {
          userId: generatedById,
          action: 'REPORT_CREATED',
          entityType: 'Report',
          entityId: newReport.id,
          details: {
            reportTitle: title,
            reportType: type,
            parameters: {
              dateRange: `${parameters.dateFrom} to ${parameters.dateTo}`,
              groupBy: parameters.groupBy,
              format: parameters.format
            },
            autoGenerate
          }
        }
      })

      return newReport
    })

    // If auto-generate is enabled, start report generation
    if (autoGenerate) {
      // In a real application, this would be handled by a background job queue
      setImmediate(() => generateReport(report.id))
    }

    res.status(201).json({
      message: 'Report created successfully',
      data: {
        ...report,
        parameters: report.parameters as any,
        generationTime: null,
        isScheduled: false,
        canDownload: false,
        fileSize: null,
        reportAge: 0,
        estimatedGenerationTime: estimateGenerationTime(type, parameters)
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

async function validateReportParameters(parameters: any) {
  const errors = []

  // Validate agent IDs
  if (parameters.agentIds && parameters.agentIds.length > 0) {
    const agents = await prisma.user.findMany({
      where: {
        id: { in: parameters.agentIds },
        role: { in: ['AGENT', 'SUPERVISOR', 'ADMIN'] }
      },
      select: { id: true }
    })
    
    if (agents.length !== parameters.agentIds.length) {
      const foundIds = agents.map(a => a.id)
      const missingIds = parameters.agentIds.filter((id: string) => !foundIds.includes(id))
      errors.push(`Invalid agent IDs: ${missingIds.join(', ')}`)
    }
  }

  // Validate hospital IDs
  if (parameters.hospitalIds && parameters.hospitalIds.length > 0) {
    const hospitals = await prisma.hospital.findMany({
      where: {
        id: { in: parameters.hospitalIds },
        isActive: true
      },
      select: { id: true }
    })
    
    if (hospitals.length !== parameters.hospitalIds.length) {
      const foundIds = hospitals.map(h => h.id)
      const missingIds = parameters.hospitalIds.filter((id: string) => !foundIds.includes(id))
      errors.push(`Invalid hospital IDs: ${missingIds.join(', ')}`)
    }
  }

  // Validate doctor IDs
  if (parameters.doctorIds && parameters.doctorIds.length > 0) {
    const doctors = await prisma.doctor.findMany({
      where: {
        id: { in: parameters.doctorIds },
        isActive: true
      },
      select: { id: true }
    })
    
    if (doctors.length !== parameters.doctorIds.length) {
      const foundIds = doctors.map(d => d.id)
      const missingIds = parameters.doctorIds.filter((id: string) => !foundIds.includes(id))
      errors.push(`Invalid doctor IDs: ${missingIds.join(', ')}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join('; ')}`)
  }
}

async function calculateReportStats(where: any) {
  const [
    totalReports,
    pendingReports,
    generatingReports,
    completedReports,
    failedReports,
    reportsThisMonth
  ] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.count({ where: { ...where, status: 'PENDING' } }),
    prisma.report.count({ where: { ...where, status: 'GENERATING' } }),
    prisma.report.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.report.count({ where: { ...where, status: 'FAILED' } }),
    prisma.report.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })
  ])

  const successRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0

  return {
    totalReports,
    pendingReports,
    generatingReports,
    completedReports,
    failedReports,
    reportsThisMonth,
    successRate,
    reportsByStatus: {
      PENDING: pendingReports,
      GENERATING: generatingReports,
      COMPLETED: completedReports,
      FAILED: failedReports
    }
  }
}

function estimateGenerationTime(type: string, parameters: any): number {
  // Estimate generation time in seconds based on report type and parameters
  const baseTime = {
    'APPOINTMENT_SUMMARY': 30,
    'REVENUE_ANALYSIS': 60,
    'AGENT_PERFORMANCE': 45,
    'CUSTOMER_SATISFACTION': 90,
    'OPERATIONAL_METRICS': 120
  }

  let estimate = baseTime[type as keyof typeof baseTime] || 60

  // Add time based on date range
  const dateFrom = new Date(parameters.dateFrom)
  const dateTo = new Date(parameters.dateTo)
  const days = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 3600 * 24))
  
  if (days > 30) estimate += 30
  if (days > 90) estimate += 60
  if (days > 180) estimate += 120

  // Add time for detailed reports
  if (parameters.includeDetails) estimate += 30
  if (parameters.includeCharts) estimate += 15

  return estimate
}

async function getFileSize(filePath: string): Promise<number | null> {
  // In a real application, this would check the actual file size
  // For now, return a mock value
  return Math.floor(Math.random() * 5000000) + 100000 // 100KB to 5MB
}

// Mock report generation function - replace with actual report generation logic
async function generateReport(reportId: string) {
  try {
    console.log(`Starting report generation for report ${reportId}`)
    
    // Update status to generating
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'GENERATING' }
    })

    // Simulate report generation delay
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Mock file path - in real implementation, this would be the actual generated file
    const filePath = `/reports/${reportId}_${Date.now()}.pdf`

    // Update report as completed
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        filePath
      }
    })

    console.log(`Report generation completed for report ${reportId}`)
  } catch (error) {
    console.error(`Report generation failed for report ${reportId}:`, error)
    
    // Update report as failed
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'FAILED',
        completedAt: new Date()
      }
    })
  }
}
