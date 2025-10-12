import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Transactions API called')
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.email) {
      console.log('No session or email found, returning 401')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }

    console.log('Transactions API called')
    console.log('Session user:', session.user)

    // Use agent ID directly from session like the working appointments API
    const agentId = (session.user as any).id
    
    if (!agentId) {
      console.log('Transactions API: No agent ID in session')
      return res.status(404).json({ error: 'Agent not found' })
    }

    console.log('Transactions API: Using agent ID from session:', agentId)

    // Parse query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit
    const status = req.query.status as string
    const type = req.query.type as string
    console.log('Transactions API: Parameters parsed')

    // Build where clause for filtering
    const where: any = {
      agentId: agentId
    }

    if (status) {
      where.paymentStatus = status.toUpperCase()
    }

    if (type) {
      where.appointmentType = type.toUpperCase()
    }

    console.log('Transactions API: About to query database with where clause:', where)
    // Get transactions (appointments with payment info)
    const transactions = await prisma.appointment.findMany({
      where,
      select: {
        id: true,
        appointmentNumber: true,
        patientName: true,
        patientEmail: true,
        patientPhone: true,
        doctorName: true,
        specialty: true,
        hospitalName: true,
        sessionDate: true,
        sessionTime: true,
        appointmentType: true,
        status: true,
        paymentStatus: true,
        amount: true,
        refundAmount: true,
        refundStatus: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    console.log('Transactions API: Query completed, found transactions:', transactions.length)

    // Get total count for pagination
    const totalCount = await prisma.appointment.count({
      where
    })
    console.log('Transactions API: Total count:', totalCount)

    // Calculate transaction summary
    const summary = await prisma.appointment.aggregate({
      where: {
        agentId: agentId,
        paymentStatus: 'PAID'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    const response = {
      transactions: transactions.map(transaction => ({
        id: transaction.id,
        transactionId: transaction.appointmentNumber,
        patientName: transaction.patientName,
        patientEmail: transaction.patientEmail,
        patientPhone: transaction.patientPhone,
        doctorName: transaction.doctorName,
        specialty: transaction.specialty,
        hospitalName: transaction.hospitalName,
        date: transaction.sessionDate,
        time: transaction.sessionTime,
        type: transaction.appointmentType,
        status: transaction.status,
        paymentStatus: transaction.paymentStatus,
        amount: transaction.amount,
        refundAmount: transaction.refundAmount,
        refundStatus: transaction.refundStatus,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      },
      summary: {
        totalRevenue: summary._sum.amount || 0,
        totalTransactions: summary._count.id || 0,
        averageTransaction: summary._count.id > 0 ? (summary._sum.amount || 0) / summary._count.id : 0
      }
    }

    console.log('Transactions API: About to return response with', response.transactions.length, 'items')
    console.log('Transactions API: Calling res.status(200).json()')
    return res.status(200).json(response)
    
  } catch (error) {
    console.error('Transactions API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}