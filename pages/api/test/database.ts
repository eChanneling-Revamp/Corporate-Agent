import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Test database connection
    const hospitalCount = await prisma.hospital.count()
    const doctorCount = await prisma.doctor.count()
    const timeSlotCount = await prisma.timeSlot.count()
    
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      data: {
        hospitals: hospitalCount,
        doctors: doctorCount,
        timeSlots: timeSlotCount
      }
    })
  } catch (error) {
    console.error('Database test error:', error)
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}