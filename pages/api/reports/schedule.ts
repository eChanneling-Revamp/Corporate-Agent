import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const scheduleReportSchema = z.object({
  reportId: z.string().cuid().optional(), // If provided, schedule existing report
  title: z.string().min(3).max(200),
  type: z.enum(['APPOINTMENT_SUMMARY', 'REVENUE_ANALYSIS', 'AGENT_PERFORMANCE', 'CUSTOMER_SATISFACTION', 'OPERATIONAL_METRICS']),
  description: z.string().optional(),
  parameters: z.object({
    dateRange: z.enum(['last_7_days', 'last_30_days', 'last_90_days', 'current_month', 'previous_month', 'current_quarter', 'previous_quarter', 'custom']),
    customDateFrom: z.string().optional(),
    customDateTo: z.string().optional(),
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
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    dayOfWeek: z.number().min(0).max(6).optional(), // 0 = Sunday, 6 = Saturday (for weekly)
    dayOfMonth: z.number().min(1).max(31).optional(), // For monthly
    hour: z.number().min(0).max(23).default(9), // Hour to run (24-hour format)
    minute: z.number().min(0).max(59).default(0), // Minute to run
    timezone: z.string().default('UTC'),
    isActive: z.boolean().default(true)
  }),
  recipients: z.array(z.object({
    userId: z.string().cuid(),
    deliveryMethod: z.enum(['EMAIL', 'SYSTEM_NOTIFICATION', 'BOTH']).default('EMAIL')
  })).min(1),
  generatedById: z.string().cuid(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional()
})

const updateScheduleSchema = z.object({
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    hour: z.number().min(0).max(23).optional(),
    minute: z.number().min(0).max(59).optional(),
    timezone: z.string().optional(),
    isActive: z.boolean().optional()
  }).optional(),
  recipients: z.array(z.object({
    userId: z.string().cuid(),
    deliveryMethod: z.enum(['EMAIL', 'SYSTEM_NOTIFICATION', 'BOTH']).default('EMAIL')
  })).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional()
})

const scheduleFiltersSchema = z.object({
  generatedById: z.string().cuid().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  type: z.enum(['APPOINTMENT_SUMMARY', 'REVENUE_ANALYSIS', 'AGENT_PERFORMANCE', 'CUSTOMER_SATISFACTION', 'OPERATIONAL_METRICS']).optional(),
  search: z.string().optional(),
  limit: z.string().transform(val => parseInt(val)).optional().default(50),
  offset: z.string().transform(val => parseInt(val)).optional().default(0)
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
    console.error('Report schedule API error:', error)
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
    const validatedFilters = scheduleFiltersSchema.parse(req.query)
    
    const {
      generatedById,
      frequency,
      isActive,
      type,
      search,
      limit,
      offset
    } = validatedFilters

    // For this implementation, we'll store schedule info in the report's parameters
    // In a production system, you'd want a separate scheduled_reports table
    const where: any = {
      scheduledAt: { not: null } // Only get scheduled reports
    }
    
    if (generatedById) {
      where.generatedById = generatedById
    }
    
    if (type) {
      where.type = type
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

    const scheduledReports = await prisma.report.findMany({
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
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Transform scheduled reports with schedule information
    const transformedReports = scheduledReports.map(report => {
      const parameters = report.parameters as any
      const scheduleInfo = parameters?.schedule || {}
      
      return {
        id: report.id,
        title: report.title,
        type: report.type,
        description: report.description,
        status: report.status,
        generatedBy: report.generatedBy,
        createdAt: report.createdAt,
        scheduledAt: report.scheduledAt,
        lastGeneratedAt: report.completedAt,
        schedule: {
          frequency: scheduleInfo.frequency,
          dayOfWeek: scheduleInfo.dayOfWeek,
          dayOfMonth: scheduleInfo.dayOfMonth,
          hour: scheduleInfo.hour,
          minute: scheduleInfo.minute,
          timezone: scheduleInfo.timezone,
          isActive: scheduleInfo.isActive
        },
        recipients: parameters?.recipients || [],
        nextRunTime: calculateNextRunTime(scheduleInfo),
        runCount: parameters?.runCount || 0,
        lastSuccessfulRun: parameters?.lastSuccessfulRun,
        hasEndDate: !!parameters?.endDate,
        endDate: parameters?.endDate,
        isOverdue: isScheduleOverdue(scheduleInfo, report.scheduledAt),
        canEdit: true,
        canDelete: true
      }
    })

    // Filter by schedule-specific criteria
    let filteredReports = transformedReports
    if (frequency) {
      filteredReports = filteredReports.filter(r => r.schedule.frequency === frequency)
    }
    if (isActive !== undefined) {
      filteredReports = filteredReports.filter(r => r.schedule.isActive === isActive)
    }

    const totalCount = filteredReports.length

    res.status(200).json({
      data: filteredReports,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary: {
        totalScheduled: filteredReports.length,
        activeSchedules: filteredReports.filter(r => r.schedule.isActive).length,
        inactiveSchedules: filteredReports.filter(r => !r.schedule.isActive).length,
        overdueSchedules: filteredReports.filter(r => r.isOverdue).length,
        schedulesByFrequency: {
          daily: filteredReports.filter(r => r.schedule.frequency === 'daily').length,
          weekly: filteredReports.filter(r => r.schedule.frequency === 'weekly').length,
          monthly: filteredReports.filter(r => r.schedule.frequency === 'monthly').length,
          quarterly: filteredReports.filter(r => r.schedule.frequency === 'quarterly').length,
          yearly: filteredReports.filter(r => r.schedule.frequency === 'yearly').length
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

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = scheduleReportSchema.parse(req.body)
    
    const {
      reportId,
      title,
      type,
      description,
      parameters,
      schedule,
      recipients,
      generatedById,
      startDate,
      endDate
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
      return res.status(409).json({ error: 'Cannot schedule report for inactive user' })
    }

    // Verify all recipients exist
    const recipientIds = recipients.map(r => r.userId)
    const recipientUsers = await prisma.user.findMany({
      where: {
        id: { in: recipientIds },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (recipientUsers.length !== recipientIds.length) {
      const foundIds = recipientUsers.map(u => u.id)
      const missingIds = recipientIds.filter(id => !foundIds.includes(id))
      return res.status(404).json({ 
        error: 'Some recipients not found or inactive',
        missingRecipientIds: missingIds
      })
    }

    // Validate schedule parameters
    validateScheduleParameters(schedule)

    // Calculate next run time
    const nextRunTime = calculateNextRunTime(schedule, new Date(startDate))

    // Create or update the scheduled report
    let scheduledReport
    if (reportId) {
      // Update existing report to be scheduled
      const existingReport = await prisma.report.findUnique({
        where: { id: reportId }
      })

      if (!existingReport) {
        return res.status(404).json({ error: 'Report not found' })
      }

      scheduledReport = await prisma.report.update({
        where: { id: reportId },
        data: {
          scheduledAt: new Date(startDate),
          parameters: {
            ...parameters,
            schedule,
            recipients,
            endDate,
            runCount: 0,
            nextRunTime: nextRunTime.toISOString()
          } as any
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
    } else {
      // Create new scheduled report
      scheduledReport = await prisma.report.create({
        data: {
          title,
          type,
          description,
          parameters: {
            ...parameters,
            schedule,
            recipients,
            endDate,
            runCount: 0,
            nextRunTime: nextRunTime.toISOString()
          } as any,
          generatedById,
          status: 'PENDING',
          scheduledAt: new Date(startDate)
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
    }

    // Log schedule creation
    await prisma.activityLog.create({
      data: {
        userId: generatedById,
        action: 'REPORT_SCHEDULED',
        entityType: 'Report',
        entityId: scheduledReport.id,
        details: {
          reportTitle: title,
          reportType: type,
          frequency: schedule.frequency,
          startDate,
          endDate,
          recipientCount: recipients.length,
          nextRunTime: nextRunTime.toISOString()
        }
      }
    })

    // Create notifications for recipients
    await Promise.all(recipients.map(recipient => 
      prisma.notification.create({
        data: {
          userId: recipient.userId,
          title: 'Scheduled Report Created',
          message: `You have been added as a recipient for the scheduled report: ${title}`,
          type: 'SYSTEM_ALERT',
          data: {
            reportId: scheduledReport.id,
            reportTitle: title,
            frequency: schedule.frequency,
            nextRunTime: nextRunTime.toISOString(),
            scheduledBy: generator.name
          }
        }
      })
    ))

    res.status(201).json({
      message: 'Report scheduled successfully',
      data: {
        id: scheduledReport.id,
        title: scheduledReport.title,
        type: scheduledReport.type,
        status: scheduledReport.status,
        scheduledAt: scheduledReport.scheduledAt,
        schedule,
        recipients,
        nextRunTime,
        generatedBy: scheduledReport.generatedBy,
        canEdit: true,
        canDelete: true
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

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query
    const validatedData = updateScheduleSchema.parse(req.body)

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid schedule ID' })
    }

    const existingReport = await prisma.report.findUnique({
      where: { id },
      include: {
        generatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!existingReport || !existingReport.scheduledAt) {
      return res.status(404).json({ error: 'Scheduled report not found' })
    }

    const currentParameters = existingReport.parameters as any
    const updateData: any = { ...currentParameters }

    // Update schedule settings
    if (validatedData.schedule) {
      updateData.schedule = {
        ...currentParameters.schedule,
        ...validatedData.schedule
      }
      
      // Recalculate next run time if schedule changed
      if (validatedData.schedule.frequency || validatedData.schedule.hour || validatedData.schedule.minute) {
        updateData.nextRunTime = calculateNextRunTime(updateData.schedule).toISOString()
      }
    }

    // Update recipients
    if (validatedData.recipients) {
      // Verify all recipients exist
      const recipientIds = validatedData.recipients.map(r => r.userId)
      const recipientUsers = await prisma.user.findMany({
        where: {
          id: { in: recipientIds },
          isActive: true
        },
        select: { id: true }
      })

      if (recipientUsers.length !== recipientIds.length) {
        const foundIds = recipientUsers.map(u => u.id)
        const missingIds = recipientIds.filter(id => !foundIds.includes(id))
        return res.status(404).json({ 
          error: 'Some recipients not found or inactive',
          missingRecipientIds: missingIds
        })
      }

      updateData.recipients = validatedData.recipients
    }

    // Update end date
    if (validatedData.endDate) {
      updateData.endDate = validatedData.endDate
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        parameters: updateData
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

    // Log schedule update
    await prisma.activityLog.create({
      data: {
        userId: req.headers['x-user-id'] as string || existingReport.generatedById,
        action: 'REPORT_SCHEDULE_UPDATED',
        entityType: 'Report',
        entityId: id,
        details: {
          changes: validatedData,
          reportTitle: updatedReport.title
        }
      }
    })

    res.status(200).json({
      message: 'Report schedule updated successfully',
      data: {
        id: updatedReport.id,
        title: updatedReport.title,
        type: updatedReport.type,
        schedule: updateData.schedule,
        recipients: updateData.recipients,
        nextRunTime: updateData.nextRunTime,
        endDate: updateData.endDate,
        updatedAt: updatedReport.updatedAt
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

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid schedule ID' })
    }

    const existingReport = await prisma.report.findUnique({
      where: { id }
    })

    if (!existingReport || !existingReport.scheduledAt) {
      return res.status(404).json({ error: 'Scheduled report not found' })
    }

    // Remove scheduling (soft delete - keep the report but remove schedule)
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        scheduledAt: null,
        parameters: {
          ...(existingReport.parameters as any),
          schedule: null,
          isActive: false
        } as any
      }
    })

    // Log schedule deletion
    await prisma.activityLog.create({
      data: {
        userId: req.headers['x-user-id'] as string || existingReport.generatedById,
        action: 'REPORT_SCHEDULE_DELETED',
        entityType: 'Report',
        entityId: id,
        details: {
          reportTitle: existingReport.title,
          reportType: existingReport.type
        }
      }
    })

    res.status(200).json({
      message: 'Report schedule deleted successfully',
      data: {
        id: updatedReport.id,
        title: updatedReport.title,
        scheduledAt: null,
        deletedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    throw error
  }
}

function validateScheduleParameters(schedule: any) {
  const errors = []

  // Validate day of week for weekly schedules
  if (schedule.frequency === 'weekly' && (schedule.dayOfWeek === undefined || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6)) {
    errors.push('Day of week must be specified for weekly schedules (0-6)')
  }

  // Validate day of month for monthly schedules
  if (schedule.frequency === 'monthly' && (schedule.dayOfMonth === undefined || schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31)) {
    errors.push('Day of month must be specified for monthly schedules (1-31)')
  }

  // Validate time
  if (schedule.hour < 0 || schedule.hour > 23) {
    errors.push('Hour must be between 0 and 23')
  }

  if (schedule.minute < 0 || schedule.minute > 59) {
    errors.push('Minute must be between 0 and 59')
  }

  if (errors.length > 0) {
    throw new Error(`Schedule validation errors: ${errors.join('; ')}`)
  }
}

function calculateNextRunTime(schedule: any, fromDate?: Date): Date {
  const now = fromDate || new Date()
  const nextRun = new Date(now)
  
  // Set the time
  nextRun.setHours(schedule.hour || 9, schedule.minute || 0, 0, 0)
  
  // If the time has already passed today, move to next occurrence
  if (nextRun <= now) {
    switch (schedule.frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1)
        break
      case 'weekly':
        const daysUntilTarget = (schedule.dayOfWeek - nextRun.getDay() + 7) % 7
        nextRun.setDate(nextRun.getDate() + (daysUntilTarget || 7))
        break
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1)
        nextRun.setDate(schedule.dayOfMonth || 1)
        break
      case 'quarterly':
        nextRun.setMonth(nextRun.getMonth() + 3)
        nextRun.setDate(1)
        break
      case 'yearly':
        nextRun.setFullYear(nextRun.getFullYear() + 1)
        nextRun.setMonth(0, 1)
        break
    }
  }
  
  return nextRun
}

function isScheduleOverdue(schedule: any, scheduledAt: Date | null): boolean {
  if (!schedule || !schedule.isActive || !scheduledAt) return false
  
  const lastRunTime = schedule.lastSuccessfulRun ? new Date(schedule.lastSuccessfulRun) : scheduledAt
  const nextExpectedRun = calculateNextRunTime(schedule, lastRunTime)
  
  return new Date() > nextExpectedRun
}
