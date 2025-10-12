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

    // Get agent ID
    const agent = await prisma.agent.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    const agentId = agent.id
    
    const { status, method, page = 1, limit = 10, search } = req.query

    // Build where conditions
    const where: any = {
      agentId: agentId
    }

    if (status) {
      where.status = status as string
    }

    if (method) {
      where.paymentMethod = method as string
    }

    // Calculate pagination
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.transaction.count({ where })
    ])

    // Get related appointment details for each transaction
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction) => {
        const appointmentIds = transaction.appointmentIds as string[]
        
        // Get appointments for this transaction
        const appointments = await prisma.appointment.findMany({
          where: {
            id: {
              in: appointmentIds
            }
          },
          select: {
            id: true,
            patientName: true,
            doctorName: true,
            hospitalName: true,
            sessionDate: true,
            sessionTime: true,
            amount: true
          }
        })

        return {
          id: transaction.id,
          transactionId: transaction.transactionId,
          amount: transaction.amount,
          currency: transaction.currency,
          paymentMethod: transaction.paymentMethod,
          status: transaction.status,
          createdAt: transaction.createdAt,
          appointments: appointments,
          appointmentCount: appointments.length,
          // For compatibility with frontend
          patientName: appointments[0]?.patientName || 'Multiple Patients',
          doctorName: appointments[0]?.doctorName || 'Multiple Doctors',
          hospitalName: appointments[0]?.hospitalName || 'Multiple Hospitals',
          date: transaction.createdAt.toISOString().split('T')[0],
          time: transaction.createdAt.toTimeString().split(' ')[0]
        }
      })
    )

    return res.status(200).json({
      transactions: transactionsWithDetails,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: total > skip + limitNum
    })
    
  } catch (error) {
    console.error('Transactions API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}