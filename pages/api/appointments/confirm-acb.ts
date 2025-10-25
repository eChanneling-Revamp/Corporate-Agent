import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { AppointmentStatus, PaymentStatus } from '@prisma/client'

// ACB (Advance Cash Back) Appointment Confirmation Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method Not Allowed' 
    })
  }

  try {
    const { appointmentIds, agentId, confirmationType = 'ACB_CONFIRMATION' } = req.body

    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Appointment IDs are required' 
      })
    }

    // Fetch unpaid appointments that qualify for ACB
    const unpaidAppointments = await prisma.appointment.findMany({
      where: {
        id: { in: appointmentIds },
        paymentStatus: 'PENDING',
        status: 'CONFIRMED' as any // Use UNPAID when enum is available
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true,
            consultationFee: true
          }
        },
        hospital: {
          select: {
            name: true,
            contactNumber: true
          }
        }
      }
    })

    if (unpaidAppointments.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No eligible ACB appointments found' 
      })
    }

    // Update appointments to confirmed with ACB status
    const updatedAppointments = await Promise.all(
      unpaidAppointments.map(async (appointment) => {
        const updated = await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: 'CONFIRMED' as any,
            paymentStatus: 'PENDING' as any, // Keep as pending for ACB
            notes: appointment.notes 
              ? `${appointment.notes}\n[ACB Confirmation by Agent ${agentId}]`
              : `ACB Confirmation by Agent ${agentId}`
          },
          include: {
            doctor: true,
            hospital: true
          }
        })

        // Log ACB confirmation activity
        await prisma.activityLog.create({
          data: {
            userId: agentId,
            action: 'ACB_APPOINTMENT_CONFIRMED',
            entityType: 'APPOINTMENT',
            entityId: appointment.id,
            details: {
              appointmentNumber: appointment.appointmentNumber,
              doctorName: updated.doctor?.name,
              hospitalName: updated.hospital?.name,
              consultationFee: updated.doctor?.consultationFee,
              confirmationType: 'ACB'
            },
            ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown'
          }
        })

        return updated
      })
    )

    // Generate ACB confirmation response
    const acbConfirmations = updatedAppointments.map(appointment => ({
      appointmentId: appointment.id,
      acbConfirmationNumber: `ACB-${Date.now()}-${appointment.id.substring(0, 8)}`,
      patientName: appointment.patientName,
      doctorName: appointment.doctor?.name,
      hospitalName: appointment.hospital?.name,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      consultationFee: appointment.doctor?.consultationFee || 0,
      status: 'ACB_CONFIRMED'
    }))

    // TODO: Trigger SMS and Email notifications here
    // await sendACBConfirmationSMS(updatedAppointments)
    // await sendACBConfirmationEmail(updatedAppointments)

    return res.status(200).json({
      success: true,
      data: {
        message: `${updatedAppointments.length} ACB appointments confirmed successfully`,
        confirmedAppointments: acbConfirmations,
        summary: {
          totalConfirmed: updatedAppointments.length,
          totalAmount: updatedAppointments.reduce((sum, apt) => 
            sum + Number(apt.doctor?.consultationFee || 0), 0),
          confirmationType: 'ACB',
          confirmedBy: agentId,
          confirmationDate: new Date()
        }
      }
    })

  } catch (error) {
    console.error('ACB Confirmation Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}