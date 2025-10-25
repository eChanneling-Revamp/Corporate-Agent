import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// Comprehensive Export API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }

  try {
    const {
      entityType, // 'appointments', 'patients', 'doctors', etc.
      format, // 'csv', 'excel', 'pdf', 'json'
      filters = {},
      columns = [], // Specific columns to export
      includeHeaders = true,
      customFileName,
      emailRecipients = [], // Email addresses to send the file
      scheduledExport = false,
      exportedBy
    } = req.body

    // Validate required fields
    if (!entityType || !format || !exportedBy) {
      return res.status(400).json({
        success: false,
        message: 'Entity type, format, and exportedBy are required'
      })
    }

    // Validate format
    const supportedFormats = ['csv', 'excel', 'pdf', 'json']
    if (!supportedFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported format: ${format}. Supported formats: ${supportedFormats.join(', ')}`
      })
    }

    // Get data based on entity type and filters
    const exportData = await getExportData(entityType, filters, columns)
    
    if (!exportData || exportData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found for the specified criteria'
      })
    }

    // Generate filename
    const fileName = customFileName || `${entityType}_export_${new Date().toISOString().split('T')[0]}`
    
    // Create export job record
    const exportJob = await prisma.exportJob.create({
      data: {
        jobId: `export_${Date.now()}`,
        entityType,
        format,
        fileName: `${fileName}.${format}`,
        status: 'PROCESSING',
        exportedBy,
        totalRecords: exportData.length,
        filters: filters || {},
        columns: columns || [],
        createdAt: new Date()
      }
    })

    let exportResult: any

    try {
      // Generate export based on format
      switch (format) {
        case 'csv':
          exportResult = await generateCSV(exportData, includeHeaders, columns)
          break
        case 'excel':
          exportResult = await generateExcel(exportData, includeHeaders, columns, entityType)
          break
        case 'pdf':
          exportResult = await generatePDF(exportData, entityType, fileName)
          break
        case 'json':
          exportResult = await generateJSON(exportData)
          break
      }

      // Update export job status
      await prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: 'COMPLETED',
          filePath: exportResult.filePath,
          fileSize: exportResult.fileSize,
          completedAt: new Date()
        }
      })

      // Send via email if recipients specified
      if (emailRecipients.length > 0) {
        await sendExportByEmail(exportResult, emailRecipients, fileName, entityType)
      }

      // Log export activity
      await prisma.activityLog.create({
        data: {
          userId: exportedBy,
          action: 'DATA_EXPORTED',
          entityType: 'EXPORT',
          entityId: exportJob.jobId,
          details: {
            exportType: entityType,
            format,
            fileName: exportResult.fileName,
            recordCount: exportData.length,
            fileSize: exportResult.fileSize,
            emailRecipients: emailRecipients.length
          },
          ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      })

      // Return the export result
      if (format === 'json') {
        return res.status(200).json({
          success: true,
          data: {
            exportId: exportJob.jobId,
            format,
            recordCount: exportData.length,
            data: exportResult.data
          }
        })
      } else {
        // For file formats, set appropriate headers and return file
        res.setHeader('Content-Type', getContentType(format))
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.${format}"`)
        
        if (format === 'pdf') {
          return res.send(exportResult.buffer)
        } else {
          return res.send(exportResult.content)
        }
      }

    } catch (exportError) {
      // Update export job with failure
      await prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: 'FAILED',
          errorMessage: exportError instanceof Error ? exportError.message : 'Export generation failed',
          completedAt: new Date()
        }
      })
      
      throw exportError
    }

  } catch (error) {
    console.error('Export Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Get data for export based on entity type and filters
async function getExportData(entityType: string, filters: any, columns: string[]) {
  const where = buildWhereClause(filters)
  
  switch (entityType) {
    case 'appointments':
      return await prisma.appointment.findMany({
        where,
        include: {
          doctor: true,
          hospital: true,
          bookedBy: { select: { name: true, email: true, role: true } },
          payments: true
        },
        orderBy: { createdAt: 'desc' }
      })

    case 'patients':
      // Get unique patients from appointments
      const appointments = await prisma.appointment.findMany({
        where,
        select: {
          patientName: true,
          patientEmail: true,
          patientPhone: true,
          patientNIC: true,
          patientGender: true,
          patientDateOfBirth: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          medicalHistory: true,
          currentMedications: true,
          allergies: true,
          insuranceProvider: true,
          insurancePolicyNumber: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })
      
      // Remove duplicates based on email
      const patientMap = new Map()
      appointments.forEach(apt => {
        const key = apt.patientEmail || apt.patientPhone
        if (!patientMap.has(key)) {
          patientMap.set(key, apt)
        }
      })
      return Array.from(patientMap.values())

    case 'doctors':
      return await prisma.doctor.findMany({
        where,
        include: {
          hospital: true,
          _count: {
            select: {
              appointments: true,
              timeSlots: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

    case 'hospitals':
      return await prisma.hospital.findMany({
        where,
        include: {
          _count: {
            select: {
              doctors: true,
              appointments: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

    case 'users':
      return await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyName: true,
          contactNumber: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              appointments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

    case 'payments':
      return await prisma.payment.findMany({
        where,
        include: {
          appointment: {
            select: {
              appointmentNumber: true,
              patientName: true,
              doctor: { select: { name: true } },
              hospital: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

    case 'reports':
      return await prisma.report.findMany({
        where,
        include: {
          generatedBy: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

    case 'audit_logs':
      return await prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

    default:
      throw new Error(`Unsupported entity type: ${entityType}`)
  }
}

// Build where clause from filters
function buildWhereClause(filters: any) {
  const where: any = {}

  // Common date filters
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      where.createdAt.lte = new Date(filters.dateTo)
    }
  }

  // Entity-specific filters
  Object.entries(filters).forEach(([key, value]) => {
    if (key !== 'dateFrom' && key !== 'dateTo' && value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        where[key] = { in: value }
      } else {
        where[key] = value
      }
    }
  })

  return where
}

// Generate CSV export
async function generateCSV(data: any[], includeHeaders: boolean, columns: string[]) {
  if (!data || data.length === 0) {
    return { content: '', fileSize: 0 }
  }

  const flatData = data.map(item => flattenObject(item))
  const allColumns = columns.length > 0 ? columns : Object.keys(flatData[0])
  
  let csvContent = ''
  
  if (includeHeaders) {
    csvContent += allColumns.map(col => `"${col}"`).join(',') + '\n'
  }

  flatData.forEach(row => {
    const values = allColumns.map(col => {
      let value = row[col] || ''
      
      // Handle different data types
      if (value instanceof Date) {
        value = value.toISOString().split('T')[0]
      } else if (typeof value === 'object') {
        value = JSON.stringify(value)
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes
        value = `"${value.replace(/"/g, '""')}"`
      }
      
      return value
    })
    
    csvContent += values.join(',') + '\n'
  })

  return {
    content: csvContent,
    fileSize: Buffer.byteLength(csvContent, 'utf8'),
    fileName: 'export.csv'
  }
}

// Generate Excel export (simplified - in production use a library like exceljs)
async function generateExcel(data: any[], includeHeaders: boolean, columns: string[], entityType: string) {
  // For now, return CSV format with Excel headers
  // In production, implement proper Excel generation using exceljs library
  
  const csvResult = await generateCSV(data, includeHeaders, columns)
  
  return {
    content: csvResult.content,
    fileSize: csvResult.fileSize,
    fileName: `${entityType}_export.xlsx`,
    note: 'Excel format not fully implemented - returning CSV'
  }
}

// Generate PDF export (simplified - in production use a library like puppeteer or jsPDF)
async function generatePDF(data: any[], entityType: string, fileName: string) {
  // For now, return HTML content that can be converted to PDF
  // In production, use puppeteer or jsPDF for proper PDF generation
  
  const flatData = data.map(item => flattenObject(item))
  const columns = Object.keys(flatData[0] || {})
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${entityType} Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          h1 { color: #333; }
          .export-info { margin-bottom: 20px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Export</h1>
        <div class="export-info">
          Generated on: ${new Date().toLocaleDateString()}<br>
          Total Records: ${data.length}
        </div>
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${flatData.map(row => `
              <tr>
                ${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  return {
    buffer: Buffer.from(htmlContent, 'utf8'),
    fileSize: Buffer.byteLength(htmlContent, 'utf8'),
    fileName: `${fileName}.pdf`,
    note: 'PDF format not fully implemented - returning HTML'
  }
}

// Generate JSON export
async function generateJSON(data: any[]) {
  const jsonContent = JSON.stringify(data, null, 2)
  
  return {
    data: data,
    content: jsonContent,
    fileSize: Buffer.byteLength(jsonContent, 'utf8'),
    fileName: 'export.json'
  }
}

// Flatten nested objects for CSV export
function flattenObject(obj: any, prefix = ''): any {
  let flattened: any = {}
  
  Object.keys(obj).forEach(key => {
    const value = obj[key]
    const newKey = prefix ? `${prefix}.${key}` : key
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(flattened, flattenObject(value, newKey))
    } else if (Array.isArray(value)) {
      flattened[newKey] = value.length > 0 ? JSON.stringify(value) : ''
    } else {
      flattened[newKey] = value
    }
  })
  
  return flattened
}

// Get content type for different formats
function getContentType(format: string): string {
  switch (format) {
    case 'csv':
      return 'text/csv'
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'pdf':
      return 'application/pdf'
    case 'json':
      return 'application/json'
    default:
      return 'text/plain'
  }
}

// Send export via email
async function sendExportByEmail(exportResult: any, recipients: string[], fileName: string, entityType: string) {
  // This would integrate with the notification service
  // For now, just log that email would be sent
  
  console.log(`Export email would be sent to:`, {
    recipients,
    fileName: exportResult.fileName,
    fileSize: exportResult.fileSize,
    entityType
  })

  // TODO: Integrate with notification service to send actual emails
  // await sendNotification({
  //   type: 'export_ready',
  //   recipients: recipients.map(email => ({ type: 'email', destination: email })),
  //   templateData: {
  //     fileName: exportResult.fileName,
  //     entityType,
  //     recordCount: data.length
  //   },
  //   attachments: [exportResult]
  // })
}