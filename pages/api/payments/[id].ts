import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid payment ID' })
  }

  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, id)
        break
      case 'PATCH':
        await handlePatch(req, res, id)
        break
      default:
        res.setHeader('Allow', ['GET', 'PATCH'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Payment API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        appointment: {
          include: {
            doctor: {
              include: {
                hospital: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                    contactNumber: true
                  }
                }
              }
            },
            timeSlot: {
              select: {
                date: true,
                startTime: true,
                endTime: true
              }
            },
            bookedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                companyName: true
              }
            }
          }
        }
      }
    })

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    // Transform response to include detailed information
    const paymentDetails = {
      id: payment.id,
      transactionId: payment.transactionId,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      paidAt: payment.paidAt,
      refundedAt: payment.refundedAt,
      refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      
      // Appointment details
      appointment: {
        id: payment.appointment.id,
        appointmentNumber: payment.appointment.appointmentNumber,
        patientName: payment.appointment.patientName,
        patientEmail: payment.appointment.patientEmail,
        patientPhone: payment.appointment.patientPhone,
        appointmentDate: payment.appointment.appointmentDate,
        appointmentTime: payment.appointment.appointmentTime,
        status: payment.appointment.status,
        paymentStatus: payment.appointment.paymentStatus,
        consultationFee: Number(payment.appointment.consultationFee),
        totalAmount: Number(payment.appointment.totalAmount),
        
        doctor: {
          id: payment.appointment.doctor.id,
          name: payment.appointment.doctor.name,
          specialization: payment.appointment.doctor.specialization,
          consultationFee: Number(payment.appointment.doctor.consultationFee)
        },
        
        hospital: payment.appointment.doctor.hospital,
        
        timeSlot: {
          date: payment.appointment.timeSlot.date,
          startTime: payment.appointment.timeSlot.startTime,
          endTime: payment.appointment.timeSlot.endTime
        },
        
        bookedBy: payment.appointment.bookedBy
      },
      
      // Gateway response (sanitized)
      gatewayInfo: payment.gatewayResponse ? {
        authCode: (payment.gatewayResponse as any)?.authCode,
        timestamp: (payment.gatewayResponse as any)?.timestamp,
        status: (payment.gatewayResponse as any)?.status
      } : null
    }

    res.status(200).json({
      data: paymentDetails
    })
  } catch (error) {
    throw error
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { action, ...data } = req.body

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        appointment: true
      }
    })

    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    switch (action) {
      case 'updateStatus':
        return await handleStatusUpdate(res, id, data.status, existingPayment)
      case 'addTransactionId':
        return await handleTransactionIdUpdate(res, id, data.transactionId, existingPayment)
      case 'markAsPaid':
        return await handleMarkAsPaid(res, id, existingPayment)
      case 'cancel':
        return await handleCancelPayment(res, id, data.reason, existingPayment)
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      })
    } else {
      throw error
    }
  }
}

async function handleStatusUpdate(
  res: NextApiResponse, 
  id: string, 
  status: string, 
  existingPayment: any
) {
  const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status',
      validStatuses 
    })
  }

  // Prevent certain status changes
  if (existingPayment.status === 'COMPLETED' && status === 'PENDING') {
    return res.status(409).json({ 
      error: 'Cannot change completed payment back to pending' 
    })
  }

  if (existingPayment.status === 'REFUNDED' && status !== 'REFUNDED') {
    return res.status(409).json({ 
      error: 'Cannot change status of refunded payment' 
    })
  }

  const updateData: any = { status }
  
  // Set timestamps based on status
  if (status === 'COMPLETED' && !existingPayment.paidAt) {
    updateData.paidAt = new Date()
  }

  const updatedPayment = await prisma.$transaction(async (tx) => {
    // Update payment
    const payment = await tx.payment.update({
      where: { id },
      data: updateData,
      include: {
        appointment: true
      }
    })

    // Update appointment payment status
    const appointmentPaymentStatus = status === 'COMPLETED' ? 'COMPLETED' : 
                                   status === 'FAILED' ? 'FAILED' :
                                   'PENDING'

    await tx.appointment.update({
      where: { id: payment.appointmentId },
      data: { paymentStatus: appointmentPaymentStatus }
    })

    return payment
  })

  res.status(200).json({
    message: `Payment status updated to ${status}`,
    data: {
      id: updatedPayment.id,
      status: updatedPayment.status,
      paidAt: updatedPayment.paidAt,
      updatedAt: updatedPayment.updatedAt
    }
  })
}

async function handleTransactionIdUpdate(
  res: NextApiResponse, 
  id: string, 
  transactionId: string, 
  existingPayment: any
) {
  if (!transactionId) {
    return res.status(400).json({ error: 'Transaction ID is required' })
  }

  // Check if transaction ID already exists
  const existingTransaction = await prisma.payment.findFirst({
    where: {
      transactionId,
      id: { not: id }
    }
  })

  if (existingTransaction) {
    return res.status(409).json({ 
      error: 'Transaction ID already exists',
      existingPaymentId: existingTransaction.id
    })
  }

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: { transactionId }
  })

  res.status(200).json({
    message: 'Transaction ID updated successfully',
    data: {
      id: updatedPayment.id,
      transactionId: updatedPayment.transactionId,
      updatedAt: updatedPayment.updatedAt
    }
  })
}

async function handleMarkAsPaid(
  res: NextApiResponse, 
  id: string, 
  existingPayment: any
) {
  if (existingPayment.status === 'COMPLETED') {
    return res.status(409).json({ error: 'Payment is already marked as paid' })
  }

  if (existingPayment.status === 'REFUNDED' || existingPayment.status === 'CANCELLED') {
    return res.status(409).json({ 
      error: `Cannot mark ${existingPayment.status.toLowerCase()} payment as paid` 
    })
  }

  const updatedPayment = await prisma.$transaction(async (tx) => {
    // Update payment
    const payment = await tx.payment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date()
      }
    })

    // Update appointment payment status
    await tx.appointment.update({
      where: { id: payment.appointmentId },
      data: { paymentStatus: 'COMPLETED' }
    })

    return payment
  })

  res.status(200).json({
    message: 'Payment marked as paid successfully',
    data: {
      id: updatedPayment.id,
      status: updatedPayment.status,
      paidAt: updatedPayment.paidAt,
      updatedAt: updatedPayment.updatedAt
    }
  })
}

async function handleCancelPayment(
  res: NextApiResponse, 
  id: string, 
  reason: string, 
  existingPayment: any
) {
  if (!reason) {
    return res.status(400).json({ error: 'Cancellation reason is required' })
  }

  if (existingPayment.status === 'COMPLETED') {
    return res.status(409).json({ 
      error: 'Cannot cancel completed payment. Use refund instead.' 
    })
  }

  if (existingPayment.status === 'REFUNDED') {
    return res.status(409).json({ error: 'Payment is already refunded' })
  }

  const updatedPayment = await prisma.$transaction(async (tx) => {
    // Update payment
    const payment = await tx.payment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        gatewayResponse: {
          ...(existingPayment.gatewayResponse as any || {}),
          cancellationReason: reason,
          cancelledAt: new Date().toISOString()
        }
      }
    })

    // Update appointment payment status
    await tx.appointment.update({
      where: { id: payment.appointmentId },
      data: { paymentStatus: 'CANCELLED' }
    })

    return payment
  })

  res.status(200).json({
    message: 'Payment cancelled successfully',
    data: {
      id: updatedPayment.id,
      status: updatedPayment.status,
      cancellationReason: reason,
      updatedAt: updatedPayment.updatedAt
    }
  })
}