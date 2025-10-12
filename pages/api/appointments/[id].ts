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

    const { id } = req.query
    const agentId = (session.user as any).id

    if (!agentId) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid appointment ID' })
    }

    switch (req.method) {
      case 'GET':
        // Get single appointment
        try {
          const appointment = await prisma.appointment.findFirst({
            where: {
              id: id,
              agentId: agentId
            },
            include: {
              agent: true
            }
          })

          if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' })
          }

          return res.status(200).json({
            appointment: appointment
          })
        } catch (error) {
          console.error('Get appointment error:', error)
          return res.status(500).json({ error: 'Failed to fetch appointment' })
        }

      case 'PUT':
        // Update appointment
        try {
          const { sessionDate, sessionTime, patientName, patientPhone } = req.body

          const appointment = await prisma.appointment.findFirst({
            where: {
              id: id,
              agentId: agentId
            }
          })

          if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' })
          }

          const updatedAppointment = await prisma.appointment.update({
            where: { id: id },
            data: {
              ...(sessionDate && { sessionDate: new Date(sessionDate) }),
              ...(sessionTime && { sessionTime }),
              ...(patientName && { patientName }),
              ...(patientPhone && { patientPhone }),
              updatedAt: new Date()
            },
            include: {
              agent: true
            }
          })

          return res.status(200).json({
            message: 'Appointment updated successfully',
            appointment: updatedAppointment
          })
        } catch (error) {
          console.error('Update appointment error:', error)
          return res.status(500).json({ error: 'Failed to update appointment' })
        }

      case 'DELETE':
        // Cancel/Delete appointment
        try {
          const appointment = await prisma.appointment.findFirst({
            where: {
              id: id,
              agentId: agentId
            }
          })

          if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' })
          }

          // Update status to CANCELLED instead of actually deleting
          const cancelledAppointment = await prisma.appointment.update({
            where: { id: id },
            data: {
              status: 'CANCELLED',
              updatedAt: new Date()
            }
          })

          return res.status(200).json({
            message: 'Appointment cancelled successfully',
            appointment: cancelledAppointment
          })
        } catch (error) {
          console.error('Cancel appointment error:', error)
          return res.status(500).json({ error: 'Failed to cancel appointment' })
        }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Appointment API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}