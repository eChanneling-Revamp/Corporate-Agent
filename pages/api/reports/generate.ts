import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// Enhanced Reporting System API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await generateReport(req, res)
    case 'POST':
      return await scheduleReport(req, res)
    default:
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      })
  }
}

// Generate report based on type and parameters
async function generateReport(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      type, // 'appointment_summary', 'revenue_analysis', 'agent_performance', 'corporate_utilization', 'operational_metrics'
      startDate,
      endDate,
      agentId,
      corporateId,
      doctorId,
      hospitalId,
      format = 'json', // 'json', 'csv', 'pdf'
      groupBy = 'day', // 'day', 'week', 'month'
      includeCharts = false
    } = req.query

    // Validate required parameters
    if (!type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Report type, start date, and end date are required'
      })
    }

    const start = new Date(startDate as string)
    const end = new Date(endDate as string)

    let reportData: any = {}

    switch (type) {
      case 'appointment_summary':
        reportData = await generateAppointmentSummary(start, end, { agentId, doctorId, hospitalId, groupBy })
        break
      case 'revenue_analysis':
        reportData = await generateRevenueAnalysis(start, end, { agentId, corporateId, groupBy })
        break
      case 'agent_performance':
        reportData = await generateAgentPerformance(start, end, { agentId })
        break
      case 'corporate_utilization':
        reportData = await generateCorporateUtilization(start, end, { corporateId })
        break
      case 'operational_metrics':
        reportData = await generateOperationalMetrics(start, end, { groupBy })
        break
      default:
        return res.status(400).json({
          success: false,
          message: `Unsupported report type: ${type}`
        })
    }

    // Add report metadata
    const report = {
      metadata: {
        reportType: type,
        generatedAt: new Date(),
        dateRange: { startDate: start, endDate: end },
        parameters: { agentId, corporateId, doctorId, hospitalId, groupBy },
        format,
        recordCount: reportData.summary?.totalRecords || 0
      },
      summary: reportData.summary,
      data: reportData.data,
      charts: includeCharts === 'true' ? reportData.charts : undefined
    }

    // Log report generation
    await prisma.activityLog.create({
      data: {
        userId: agentId as string || 'system',
        action: 'REPORT_GENERATED',
        entityType: 'REPORT',
        entityId: `${type}_${Date.now()}`,
        details: {
          reportType: type,
          dateRange: { startDate, endDate },
          format,
          recordCount: report.metadata.recordCount
        },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    })

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${type}_${startDate}_${endDate}.csv"`)
      return res.send(convertToCSV(reportData.data))
    }

    return res.status(200).json({
      success: true,
      report
    })

  } catch (error) {
    console.error('Generate Report Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Generate appointment summary report
async function generateAppointmentSummary(startDate: Date, endDate: Date, params: any) {
  const { agentId, doctorId, hospitalId, groupBy } = params

  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  if (agentId) where.bookedById = agentId
  if (doctorId) where.doctorId = doctorId
  if (hospitalId) where.hospitalId = hospitalId

  // Get appointments with details
  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      doctor: { select: { name: true, specialization: true } },
      hospital: { select: { name: true } },
      bookedBy: { select: { name: true, email: true } },
      payments: { select: { amount: true, status: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Group by time period
  const groupedData = groupAppointmentsByPeriod(appointments, groupBy)

  // Calculate summary statistics
  const summary = {
    totalAppointments: appointments.length,
    confirmedAppointments: appointments.filter(a => a.status === 'CONFIRMED').length,
    cancelledAppointments: appointments.filter(a => a.status === 'CANCELLED').length,
    completedAppointments: appointments.filter(a => a.status === 'COMPLETED').length,
    totalRevenue: appointments.reduce((sum, a) => sum + Number(a.consultationFee), 0),
    averageAppointmentsPerDay: appointments.length / getDaysBetween(startDate, endDate),
    topDoctors: getTopDoctors(appointments, 5),
    topHospitals: getTopHospitals(appointments, 5),
    statusDistribution: getStatusDistribution(appointments)
  }

  return {
    summary,
    data: groupedData,
    charts: generateAppointmentCharts(appointments, groupedData)
  }
}

// Generate revenue analysis report
async function generateRevenueAnalysis(startDate: Date, endDate: Date, params: any) {
  const { agentId, corporateId, groupBy } = params

  const paymentWhere: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    },
    status: 'COMPLETED'
  }

  const appointmentWhere: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  if (agentId) appointmentWhere.bookedById = agentId
  if (corporateId) appointmentWhere.bookedById = corporateId

  // Get completed payments
  const payments = await prisma.payment.findMany({
    where: paymentWhere,
    include: {
      appointment: {
        include: {
          doctor: { select: { name: true, specialization: true } },
          hospital: { select: { name: true } },
          bookedBy: { select: { name: true, role: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Group revenue by period
  const groupedRevenue = groupRevenueByPeriod(payments, groupBy)

  const summary = {
    totalRevenue: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    totalPayments: payments.length,
    averagePaymentAmount: payments.length > 0 ? 
      payments.reduce((sum, p) => sum + Number(p.amount), 0) / payments.length : 0,
    revenueByPaymentMethod: getRevenueByPaymentMethod(payments),
    revenueByDoctor: getRevenueByDoctor(payments, 10),
    revenueByHospital: getRevenueByHospital(payments, 10),
    corporateRevenue: getCorporateRevenue(payments),
    dailyAverageRevenue: payments.length > 0 ? 
      payments.reduce((sum, p) => sum + Number(p.amount), 0) / getDaysBetween(startDate, endDate) : 0
  }

  return {
    summary,
    data: groupedRevenue,
    charts: generateRevenueCharts(payments, groupedRevenue)
  }
}

// Generate agent performance report
async function generateAgentPerformance(startDate: Date, endDate: Date, params: any) {
  const { agentId } = params

  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  if (agentId) {
    where.bookedById = agentId
  } else {
    // Get all agents
    where.bookedBy = {
      role: 'AGENT'
    }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      bookedBy: { select: { id: true, name: true, email: true } },
      payments: { select: { amount: true, status: true } }
    }
  })

  // Group by agent
  const agentPerformance = appointments.reduce((acc, appointment) => {
    const agentKey = appointment.bookedBy.id
    if (!acc[agentKey]) {
      acc[agentKey] = {
        agent: appointment.bookedBy,
        totalBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0
      }
    }

    acc[agentKey].totalBookings++
    if (appointment.status === 'CONFIRMED') acc[agentKey].confirmedBookings++
    if (appointment.status === 'CANCELLED') acc[agentKey].cancelledBookings++
    if (appointment.status === 'COMPLETED') acc[agentKey].completedBookings++
    
    const paidAmount = appointment.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    
    acc[agentKey].totalRevenue += paidAmount
    acc[agentKey].averageBookingValue = acc[agentKey].totalRevenue / acc[agentKey].totalBookings

    return acc
  }, {} as any)

  const performanceArray = Object.values(agentPerformance)
  
  const summary = {
    totalAgents: performanceArray.length,
    totalBookings: appointments.length,
    averageBookingsPerAgent: appointments.length / (performanceArray.length || 1),
    topPerformers: performanceArray
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5),
    conversionRates: performanceArray.map((agent: any) => ({
      agent: agent.agent.name,
      conversionRate: agent.totalBookings > 0 ? 
        (agent.completedBookings / agent.totalBookings) * 100 : 0
    }))
  }

  return {
    summary,
    data: performanceArray,
    charts: generatePerformanceCharts(performanceArray)
  }
}

// Generate corporate utilization report
async function generateCorporateUtilization(startDate: Date, endDate: Date, params: any) {
  const { corporateId } = params

  const packageWhere: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  if (corporateId) packageWhere.corporateId = corporateId

  const packages = await prisma.corporatePackage.findMany({
    where: packageWhere,
    include: {
      corporate: { select: { name: true, email: true, contactNumber: true } },
      packageAppointments: {
        include: {
          appointment: {
            select: {
              appointmentNumber: true,
              patientName: true,
              appointmentDate: true,
              status: true,
              consultationFee: true
            }
          }
        }
      },
      packageBenefits: true
    }
  })

  const utilizationData = packages.map(pkg => {
    const utilizationRate = pkg.totalAppointments > 0 ? 
      (pkg.usedAppointments / pkg.totalAppointments) * 100 : 0
    
    return {
      packageId: pkg.id,
      packageNumber: pkg.packageNumber,
      corporate: pkg.corporate,
      packageType: pkg.packageType,
      totalAppointments: pkg.totalAppointments,
      usedAppointments: pkg.usedAppointments,
      remainingAppointments: pkg.remainingAppointments,
      utilizationRate,
      packageValue: Number(pkg.packageValue),
      savings: pkg.packageAppointments.reduce((sum, pa) => 
        sum + (Number(pa.discountApplied) || 0), 0),
      status: pkg.isActive ? 'Active' : 'Inactive'
    }
  })

  const summary = {
    totalPackages: packages.length,
    activePackages: packages.filter(p => p.isActive).length,
    totalAppointments: packages.reduce((sum, p) => sum + p.totalAppointments, 0),
    totalUsedAppointments: packages.reduce((sum, p) => sum + p.usedAppointments, 0),
    averageUtilizationRate: utilizationData.length > 0 ? 
      utilizationData.reduce((sum, d) => sum + d.utilizationRate, 0) / utilizationData.length : 0,
    totalPackageValue: packages.reduce((sum, p) => sum + Number(p.packageValue), 0),
    totalSavings: utilizationData.reduce((sum, d) => sum + d.savings, 0)
  }

  return {
    summary,
    data: utilizationData,
    charts: generateUtilizationCharts(utilizationData)
  }
}

// Generate operational metrics report
async function generateOperationalMetrics(startDate: Date, endDate: Date, params: any) {
  const { groupBy } = params

  // Get various operational metrics
  const [
    totalAppointments,
    totalPayments,
    totalUsers,
    avgWaitTime,
    peakHours,
    systemUsage
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.payment.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED'
      }
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.appointment.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        estimatedWaitTime: { not: null }
      },
      _avg: { estimatedWaitTime: true }
    }),
    getBookingPatterns(startDate, endDate),
    getSystemUsageMetrics(startDate, endDate)
  ])

  const summary = {
    totalAppointments,
    totalPayments,
    totalNewUsers: totalUsers,
    averageWaitTime: avgWaitTime._avg.estimatedWaitTime || 0,
    peakBookingHours: peakHours.peakHours,
    systemUptime: systemUsage.uptime,
    averageResponseTime: systemUsage.responseTime
  }

  return {
    summary,
    data: {
      bookingPatterns: peakHours,
      systemMetrics: systemUsage
    },
    charts: generateOperationalCharts(summary)
  }
}

// Schedule report for automatic generation
async function scheduleReport(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      reportType,
      title,
      description,
      parameters,
      schedule, // { frequency: 'daily'|'weekly'|'monthly', time: 'HH:mm', dayOfWeek?: number, dayOfMonth?: number }
      recipients, // Array of email addresses
      format = 'pdf',
      scheduledBy
    } = req.body

    // Validate required fields
    if (!reportType || !title || !schedule || !scheduledBy) {
      return res.status(400).json({
        success: false,
        message: 'Report type, title, schedule, and scheduled by are required'
      })
    }

    // Create scheduled report record
    const scheduledReport = await prisma.report.create({
      data: {
        title,
        type: reportType as any,
        description,
        parameters: parameters || {},
        status: 'PENDING' as any,
        generatedById: scheduledBy,
        scheduledAt: new Date(),
        // Add schedule and recipient details to parameters
        extraData: {
          schedule,
          recipients,
          format,
          autoGenerate: true
        }
      }
    })

    // Log scheduled report creation
    await prisma.activityLog.create({
      data: {
        userId: scheduledBy,
        action: 'REPORT_SCHEDULED',
        entityType: 'REPORT',
        entityId: scheduledReport.id,
        details: {
          reportType,
          title,
          schedule,
          recipients: recipients?.length || 0
        },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    })

    return res.status(201).json({
      success: true,
      data: {
        scheduledReport,
        message: 'Report scheduled successfully'
      }
    })

  } catch (error) {
    console.error('Schedule Report Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Helper functions
function groupAppointmentsByPeriod(appointments: any[], groupBy: string) {
  // Implementation for grouping appointments by day/week/month
  return appointments.reduce((acc, appointment) => {
    const date = new Date(appointment.createdAt)
    let key: string

    switch (groupBy) {
      case 'week':
        key = getWeekKey(date)
        break
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        break
      default: // 'day'
        key = date.toISOString().split('T')[0]
    }

    if (!acc[key]) {
      acc[key] = { date: key, count: 0, appointments: [] }
    }
    
    acc[key].count++
    acc[key].appointments.push(appointment)
    
    return acc
  }, {})
}

function getDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getWeekKey(date: Date): string {
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  return weekStart.toISOString().split('T')[0]
}

function getTopDoctors(appointments: any[], limit: number) {
  const doctorStats = appointments.reduce((acc, apt) => {
    const doctorId = apt.doctorId
    if (!acc[doctorId]) {
      acc[doctorId] = {
        doctor: apt.doctor,
        appointmentCount: 0,
        revenue: 0
      }
    }
    acc[doctorId].appointmentCount++
    acc[doctorId].revenue += Number(apt.consultationFee)
    return acc
  }, {})

  return Object.values(doctorStats)
    .sort((a: any, b: any) => b.appointmentCount - a.appointmentCount)
    .slice(0, limit)
}

function getTopHospitals(appointments: any[], limit: number) {
  const hospitalStats = appointments.reduce((acc, apt) => {
    const hospitalId = apt.hospitalId
    if (!acc[hospitalId]) {
      acc[hospitalId] = {
        hospital: apt.hospital,
        appointmentCount: 0
      }
    }
    acc[hospitalId].appointmentCount++
    return acc
  }, {})

  return Object.values(hospitalStats)
    .sort((a: any, b: any) => b.appointmentCount - a.appointmentCount)
    .slice(0, limit)
}

function getStatusDistribution(appointments: any[]) {
  return appointments.reduce((acc, apt) => {
    const status = apt.status
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})
}

function groupRevenueByPeriod(payments: any[], groupBy: string) {
  return payments.reduce((acc, payment) => {
    const date = new Date(payment.createdAt)
    let key: string

    switch (groupBy) {
      case 'week':
        key = getWeekKey(date)
        break
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }

    if (!acc[key]) {
      acc[key] = { date: key, revenue: 0, payments: [] }
    }
    
    acc[key].revenue += Number(payment.amount)
    acc[key].payments.push(payment)
    
    return acc
  }, {})
}

function getRevenueByPaymentMethod(payments: any[]) {
  return payments.reduce((acc, payment) => {
    const method = payment.paymentMethod
    acc[method] = (acc[method] || 0) + Number(payment.amount)
    return acc
  }, {})
}

function getRevenueByDoctor(payments: any[], limit: number) {
  const doctorRevenue = payments.reduce((acc, payment) => {
    const doctorName = payment.appointment?.doctor?.name || 'Unknown'
    acc[doctorName] = (acc[doctorName] || 0) + Number(payment.amount)
    return acc
  }, {})

  return Object.entries(doctorRevenue)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, limit)
    .map(([doctor, revenue]) => ({ doctor, revenue }))
}

function getRevenueByHospital(payments: any[], limit: number) {
  const hospitalRevenue = payments.reduce((acc, payment) => {
    const hospitalName = payment.appointment?.hospital?.name || 'Unknown'
    acc[hospitalName] = (acc[hospitalName] || 0) + Number(payment.amount)
    return acc
  }, {})

  return Object.entries(hospitalRevenue)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, limit)
    .map(([hospital, revenue]) => ({ hospital, revenue }))
}

function getCorporateRevenue(payments: any[]) {
  return payments
    .filter(p => p.appointment?.bookedBy?.role === 'CORPORATE')
    .reduce((sum, p) => sum + Number(p.amount), 0)
}

async function getBookingPatterns(startDate: Date, endDate: Date) {
  // Get booking patterns by hour
  const appointments = await prisma.appointment.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    select: {
      createdAt: true,
      appointmentTime: true
    }
  })

  const hourlyBookings = appointments.reduce((acc, apt) => {
    const hour = new Date(apt.createdAt).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const peakHour = Object.entries(hourlyBookings)
    .sort(([,a], [,b]) => b - a)[0]

  return {
    hourlyDistribution: hourlyBookings,
    peakHours: peakHour ? `${peakHour[0]}:00` : 'No data',
    totalBookings: appointments.length
  }
}

async function getSystemUsageMetrics(startDate: Date, endDate: Date) {
  // Mock system metrics - in real implementation, get from monitoring system
  return {
    uptime: 99.9,
    responseTime: 245, // ms
    totalRequests: 15420,
    errorRate: 0.1,
    activeUsers: 156
  }
}

function generateAppointmentCharts(appointments: any[], groupedData: any) {
  return {
    appointmentTrends: Object.values(groupedData),
    statusDistribution: getStatusDistribution(appointments),
    doctorPerformance: getTopDoctors(appointments, 10)
  }
}

function generateRevenueCharts(payments: any[], groupedRevenue: any) {
  return {
    revenueTrends: Object.values(groupedRevenue),
    paymentMethods: getRevenueByPaymentMethod(payments),
    topEarningDoctors: getRevenueByDoctor(payments, 10)
  }
}

function generatePerformanceCharts(performanceArray: any[]) {
  return {
    agentComparison: performanceArray.slice(0, 10),
    conversionRates: performanceArray.map(a => ({
      agent: a.agent.name,
      rate: a.totalBookings > 0 ? (a.completedBookings / a.totalBookings) * 100 : 0
    }))
  }
}

function generateUtilizationCharts(utilizationData: any[]) {
  return {
    utilizationRates: utilizationData,
    packageTypes: utilizationData.reduce((acc, d) => {
      acc[d.packageType] = (acc[d.packageType] || 0) + 1
      return acc
    }, {})
  }
}

function generateOperationalCharts(summary: any) {
  return {
    keyMetrics: {
      appointments: summary.totalAppointments,
      payments: summary.totalPayments,
      users: summary.totalNewUsers,
      waitTime: summary.averageWaitTime
    }
  }
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      }).join(',')
    )
  ]
  
  return csvRows.join('\n')
}
