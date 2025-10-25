import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// Enhanced Audit Logging System
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await getAuditLogs(req, res)
    case 'POST':
      return await createAuditLog(req, res)
    default:
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      })
  }
}

// Get audit logs with advanced filtering
async function getAuditLogs(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      ipAddress,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    const where: any = {}

    // Apply filters
    if (userId) where.userId = userId as string
    if (action) where.action = { contains: action as string, mode: 'insensitive' }
    if (entityType) where.entityType = entityType as string
    if (entityId) where.entityId = entityId as string
    if (ipAddress) where.ipAddress = ipAddress as string

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: 'insensitive' } },
        { entityType: { contains: search as string, mode: 'insensitive' } },
        { entityId: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    const [auditLogs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.activityLog.count({ where })
    ])

    // Enhance logs with additional context
    const enhancedLogs = await Promise.all(
      auditLogs.map(async (log) => {
        const contextData = await getAuditLogContext(log)
        return {
          ...log,
          context: contextData,
          risk_level: assessRiskLevel(log),
          formatted_details: formatAuditDetails(log)
        }
      })
    )

    return res.status(200).json({
      success: true,
      data: {
        logs: enhancedLogs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        summary: await getAuditSummary(where)
      }
    })

  } catch (error) {
    console.error('Get Audit Logs Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Create comprehensive audit log entry
async function createAuditLog(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
      sessionId,
      geolocation,
      browserInfo,
      severity = 'INFO', // 'LOW', 'INFO', 'MEDIUM', 'HIGH', 'CRITICAL'
      tags = []
    } = req.body

    // Validate required fields
    if (!userId || !action || !entityType) {
      return res.status(400).json({
        success: false,
        message: 'User ID, action, and entity type are required'
      })
    }

    // Enhance audit log with additional security information
    const enhancedDetails = {
      ...details,
      timestamp: new Date().toISOString(),
      session_info: {
        sessionId,
        userAgent,
        ipAddress,
        geolocation: geolocation || await getGeolocationFromIP(ipAddress),
        browser: browserInfo || parseBrowserInfo(userAgent)
      },
      security_context: {
        severity,
        risk_indicators: analyzeRiskIndicators(action, entityType, details, ipAddress),
        compliance_flags: checkComplianceRequirements(action, entityType)
      },
      system_info: {
        server_time: new Date().toISOString(),
        api_version: '1.0',
        environment: process.env.NODE_ENV || 'development'
      }
    }

    const auditLog = await prisma.activityLog.create({
      data: {
        userId,
        action: action.toUpperCase(),
        entityType: entityType.toUpperCase(),
        entityId,
        details: enhancedDetails,
        ipAddress: ipAddress || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: userAgent || req.headers['user-agent'],
        createdAt: new Date()
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Check for suspicious activity patterns
    await checkSuspiciousActivity(userId, action, ipAddress)

    // Trigger alerts for high-risk activities
    if (enhancedDetails.security_context.severity === 'HIGH' || 
        enhancedDetails.security_context.severity === 'CRITICAL') {
      await triggerSecurityAlert(auditLog)
    }

    return res.status(201).json({
      success: true,
      data: {
        auditLog,
        message: 'Audit log created successfully'
      }
    })

  } catch (error) {
    console.error('Create Audit Log Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Get additional context for audit log entries
async function getAuditLogContext(log: any) {
  const context: any = {
    user_context: {},
    entity_context: {},
    related_activities: []
  }

  try {
    // Get user context
    if (log.userId) {
      const userActivity = await prisma.activityLog.count({
        where: {
          userId: log.userId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
      context.user_context.recent_activity_count = userActivity
    }

    // Get entity-specific context
    switch (log.entityType) {
      case 'APPOINTMENT':
        if (log.entityId) {
          const appointment = await prisma.appointment.findUnique({
            where: { id: log.entityId },
            select: {
              appointmentNumber: true,
              patientName: true,
              status: true,
              appointmentDate: true
            }
          })
          context.entity_context.appointment = appointment
        }
        break

      case 'CORPORATE_PACKAGE':
        if (log.entityId) {
          const pkg = await prisma.corporatePackage.findUnique({
            where: { id: log.entityId },
            select: {
              packageNumber: true,
              packageName: true,
              isActive: true
            }
          })
          context.entity_context.package = pkg
        }
        break

      case 'PAYMENT':
        if (log.entityId) {
          const payment = await prisma.payment.findUnique({
            where: { id: log.entityId },
            select: {
              amount: true,
              status: true,
              paymentMethod: true,
              transactionId: true
            }
          })
          context.entity_context.payment = payment
        }
        break
    }

    // Get related activities in the same time period
    const relatedActivities = await prisma.activityLog.findMany({
      where: {
        entityId: log.entityId,
        id: { not: log.id },
        createdAt: {
          gte: new Date(log.createdAt.getTime() - 60 * 60 * 1000), // 1 hour before
          lte: new Date(log.createdAt.getTime() + 60 * 60 * 1000)  // 1 hour after
        }
      },
      take: 5,
      select: {
        action: true,
        createdAt: true,
        user: { select: { name: true } }
      }
    })
    context.related_activities = relatedActivities

  } catch (error) {
    console.error('Error getting audit context:', error)
  }

  return context
}

// Assess risk level of an audit log entry
function assessRiskLevel(log: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const highRiskActions = [
    'USER_DELETED', 'DATA_EXPORTED', 'SYSTEM_CONFIGURATION_CHANGED',
    'BULK_DELETE', 'PERMISSION_ELEVATED', 'AUDIT_LOG_DELETED'
  ]

  const mediumRiskActions = [
    'APPOINTMENT_CANCELLED', 'PAYMENT_REFUNDED', 'CORPORATE_PACKAGE_DELETED',
    'USER_ROLE_CHANGED', 'PASSWORD_RESET'
  ]

  if (highRiskActions.includes(log.action)) return 'HIGH'
  if (mediumRiskActions.includes(log.action)) return 'MEDIUM'

  // Check for suspicious patterns
  const details = log.details || {}
  
  // Multiple failures from same IP
  if (details.failure_count && details.failure_count > 3) return 'HIGH'
  
  // Access outside business hours
  const hour = new Date(log.createdAt).getHours()
  if (hour < 6 || hour > 22) return 'MEDIUM'

  // Bulk operations
  if (details.batch_size && details.batch_size > 50) return 'MEDIUM'

  return 'LOW'
}

// Format audit details for display
function formatAuditDetails(log: any) {
  const details = log.details || {}
  const formatted: any = {
    primary_info: {},
    technical_details: {},
    security_info: {}
  }

  // Extract key information based on action type
  switch (log.action) {
    case 'ACB_APPOINTMENT_CONFIRMED':
      formatted.primary_info = {
        appointment_number: details.appointmentNumber,
        doctor_name: details.doctorName,
        patient_name: details.patientName,
        confirmation_type: details.confirmationType
      }
      break

    case 'CORPORATE_PACKAGE_CREATED':
    case 'CORPORATE_PACKAGE_UPDATED':
    case 'CORPORATE_PACKAGE_DELETED':
      formatted.primary_info = {
        package_number: details.packageNumber,
        package_name: details.packageName,
        corporate_name: details.corporateName,
        package_value: details.packageValue
      }
      break

    case 'NOTIFICATIONS_SENT':
      formatted.primary_info = {
        notification_type: details.notificationType,
        recipient_count: details.recipientCount,
        success_count: details.results?.filter((r: any) => r.success).length || 0,
        failure_count: details.results?.filter((r: any) => !r.success).length || 0
      }
      break

    case 'REPORT_GENERATED':
      formatted.primary_info = {
        report_type: details.reportType,
        date_range: details.dateRange,
        format: details.format,
        record_count: details.recordCount
      }
      break

    case 'USER_LOGIN':
    case 'USER_LOGOUT':
      formatted.primary_info = {
        login_method: details.loginMethod,
        session_duration: details.sessionDuration
      }
      formatted.security_info = {
        login_attempts: details.loginAttempts,
        device_trusted: details.deviceTrusted
      }
      break
  }

  // Technical details
  formatted.technical_details = {
    ip_address: log.ipAddress,
    user_agent: log.userAgent,
    timestamp: log.createdAt,
    processing_time: details.processing_time || 'N/A'
  }

  return formatted
}

// Get audit summary statistics
async function getAuditSummary(where: any) {
  try {
    const [
      totalLogs,
      uniqueUsers,
      actionCounts,
      riskLevelCounts,
      recentActivity
    ] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.groupBy({
        by: ['userId'],
        where,
        _count: true
      }),
      prisma.activityLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      getRiskLevelCounts(where),
      getRecentActivityStats(where)
    ])

    return {
      total_logs: totalLogs,
      unique_users: uniqueUsers.length,
      top_actions: actionCounts.map(a => ({
        action: a.action,
        count: a._count
      })),
      risk_distribution: riskLevelCounts,
      recent_activity: recentActivity
    }

  } catch (error) {
    console.error('Error getting audit summary:', error)
    return {}
  }
}

// Analyze risk indicators
function analyzeRiskIndicators(action: string, entityType: string, details: any, ipAddress: string) {
  const indicators: string[] = []

  // Check for bulk operations
  if (details.batch_size && details.batch_size > 10) {
    indicators.push('BULK_OPERATION')
  }

  // Check for administrative actions
  const adminActions = ['DELETE', 'EXPORT', 'CONFIGURATION', 'PERMISSION']
  if (adminActions.some(a => action.includes(a))) {
    indicators.push('ADMINISTRATIVE_ACTION')
  }

  // Check for sensitive data access
  const sensitiveEntities = ['USER', 'PAYMENT', 'FINANCIAL']
  if (sensitiveEntities.some(e => entityType.includes(e))) {
    indicators.push('SENSITIVE_DATA_ACCESS')
  }

  // Check for unusual time access
  const hour = new Date().getHours()
  if (hour < 6 || hour > 22) {
    indicators.push('OFF_HOURS_ACCESS')
  }

  return indicators
}

// Check compliance requirements
function checkComplianceRequirements(action: string, entityType: string) {
  const flags: string[] = []

  // GDPR compliance flags
  if (action.includes('EXPORT') || action.includes('DELETE')) {
    flags.push('GDPR_DATA_PROCESSING')
  }

  // Financial compliance
  if (entityType === 'PAYMENT' || action.includes('FINANCIAL')) {
    flags.push('FINANCIAL_REGULATION')
  }

  // Healthcare compliance (HIPAA-like)
  if (entityType === 'APPOINTMENT' || entityType === 'PATIENT') {
    flags.push('HEALTHCARE_DATA')
  }

  return flags
}

// Check for suspicious activity patterns
async function checkSuspiciousActivity(userId: string, action: string, ipAddress: string) {
  try {
    // Check for rapid successive actions (potential bot activity)
    const recentActions = await prisma.activityLog.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    })

    // Check for multiple failed attempts
    const failedAttempts = await prisma.activityLog.count({
      where: {
        userId,
        action: { contains: 'FAILED' },
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      }
    })

    // Check for IP address changes
    const ipChanges = await prisma.activityLog.groupBy({
      by: ['ipAddress'],
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    })

    const suspiciousIndicators = []
    if (recentActions > 20) suspiciousIndicators.push('RAPID_ACTIONS')
    if (failedAttempts > 5) suspiciousIndicators.push('MULTIPLE_FAILURES')
    if (ipChanges.length > 3) suspiciousIndicators.push('IP_HOPPING')

    if (suspiciousIndicators.length > 0) {
      // Log suspicious activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'SUSPICIOUS_ACTIVITY_DETECTED',
          entityType: 'SECURITY',
          entityId: userId,
          details: {
            indicators: suspiciousIndicators,
            trigger_action: action,
            analysis_time: new Date().toISOString()
          },
          ipAddress
        }
      })
    }

  } catch (error) {
    console.error('Error checking suspicious activity:', error)
  }
}

// Trigger security alerts for high-risk activities
async function triggerSecurityAlert(auditLog: any) {
  try {
    // Create security notification
    const alertDetails = {
      alert_type: 'HIGH_RISK_ACTIVITY',
      user: auditLog.user,
      action: auditLog.action,
      entity: {
        type: auditLog.entityType,
        id: auditLog.entityId
      },
      timestamp: auditLog.createdAt,
      risk_level: assessRiskLevel(auditLog),
      ip_address: auditLog.ipAddress
    }

    // TODO: Send to security team via email/SMS
    console.log('SECURITY ALERT:', alertDetails)

    // Log the alert itself
    await prisma.activityLog.create({
      data: {
        userId: 'SYSTEM',
        action: 'SECURITY_ALERT_TRIGGERED',
        entityType: 'SECURITY',
        entityId: auditLog.id,
        details: alertDetails,
        ipAddress: 'SYSTEM'
      }
    })

  } catch (error) {
    console.error('Error triggering security alert:', error)
  }
}

// Helper functions
async function getGeolocationFromIP(ipAddress: string): Promise<any> {
  // Mock geolocation - in production, use actual geolocation service
  return {
    country: 'Sri Lanka',
    city: 'Colombo',
    coordinates: { lat: 6.9271, lng: 79.8612 }
  }
}

function parseBrowserInfo(userAgent: string): any {
  // Basic user agent parsing - use a proper library in production
  return {
    browser: userAgent?.includes('Chrome') ? 'Chrome' : 'Other',
    os: userAgent?.includes('Windows') ? 'Windows' : 'Other',
    mobile: userAgent?.includes('Mobile') || false
  }
}

async function getRiskLevelCounts(where: any) {
  // This would require calculating risk levels for all logs
  // For now, return mock data
  return {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0
  }
}

async function getRecentActivityStats(where: any) {
  const last24h = await prisma.activityLog.count({
    where: {
      ...where,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    }
  })

  const lastHour = await prisma.activityLog.count({
    where: {
      ...where,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000)
      }
    }
  })

  return {
    last_24_hours: last24h,
    last_hour: lastHour,
    activity_rate: Math.round(last24h / 24 * 100) / 100 // per hour average
  }
}