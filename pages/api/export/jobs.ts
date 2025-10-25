import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// Export Jobs Management API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getExportJobs(req, res)
  } else {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }
}

// Get export jobs
async function getExportJobs(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      userId, 
      status, 
      entityType, 
      format,
      page = 1, 
      limit = 20 
    } = req.query

    // Build where clause
    const where: any = {}
    
    if (userId) {
      where.exportedBy = userId as string
    }
    
    if (status) {
      where.status = status as string
    }
    
    if (entityType) {
      where.entityType = entityType as string
    }
    
    if (format) {
      where.format = format as string
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit)

    // Get export jobs with pagination
    const [jobs, totalCount] = await Promise.all([
      prisma.exportJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.exportJob.count({ where })
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / Number(limit))
    const hasNext = Number(page) < totalPages
    const hasPrev = Number(page) > 1

    return res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount,
          hasNext,
          hasPrev,
          limit: Number(limit)
        }
      }
    })

  } catch (error) {
    console.error('Get Export Jobs Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}