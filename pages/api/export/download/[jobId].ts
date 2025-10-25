import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

// Download Export File API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }

  try {
    const { jobId } = req.query

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      })
    }

    // Get export job
    const exportJob = await prisma.exportJob.findUnique({
      where: { jobId }
    })

    if (!exportJob) {
      return res.status(404).json({
        success: false,
        message: 'Export job not found'
      })
    }

    if (exportJob.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Export is not ready for download'
      })
    }

    if (!exportJob.filePath) {
      return res.status(404).json({
        success: false,
        message: 'Export file not found'
      })
    }

    // In a real implementation, you would read the file from storage
    // For this demo, we'll return a mock file response
    const mockFileContent = generateMockExportContent(exportJob)
    
    // Set appropriate headers
    const contentType = getContentType(exportJob.format)
    const fileName = exportJob.fileName

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Content-Length', mockFileContent.length.toString())

    // Log download activity
    await prisma.activityLog.create({
      data: {
        userId: exportJob.exportedBy,
        action: 'FILE_DOWNLOADED',
        entityType: 'EXPORT',
        entityId: jobId,
        details: {
          fileName,
          fileSize: mockFileContent.length,
          format: exportJob.format,
          entityType: exportJob.entityType
        }
      }
    })

    return res.send(mockFileContent)

  } catch (error) {
    console.error('Download Export Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Generate mock export content for demo
function generateMockExportContent(exportJob: any): Buffer {
  const { format, entityType, totalRecords } = exportJob

  switch (format) {
    case 'CSV':
      return generateCSVContent(entityType, totalRecords)
    case 'EXCEL':
      return generateExcelContent(entityType, totalRecords)
    case 'PDF':
      return generatePDFContent(entityType, totalRecords)
    case 'JSON':
      return generateJSONContent(entityType, totalRecords)
    default:
      return Buffer.from('Export format not supported', 'utf8')
  }
}

function generateCSVContent(entityType: string, totalRecords: number): Buffer {
  let csvContent = ''
  
  switch (entityType) {
    case 'appointments':
      csvContent = 'Appointment Number,Patient Name,Doctor,Hospital,Date,Status\n'
      for (let i = 1; i <= Math.min(totalRecords, 100); i++) {
        csvContent += `APT-${String(i).padStart(6, '0')},Patient ${i},Dr. Smith,General Hospital,2024-01-${String(i % 30 + 1).padStart(2, '0')},CONFIRMED\n`
      }
      break
      
    case 'patients':
      csvContent = 'Patient Name,Email,Phone,Gender,Age\n'
      for (let i = 1; i <= Math.min(totalRecords, 100); i++) {
        csvContent += `Patient ${i},patient${i}@email.com,+94701234567,${i % 2 === 0 ? 'MALE' : 'FEMALE'},${25 + (i % 50)}\n`
      }
      break
      
    case 'doctors':
      csvContent = 'Name,Specialization,Hospital,Experience,Fee\n'
      for (let i = 1; i <= Math.min(totalRecords, 100); i++) {
        csvContent += `Dr. Doctor ${i},Cardiology,Hospital ${i % 5 + 1},${5 + (i % 20)} years,${2000 + (i % 10) * 500}\n`
      }
      break
      
    default:
      csvContent = 'ID,Name,Created Date\n'
      for (let i = 1; i <= Math.min(totalRecords, 100); i++) {
        csvContent += `${i},Record ${i},2024-01-${String(i % 30 + 1).padStart(2, '0')}\n`
      }
  }
  
  return Buffer.from(csvContent, 'utf8')
}

function generateExcelContent(entityType: string, totalRecords: number): Buffer {
  // For demo purposes, return CSV content with Excel headers
  // In production, use a library like exceljs to generate actual Excel files
  const csvContent = generateCSVContent(entityType, totalRecords)
  return csvContent
}

function generatePDFContent(entityType: string, totalRecords: number): Buffer {
  // For demo purposes, return HTML content
  // In production, use puppeteer or jsPDF to generate actual PDF files
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${entityType} Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .info { margin-bottom: 20px; color: #666; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Export</h1>
      <div class="info">
        Generated on: ${new Date().toLocaleDateString()}<br>
        Total Records: ${totalRecords}
      </div>
      <table>
        <tr><th>Sample Data</th><th>Export Preview</th></tr>
        <tr><td>This is a sample PDF export</td><td>Total ${totalRecords} records</td></tr>
      </table>
    </body>
    </html>
  `
  
  return Buffer.from(htmlContent, 'utf8')
}

function generateJSONContent(entityType: string, totalRecords: number): Buffer {
  const sampleData = {
    entityType,
    totalRecords,
    exportDate: new Date().toISOString(),
    data: Array.from({ length: Math.min(totalRecords, 10) }, (_, i) => ({
      id: i + 1,
      name: `Sample ${entityType} ${i + 1}`,
      createdAt: new Date().toISOString()
    }))
  }
  
  return Buffer.from(JSON.stringify(sampleData, null, 2), 'utf8')
}

function getContentType(format: string): string {
  switch (format) {
    case 'CSV':
      return 'text/csv'
    case 'EXCEL':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'PDF':
      return 'application/pdf'
    case 'JSON':
      return 'application/json'
    default:
      return 'text/plain'
  }
}