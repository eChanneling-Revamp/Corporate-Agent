import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const paymentCreateSchema = z.object({
  appointmentId: z.string().cuid(),
  amount: z.number().min(0),
  currency: z.string().default('LKR'),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'MOBILE_PAYMENT']),
  gatewayData: z.object({
    cardNumber: z.string().optional(),
    cardHolderName: z.string().optional(),
    expiryMonth: z.string().optional(),
    expiryYear: z.string().optional(),
    cvv: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankName: z.string().optional(),
    mobileNumber: z.string().optional(),
    paymentToken: z.string().optional()
  }).optional()
})

const paymentFiltersSchema = z.object({
  appointmentId: z.string().cuid().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'MOBILE_PAYMENT']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountFrom: z.string().transform(val => parseFloat(val)).optional(),
  amountTo: z.string().transform(val => parseFloat(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional().default(50),
  offset: z.string().transform(val => parseInt(val)).optional().default(0)
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res)
        break
      case 'POST':
        await handlePost(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Payments API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedFilters = paymentFiltersSchema.parse(req.query)
    
    const {
      appointmentId,
      status,
      paymentMethod,
      dateFrom,
      dateTo,
      amountFrom,
      amountTo,
      limit,
      offset
    } = validatedFilters

    // Build where clause
    const where: any = {}
    
    if (appointmentId) {
      where.appointmentId = appointmentId
    }
    
    if (status) {
      where.status = status
    }
    
    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    
    if (amountFrom !== undefined || amountTo !== undefined) {
      where.amount = {}
      if (amountFrom !== undefined) where.amount.gte = amountFrom
      if (amountTo !== undefined) where.amount.lte = amountTo
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        appointment: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true
              }
            },
            hospital: {
              select: {
                id: true,
                name: true
              }
            },
            bookedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Transform data for security - remove sensitive information
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      appointmentId: payment.appointmentId,
      appointmentNumber: payment.appointment.appointmentNumber,
      patientName: payment.appointment.patientName,
      doctorName: payment.appointment.doctor.name,
      hospitalName: payment.appointment.hospital.name,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt,
      refundedAt: payment.refundedAt,
      refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      bookedBy: payment.appointment.bookedBy
    }))

    // Get total count for pagination
    const totalCount = await prisma.payment.count({ where })

    // Calculate summary statistics
    const summary = await calculatePaymentSummary(where)

    res.status(200).json({
      data: transformedPayments,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary
    })
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

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = paymentCreateSchema.parse(req.body)
    
    const {
      appointmentId,
      amount,
      currency,
      paymentMethod,
      gatewayData
    } = validatedData

    // Verify appointment exists and check payment requirements
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        payments: true,
        doctor: {
          select: {
            name: true,
            consultationFee: true
          }
        }
      }
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    // Check if appointment is in valid state for payment
    if (appointment.status === 'CANCELLED') {
      return res.status(409).json({ 
        error: 'Cannot process payment for cancelled appointment' 
      })
    }

    // Check if payment already exists and is successful
    const existingSuccessfulPayment = appointment.payments.find(
      p => p.status === 'COMPLETED'
    )

    if (existingSuccessfulPayment) {
      return res.status(409).json({ 
        error: 'Payment already completed for this appointment',
        existingPayment: {
          id: existingSuccessfulPayment.id,
          transactionId: existingSuccessfulPayment.transactionId,
          paidAt: existingSuccessfulPayment.paidAt
        }
      })
    }

    // Validate payment amount matches appointment fee
    const expectedAmount = Number(appointment.totalAmount)
    if (Math.abs(amount - expectedAmount) > 0.01) {
      return res.status(400).json({ 
        error: 'Payment amount does not match appointment fee',
        expectedAmount,
        providedAmount: amount
      })
    }

    // Process payment based on method
    let paymentResult
    try {
      paymentResult = await processPayment(paymentMethod, amount, currency, gatewayData)
    } catch (paymentError) {
      // Create failed payment record
      const failedPayment = await prisma.payment.create({
        data: {
          appointmentId,
          amount,
          currency,
          paymentMethod,
          status: 'FAILED',
          gatewayResponse: {
            error: paymentError instanceof Error ? paymentError.message : 'Payment processing failed',
            timestamp: new Date().toISOString()
          }
        },
        include: {
          appointment: {
            include: {
              doctor: {
                select: {
                  name: true
                }
              },
              hospital: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      return res.status(402).json({
        error: 'Payment failed',
        message: paymentError instanceof Error ? paymentError.message : 'Unknown payment error',
        payment: {
          id: failedPayment.id,
          status: failedPayment.status,
          amount: Number(failedPayment.amount),
          paymentMethod: failedPayment.paymentMethod,
          createdAt: failedPayment.createdAt
        }
      })
    }

    // Create successful payment record
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment record
      const newPayment = await tx.payment.create({
        data: {
          appointmentId,
          amount,
          currency,
          paymentMethod,
          transactionId: paymentResult.transactionId,
          status: 'COMPLETED',
          paidAt: new Date(),
          gatewayResponse: paymentResult.gatewayResponse
        },
        include: {
          appointment: {
            include: {
              doctor: {
                select: {
                  name: true
                }
              },
              hospital: {
                select: {
                  name: true
                }
              },
              bookedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      // Update appointment payment status
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { paymentStatus: 'COMPLETED' }
      })

      return newPayment
    })

    // Send payment confirmation (in a real app, this would be async)
    await sendPaymentConfirmation(payment)

    res.status(201).json({
      message: 'Payment processed successfully',
      data: {
        id: payment.id,
        appointmentId: payment.appointmentId,
        appointmentNumber: payment.appointment.appointmentNumber,
        patientName: payment.appointment.patientName,
        doctorName: payment.appointment.doctor.name,
        hospitalName: payment.appointment.hospital.name,
        amount: Number(payment.amount),
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt
      }
    })
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

async function calculatePaymentSummary(where: any) {
  const [
    totalPayments,
    completedPayments,
    pendingPayments,
    failedPayments,
    refundedPayments,
    totalAmount,
    completedAmount,
    refundedAmount
  ] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.payment.count({ where: { ...where, status: 'PENDING' } }),
    prisma.payment.count({ where: { ...where, status: 'FAILED' } }),
    prisma.payment.count({ where: { ...where, status: 'REFUNDED' } }),
    prisma.payment.aggregate({
      where,
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: { ...where, status: 'REFUNDED' },
      _sum: { refundAmount: true }
    })
  ])

  return {
    totalPayments,
    completedPayments,
    pendingPayments,
    failedPayments,
    refundedPayments,
    totalAmount: Number(totalAmount._sum.amount || 0),
    completedAmount: Number(completedAmount._sum.amount || 0),
    refundedAmount: Number(refundedAmount._sum.refundAmount || 0),
    successRate: totalPayments > 0 ? Math.round((completedPayments / totalPayments) * 100) : 0
  }
}

// Mock payment processing function - replace with actual payment gateway integration
async function processPayment(
  paymentMethod: string, 
  amount: number, 
  currency: string, 
  gatewayData?: any
) {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Simulate different payment scenarios
  const random = Math.random()
  
  if (random < 0.05) { // 5% failure rate
    throw new Error('Insufficient funds')
  }
  
  if (random < 0.1) { // Additional 5% failure rate
    throw new Error('Card declined by issuer')
  }

  // Generate mock transaction ID
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return {
    transactionId,
    gatewayResponse: {
      success: true,
      transactionId,
      authCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
      timestamp: new Date().toISOString(),
      paymentMethod,
      amount,
      currency,
      status: 'COMPLETED'
    }
  }
}

// Mock payment confirmation function
async function sendPaymentConfirmation(payment: any) {
  // In a real application, this would send email/SMS notifications
  console.log(`Payment confirmation sent for payment ${payment.id}`)
  
  // You could integrate with email service, SMS service, etc.
  return Promise.resolve()
}