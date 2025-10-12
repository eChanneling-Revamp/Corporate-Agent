import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }

    console.log('Reports analytics API called')
    console.log('Session user:', session.user)

    // Use agent ID directly from session like the working appointments API
    const agentId = (session.user as any).id
    
    if (!agentId) {
      console.log('Reports analytics API: No agent ID in session')
      return res.status(404).json({ error: 'Agent not found' })
    }

    console.log('Reports analytics API: Using agent ID from session:', agentId)

    // Get the last 6 months for monthly chart data
    const monthlyData = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      // Get appointments count for the month
      const appointmentCount = await prisma.appointment.count({
        where: {
          agentId: agentId,
          sessionDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      // Get revenue for the month
      const revenue = await prisma.appointment.aggregate({
        where: {
          agentId: agentId,
          sessionDate: {
            gte: startDate,
            lte: endDate
          },
          paymentStatus: 'PAID'
        },
        _sum: {
          amount: true
        }
      })

      monthlyData.push({
        name: startDate.toLocaleDateString('en-US', { month: 'short' }),
        appointments: appointmentCount,
        revenue: revenue._sum.amount || 0
      })
    }

    // Get specialty distribution
    const specialtyData = await prisma.appointment.groupBy({
      by: ['specialty'],
      where: {
        agentId: agentId,
        sessionDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1) // This month only
        }
      },
      _count: {
        specialty: true
      },
      orderBy: {
        _count: {
          specialty: 'desc'
        }
      },
      take: 5
    })

    const specialtyChartData = specialtyData.map((item, index) => ({
      name: item.specialty,
      value: item._count.specialty,
      color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'][index] || '#8dd1e1'
    }))

    // Get hospital distribution
    const hospitalData = await prisma.appointment.groupBy({
      by: ['hospitalName'],
      where: {
        agentId: agentId,
        sessionDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      },
      _count: {
        hospitalName: true
      },
      _sum: {
        amount: true
      },
      orderBy: {
        _count: {
          hospitalName: 'desc'
        }
      },
      take: 4
    })

    const hospitalChartData = hospitalData.map(item => ({
      name: item.hospitalName,
      appointments: item._count.hospitalName,
      revenue: item._sum.amount || 0
    }))

    // Get overall stats
    const totalAppointments = await prisma.appointment.count({
      where: { agentId: agentId }
    })

    const totalRevenue = await prisma.appointment.aggregate({
      where: {
        agentId: agentId,
        paymentStatus: 'PAID'
      },
      _sum: {
        amount: true
      }
    })

    const totalCommission = (totalRevenue._sum.amount || 0) * 0.05 // 5% commission

    const pendingAmount = await prisma.appointment.aggregate({
      where: {
        agentId: agentId,
        paymentStatus: 'PENDING'
      },
      _sum: {
        amount: true
      }
    })

    return res.status(200).json({
      monthlyData,
      specialtyData: specialtyChartData,
      hospitalData: hospitalChartData,
      summary: {
        totalTransactions: totalAppointments,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalCommission,
        pendingAmount: pendingAmount._sum.amount || 0
      }
    })
    
  } catch (error) {
    console.error('Analytics API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}