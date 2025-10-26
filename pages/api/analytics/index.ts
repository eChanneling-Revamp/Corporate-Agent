import { NextApiRequest, NextApiResponse } from 'next'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

const analyticsParamsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  doctorId: z.string().optional(),
  hospitalId: z.string().optional(),
  period: z.enum(['today', 'week', 'month', 'year']).optional()
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }

  try {
    const { startDate, endDate, doctorId, hospitalId, period } = analyticsParamsSchema.parse(req.query)

    // Calculate date range based on period
    let fromDate: Date
    let toDate: Date = new Date()

    if (startDate && endDate) {
      fromDate = new Date(startDate)
      toDate = new Date(endDate)
    } else {
      switch (period) {
        case 'today':
          fromDate = new Date()
          fromDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          fromDate = new Date()
          fromDate.setDate(fromDate.getDate() - 7)
          break
        case 'month':
          fromDate = new Date()
          fromDate.setMonth(fromDate.getMonth() - 1)
          break
        case 'year':
          fromDate = new Date()
          fromDate.setFullYear(fromDate.getFullYear() - 1)
          break
        default:
          fromDate = new Date()
          fromDate.setDate(fromDate.getDate() - 30) // Default to last 30 days
      }
    }

    // Build filters
    const baseFilter = {
      createdAt: {
        gte: fromDate,
        lte: toDate
      },
      ...(doctorId && { doctorId }),
      ...(hospitalId && { hospitalId })
    }

    // Get appointments data
    const [
      totalAppointments,
      confirmedAppointments,
      cancelledAppointments,
      completedAppointments,
      pendingAppointments,
      topDoctors,
      topHospitals
    ] = await Promise.all([
      // Basic counts
      prisma.appointment.count({ where: baseFilter }),
      prisma.appointment.count({ where: { ...baseFilter, status: 'CONFIRMED' } }),
      prisma.appointment.count({ where: { ...baseFilter, status: 'CANCELLED' } }),
      prisma.appointment.count({ where: { ...baseFilter, status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { ...baseFilter, status: 'PENDING' } }),
      
      // Top doctors
      prisma.appointment.groupBy({
        by: ['doctorId'],
        where: baseFilter,
        _count: { doctorId: true },
        orderBy: { _count: { doctorId: 'desc' } },
        take: 10
      }),
      
      // Top hospitals
      prisma.appointment.groupBy({
        by: ['hospitalId'],
        where: baseFilter,
        _count: { hospitalId: true },
        orderBy: { _count: { hospitalId: 'desc' } },
        take: 10
      })
    ])

    // Get doctor and hospital details
    const doctorIds = topDoctors.map(item => item.doctorId)
    const hospitalIds = topHospitals.map(item => item.hospitalId)

    const [doctors, hospitals] = await Promise.all([
      prisma.doctor.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, name: true, specialization: true }
      }),
      
      prisma.hospital.findMany({
        where: { id: { in: hospitalIds } },
        select: { id: true, name: true, address: true, city: true }
      })
    ])

    // Format response data
    const analytics = {
      summary: {
        totalAppointments,
        confirmedAppointments,
        cancelledAppointments,
        completedAppointments,
        pendingAppointments,
        confirmationRate: totalAppointments > 0 ? Math.round((confirmedAppointments / totalAppointments) * 100) : 0,
        cancellationRate: totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0,
        completionRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0
      },
      
      topDoctors: topDoctors.map(item => {
        const doctor = doctors.find(d => d.id === item.doctorId)
        return {
          doctorId: item.doctorId,
          name: doctor?.name || 'Unknown Doctor',
          specialization: doctor?.specialization || 'Unknown',
          appointmentCount: item._count.doctorId
        }
      }),
      
      topHospitals: topHospitals.map(item => {
        const hospital = hospitals.find(h => h.id === item.hospitalId)
        return {
          hospitalId: item.hospitalId,
          name: hospital?.name || 'Unknown Hospital',
          location: hospital ? `${hospital.city}, ${hospital.address}` : 'Unknown Location',
          appointmentCount: item._count.hospitalId
        }
      }),
      
      dateRange: {
        from: fromDate,
        to: toDate
      }
    }

    res.status(200).json(apiResponse.success(analytics, 'Analytics retrieved successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

export default requireAuth(handler)
