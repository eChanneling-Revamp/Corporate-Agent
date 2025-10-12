import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Testing dashboard stats API without auth...')
    
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }

    // Test with mock data first
    const stats = {
      todayAppointments: 5,
      pendingConfirmations: 3,
      monthlyRevenue: 15000,
      activeSessions: 2,
      revenueChange: '+12.5%',
      stats: {
        totalAppointments: 8,
        totalRevenue: 15000
      }
    }

    console.log('Returning test stats:', stats)
    return res.status(200).json(stats)
    
  } catch (error) {
    console.error('Dashboard stats API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}