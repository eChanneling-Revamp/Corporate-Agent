import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Dashboard stats API called')
    const session = await getServerSession(req, res, authOptions)
    console.log('Session:', session ? 'Found' : 'Not found')
    
    if (!session?.user?.email) {
      console.log('No session or email found, returning 401')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }

    console.log('Dashboard stats API called')
    console.log('Session user:', session.user)
    
    // Use agent ID directly from session like the working appointments API
    const agentId = (session.user as any).id
    
    if (!agentId) {
      console.log('Dashboard stats API: No agent ID in session')
      return res.status(404).json({ error: 'Agent not found' })
    }

    console.log('Dashboard stats API: Using agent ID from session:', agentId)

    // Get current date ranges
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    console.log('Date ranges calculated')

    // Get today's appointments
    const todayAppointments = await prisma.appointment.count({
      where: {
        agentId: agentId,
        sessionDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    // Get pending confirmations
    const pendingConfirmations = await prisma.appointment.count({
      where: {
        agentId: agentId,
        status: 'PENDING'
      }
    })

    // Get this month's revenue
    const monthlyRevenue = await prisma.appointment.aggregate({
      where: {
        agentId: agentId,
        sessionDate: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        paymentStatus: 'PAID'
      },
      _sum: {
        amount: true
      }
    })

    // Get active sessions (simplified - just count of today's confirmed appointments)
    const activeSessions = await prisma.appointment.count({
      where: {
        agentId: agentId,
        sessionDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'CONFIRMED'
      }
    })

    // Calculate previous month for comparison
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    const prevMonthRevenue = await prisma.appointment.aggregate({
      where: {
        agentId: agentId,
        sessionDate: {
          gte: prevMonthStart,
          lte: prevMonthEnd
        },
        paymentStatus: 'PAID'
      },
      _sum: {
        amount: true
      }
    })

    // Calculate revenue change
    const currentRevenue = monthlyRevenue._sum.amount || 0
    const previousRevenue = prevMonthRevenue._sum.amount || 0
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : currentRevenue > 0 ? '100' : '0'

    const responseData = {
      todayAppointments,
      pendingConfirmations,
      monthlyRevenue: currentRevenue,
      activeSessions,
      revenueChange: `${revenueChange}%`,
      stats: {
        totalAppointments: todayAppointments + pendingConfirmations,
        totalRevenue: currentRevenue
      }
    }

    console.log('About to return dashboard stats:', responseData)
    return res.status(200).json(responseData)
    
  } catch (error) {
    console.error('Dashboard stats API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}