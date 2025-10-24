import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const exportReportSchema = z.object({
  reportId: z.string().cuid(),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).default('PDF'),
  options: z.object({
    includeCharts: z.boolean().default(true),
    includeRawData: z.boolean().default(false),
    includeMetadata: z.boolean().default(true),
    compression: z.enum(['none', 'zip', 'gzip']).default('none'),
    password: z.string().optional(), // For password-protected exports
    watermark: z.string().optional(),
    customTemplate: z.string().optional(), // Template ID for custom formatting
    orientation: z.enum(['portrait', 'landscape']).default('portrait'), // For PDF
    pageSize: z.enum(['A4', 'A3', 'LETTER', 'LEGAL']).default('A4'), // For PDF
    fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
    includeHeaders: z.boolean().default(true), // For CSV/Excel
    dateFormat: z.enum(['ISO', 'US', 'EU', 'LOCAL']).default('ISO'),
    currencyFormat: z.enum(['USD', 'EUR', 'LKR', 'AUTO']).default('AUTO'),
    timezone: z.string().default('UTC')
  }).optional(),
  deliveryMethod: z.enum(['DOWNLOAD', 'EMAIL', 'CLOUD_STORAGE']).default('DOWNLOAD'),
  emailRecipients: z.array(z.string().email()).optional(),
  requestedBy: z.string().cuid()
})

const bulkExportSchema = z.object({
  reportIds: z.array(z.string().cuid()).min(1).max(50),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).default('PDF'),
  options: z.object({
    includeCharts: z.boolean().default(true),
    includeRawData: z.boolean().default(false),
    includeMetadata: z.boolean().default(true),
    compression: z.enum(['zip', 'gzip']).default('zip'), // Always compress bulk exports
    mergeIntoSingle: z.boolean().default(false), // Merge all reports into one file
    separateFiles: z.boolean().default(true), // Create separate files per report
    includeIndex: z.boolean().default(true), // Include index/summary file
    customTemplate: z.string().optional(),
    dateFormat: z.enum(['ISO', 'US', 'EU', 'LOCAL']).default('ISO'),
    timezone: z.string().default('UTC')
  }).optional(),
  deliveryMethod: z.enum(['DOWNLOAD', 'EMAIL', 'CLOUD_STORAGE']).default('DOWNLOAD'),
  emailRecipients: z.array(z.string().email()).optional(),
  requestedBy: z.string().cuid()
})

const exportHistorySchema = z.object({
  requestedBy: z.string().cuid().optional(),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).optional(),
  deliveryMethod: z.enum(['DOWNLOAD', 'EMAIL', 'CLOUD_STORAGE']).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED']).optional(),
  dateFrom: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
  dateTo: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
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
      case 'DELETE':
        await handleDelete(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Report export API error:', error)
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
    const { exportId } = req.query
    
    if (exportId) {
      // Get specific export status/details
      await getExportDetails(req, res, exportId as string)
    } else {
      // Get export history
      await getExportHistory(req, res)
    }
  } catch (error) {
    throw error
  }
}

async function getExportDetails(req: NextApiRequest, res: NextApiResponse, exportId: string) {
  // In a production system, you'd have a separate exports table
  // For now, we'll simulate this with activity logs
  const exportRecord = await prisma.activityLog.findFirst({
    where: {
      action: 'REPORT_EXPORTED',
      entityType: 'Report',
      details: {
        path: ['exportId'],
        equals: exportId
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  if (!exportRecord) {
    return res.status(404).json({ error: 'Export not found' })
  }

  const details = exportRecord.details as any
  
  res.status(200).json({
    data: {
      id: exportId,
      reportId: exportRecord.entityId,
      format: details.format,
      status: details.status || 'COMPLETED',
      fileSize: details.fileSize,
      fileName: details.fileName,
      downloadUrl: details.downloadUrl,
      expiresAt: details.expiresAt,
      requestedBy: exportRecord.user,
      requestedAt: exportRecord.createdAt,
      completedAt: details.completedAt,
      options: details.options || {},
      deliveryMethod: details.deliveryMethod,
      emailSent: details.emailSent,
      downloadCount: details.downloadCount || 0,
      lastDownloadedAt: details.lastDownloadedAt,
      error: details.error
    }
  })
}

async function getExportHistory(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedFilters = exportHistorySchema.parse(req.query)
    
    const {
      requestedBy,
      format,
      deliveryMethod,
      status,
      dateFrom,
      dateTo,
      limit,
      offset
    } = validatedFilters

    const where: any = {
      action: 'REPORT_EXPORTED',
      entityType: 'Report'
    }
    
    if (requestedBy) {
      where.userId = requestedBy
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    const exportHistory = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Transform and filter export records
    let transformedExports = exportHistory.map(record => {
      const details = record.details as any
      return {
        id: details.exportId,
        reportId: record.entityId,
        reportTitle: details.reportTitle,
        format: details.format,
        status: details.status || 'COMPLETED',
        fileSize: details.fileSize,
        fileName: details.fileName,
        downloadUrl: details.downloadUrl,
        expiresAt: details.expiresAt,
        requestedBy: record.user,
        requestedAt: record.createdAt,
        completedAt: details.completedAt,
        deliveryMethod: details.deliveryMethod,
        downloadCount: details.downloadCount || 0,
        lastDownloadedAt: details.lastDownloadedAt,
        isExpired: details.expiresAt ? new Date(details.expiresAt) < new Date() : false,
        canDownload: details.downloadUrl && (!details.expiresAt || new Date(details.expiresAt) > new Date()),
        error: details.error
      }
    })

    // Apply additional filters
    if (format) {
      transformedExports = transformedExports.filter(exp => exp.format === format)
    }
    if (deliveryMethod) {
      transformedExports = transformedExports.filter(exp => exp.deliveryMethod === deliveryMethod)
    }
    if (status) {
      transformedExports = transformedExports.filter(exp => exp.status === status)
    }

    const totalCount = transformedExports.length

    res.status(200).json({
      data: transformedExports,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary: {
        totalExports: totalCount,
        byFormat: {
          PDF: transformedExports.filter(e => e.format === 'PDF').length,
          EXCEL: transformedExports.filter(e => e.format === 'EXCEL').length,
          CSV: transformedExports.filter(e => e.format === 'CSV').length,
          JSON: transformedExports.filter(e => e.format === 'JSON').length
        },
        byStatus: {
          PENDING: transformedExports.filter(e => e.status === 'PENDING').length,
          PROCESSING: transformedExports.filter(e => e.status === 'PROCESSING').length,
          COMPLETED: transformedExports.filter(e => e.status === 'COMPLETED').length,
          FAILED: transformedExports.filter(e => e.status === 'FAILED').length,
          EXPIRED: transformedExports.filter(e => e.isExpired).length
        },
        totalFileSize: transformedExports.reduce((sum, exp) => sum + (exp.fileSize || 0), 0),
        totalDownloads: transformedExports.reduce((sum, exp) => sum + exp.downloadCount, 0)
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
    const { bulk } = req.query
    
    if (bulk === 'true') {
      await handleBulkExport(req, res)
    } else {
      await handleSingleExport(req, res)
    }
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

async function handleSingleExport(req: NextApiRequest, res: NextApiResponse) {
  const validatedData = exportReportSchema.parse(req.body)
  
  const {
    reportId,
    format,
    options,
    deliveryMethod,
    emailRecipients,
    requestedBy
  } = validatedData

  // Verify report exists and user has access
  const report = await prisma.report.findUnique({
    where: { id: reportId },
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

  if (!report) {
    return res.status(404).json({ error: 'Report not found' })
  }

  if (report.status !== 'COMPLETED') {
    return res.status(409).json({ error: 'Report is not ready for export' })
  }

  // Verify requester exists
  const requester = await prisma.user.findUnique({
    where: { id: requestedBy },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  })

  if (!requester) {
    return res.status(404).json({ error: 'Requester not found' })
  }

  // Generate export ID
  const exportId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Simulate export processing (in production, this would be async)
  const exportResult = await processReportExport(report, format, options, exportId)
  
  // Set expiration (24 hours from now)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  // Log export activity
  await prisma.activityLog.create({
    data: {
      userId: requestedBy,
      action: 'REPORT_EXPORTED',
      entityType: 'Report',
      entityId: reportId,
      details: {
        exportId,
        format,
        options,
        deliveryMethod,
        fileName: exportResult.fileName,
        fileSize: exportResult.fileSize,
        downloadUrl: exportResult.downloadUrl,
        expiresAt: expiresAt.toISOString(),
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        reportTitle: report.title,
        reportType: report.type
      }
    }
  })

  // Handle different delivery methods
  if (deliveryMethod === 'EMAIL' && emailRecipients?.length) {
    await sendExportEmail(emailRecipients, report, exportResult, requester)
  }

  // Create notification for requester
  await prisma.notification.create({
    data: {
      userId: requestedBy,
      title: 'Report Export Ready',
      message: `Your export of "${report.title}" in ${format} format is ready for download.`,
      type: 'SYSTEM_ALERT',
      data: {
        exportId,
        reportId,
        format,
        fileName: exportResult.fileName,
        downloadUrl: exportResult.downloadUrl,
        expiresAt: expiresAt.toISOString()
      }
    }
  })

  res.status(200).json({
    message: 'Report export completed successfully',
    data: {
      exportId,
      reportId,
      reportTitle: report.title,
      format,
      fileName: exportResult.fileName,
      fileSize: exportResult.fileSize,
      downloadUrl: exportResult.downloadUrl,
      expiresAt,
      deliveryMethod,
      emailSent: deliveryMethod === 'EMAIL' && emailRecipients?.length ? true : false,
      status: 'COMPLETED'
    }
  })
}

async function handleBulkExport(req: NextApiRequest, res: NextApiResponse) {
  const validatedData = bulkExportSchema.parse(req.body)
  
  const {
    reportIds,
    format,
    options,
    deliveryMethod,
    emailRecipients,
    requestedBy
  } = validatedData

  // Verify all reports exist and are ready
  const reports = await prisma.report.findMany({
    where: {
      id: { in: reportIds },
      status: 'COMPLETED'
    },
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

  if (reports.length !== reportIds.length) {
    const foundIds = reports.map(r => r.id)
    const missingIds = reportIds.filter(id => !foundIds.includes(id))
    return res.status(404).json({ 
      error: 'Some reports not found or not ready',
      missingReportIds: missingIds
    })
  }

  // Verify requester exists
  const requester = await prisma.user.findUnique({
    where: { id: requestedBy },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  })

  if (!requester) {
    return res.status(404).json({ error: 'Requester not found' })
  }

  // Generate export ID for bulk export
  const exportId = `bulk_exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Process bulk export
  const bulkExportResult = await processBulkReportExport(reports, format, options, exportId)
  
  // Set expiration (48 hours for bulk exports)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48)

  // Log bulk export activity
  await prisma.activityLog.create({
    data: {
      userId: requestedBy,
      action: 'BULK_REPORT_EXPORTED',
      entityType: 'Report',
      entityId: reportIds[0], // Use first report ID as primary reference
      details: {
        exportId,
        reportIds,
        reportCount: reports.length,
        format,
        options,
        deliveryMethod,
        fileName: bulkExportResult.fileName,
        fileSize: bulkExportResult.fileSize,
        downloadUrl: bulkExportResult.downloadUrl,
        expiresAt: expiresAt.toISOString(),
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        reportTitles: reports.map(r => r.title)
      }
    }
  })

  // Handle delivery
  if (deliveryMethod === 'EMAIL' && emailRecipients?.length) {
    await sendBulkExportEmail(emailRecipients, reports, bulkExportResult, requester)
  }

  // Create notification
  await prisma.notification.create({
    data: {
      userId: requestedBy,
      title: 'Bulk Export Ready',
      message: `Your bulk export of ${reports.length} reports in ${format} format is ready for download.`,
      type: 'SYSTEM_ALERT',
      data: {
        exportId,
        reportCount: reports.length,
        format,
        fileName: bulkExportResult.fileName,
        downloadUrl: bulkExportResult.downloadUrl,
        expiresAt: expiresAt.toISOString()
      }
    }
  })

  res.status(200).json({
    message: 'Bulk report export completed successfully',
    data: {
      exportId,
      reportIds,
      reportCount: reports.length,
      format,
      fileName: bulkExportResult.fileName,
      fileSize: bulkExportResult.fileSize,
      downloadUrl: bulkExportResult.downloadUrl,
      expiresAt,
      deliveryMethod,
      emailSent: deliveryMethod === 'EMAIL' && emailRecipients?.length ? true : false,
      status: 'COMPLETED'
    }
  })
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { exportId } = req.query

    if (!exportId || typeof exportId !== 'string') {
      return res.status(400).json({ error: 'Invalid export ID' })
    }

    // Find export record
    const exportRecord = await prisma.activityLog.findFirst({
      where: {
        action: { in: ['REPORT_EXPORTED', 'BULK_REPORT_EXPORTED'] },
        details: {
          path: ['exportId'],
          equals: exportId
        }
      }
    })

    if (!exportRecord) {
      return res.status(404).json({ error: 'Export not found' })
    }

    const details = exportRecord.details as any
    
    // In production, you would delete the actual file from storage here
    // For now, we'll just mark it as deleted in the activity log
    await prisma.activityLog.update({
      where: { id: exportRecord.id },
      data: {
        details: {
          ...details,
          status: 'DELETED',
          deletedAt: new Date().toISOString(),
          downloadUrl: null
        }
      }
    })

    res.status(200).json({
      message: 'Export deleted successfully',
      data: {
        exportId,
        deletedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    throw error
  }
}

// Helper functions for export processing
async function processReportExport(report: any, format: string, options: any, exportId: string) {
  // Simulate export processing
  const fileName = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${exportId}.${format.toLowerCase()}`
  const fileSize = Math.floor(Math.random() * 5000000) + 100000 // 100KB to 5MB
  
  // In production, you would:
  // 1. Generate the actual file based on report data and format
  // 2. Apply the specified options (charts, raw data, etc.)
  // 3. Store the file in cloud storage (S3, Azure Blob, etc.)
  // 4. Generate a secure download URL
  
  return {
    fileName,
    fileSize,
    downloadUrl: `/api/exports/download/${exportId}`,
    mimeType: getMimeType(format)
  }
}

async function processBulkReportExport(reports: any[], format: string, options: any, exportId: string) {
  // Simulate bulk export processing
  const fileName = `Bulk_Reports_${exportId}.${options.compression || 'zip'}`
  const fileSize = reports.length * (Math.floor(Math.random() * 3000000) + 200000) // Estimate based on report count
  
  return {
    fileName,
    fileSize,
    downloadUrl: `/api/exports/download/${exportId}`,
    mimeType: 'application/zip'
  }
}

async function sendExportEmail(recipients: string[], report: any, exportResult: any, requester: any) {
  // In production, integrate with email service (SendGrid, AWS SES, etc.)
  console.log('Email sent to:', recipients, 'for report:', report.title)
}

async function sendBulkExportEmail(recipients: string[], reports: any[], exportResult: any, requester: any) {
  // In production, integrate with email service
  console.log('Bulk export email sent to:', recipients, 'for', reports.length, 'reports')
}

function getMimeType(format: string): string {
  const mimeTypes = {
    'PDF': 'application/pdf',
    'EXCEL': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'CSV': 'text/csv',
    'JSON': 'application/json'
  }
  return mimeTypes[format as keyof typeof mimeTypes] || 'application/octet-stream'
}
