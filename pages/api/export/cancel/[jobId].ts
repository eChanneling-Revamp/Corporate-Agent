import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

// Cancel Export Job API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }

  try {
    const { jobId } = req.query
    const { userId } = req.body

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      })
    }

    // Get export job
    const exportJob = await prisma.exportJob.findUnique({
      where: { jobId }
    })

    if (!exportJob) {
      return res.status(404).json({
        success: false,
        message: 'Export job not found'
      })
    }

    // Check if user has permission to cancel (should be the creator or admin)
    if (exportJob.exportedBy !== userId) {
      // In production, also check for admin role
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this export'
      })
    }

    // Check if export can be cancelled
    if (exportJob.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed export'
      })
    }

    if (exportJob.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Export is already cancelled'
      })
    }

    // Update export job status to cancelled
    const updatedJob = await prisma.exportJob.update({
      where: { jobId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
        errorMessage: 'Cancelled by user'
      }
    })

    // Log cancellation activity
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: 'EXPORT_CANCELLED',
        entityType: 'EXPORT',
        entityId: jobId,
        details: {
          originalStatus: exportJob.status,
          entityType: exportJob.entityType,
          format: exportJob.format,
          totalRecords: exportJob.totalRecords
        }
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Export job cancelled successfully',
      data: {
        jobId: updatedJob.jobId,
        status: updatedJob.status
      }
    })

  } catch (error) {
    console.error('Cancel Export Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}