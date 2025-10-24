import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }

  try {
    const { period = 'today' } = req.query

    // Get date range based on period
    const now = new Date()
    let startDate: Date
    let endDate = new Date()

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    // Get statistics
    const [
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      completedAppointments,
      totalDoctors,
      activeDoctors,
      totalHospitals,
      recentAppointments
    ] = await Promise.all([
      // Total appointments in period
      prisma.appointment.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Today's appointments
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        }
      }),

      // Pending appointments
      prisma.appointment.count({
        where: {
          status: 'CONFIRMED',
          appointmentDate: { gte: now }
        }
      }),

      // Completed appointments
      prisma.appointment.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Total doctors
      prisma.doctor.count(),

      // Active doctors (with appointments in last 30 days)
      prisma.doctor.count({
        where: {
          isActive: true,
          appointments: {
            some: {
              createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
            }
          }
        }
      }),

      // Total hospitals
      prisma.hospital.count({ where: { isActive: true } }),

      // Recent appointments for activity feed
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { select: { name: true, specialization: true } },
          hospital: { select: { name: true } }
        }
      })
    ])

    // Calculate revenue (sum of completed appointments)
    const revenueData = await prisma.appointment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: {
        totalAmount: true
      }
    })

    const todayRevenueData = await prisma.appointment.aggregate({
      where: {
        status: 'COMPLETED',
        appointmentDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      },
      _sum: {
        totalAmount: true
      }
    })

    // Get unique patients count
    const uniquePatients = await prisma.appointment.findMany({
      select: { patientEmail: true },
      distinct: ['patientEmail'],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    })

    // Calculate average rating
    const avgRating = await prisma.doctor.aggregate({
      where: { isActive: true },
      _avg: { rating: true }
    })

    const stats = {
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      completedAppointments,
      totalRevenue: Number(revenueData._sum.totalAmount || 0),
      todayRevenue: Number(todayRevenueData._sum.totalAmount || 0),
      activePatients: uniquePatients.length,
      totalDoctors,
      activeDoctors,
      totalHospitals,
      averageRating: Number(avgRating._avg.rating || 0),
      conversionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
      recentActivities: recentAppointments.map(apt => ({
        id: apt.id,
        type: 'APPOINTMENT_BOOKED',
        title: `New appointment booked`,
        description: `${apt.patientName} booked with ${apt.doctor?.name} (${apt.doctor?.specialization})`,
        timestamp: apt.createdAt.toISOString(),
        entityId: apt.id
      }))
    }

    res.status(200).json(apiResponse.success(stats, 'Dashboard statistics retrieved successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

export default requireAuth(handler)