import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const refundRequestSchema = z.object({
  paymentId: z.string().cuid(),
  amount: z.number().min(0).optional(), // Partial refund amount, if not provided, full refund
  reason: z.string().min(5).max(500),
  refundMethod: z.enum(['ORIGINAL_PAYMENT_METHOD', 'BANK_TRANSFER', 'STORE_CREDIT']).optional().default('ORIGINAL_PAYMENT_METHOD'),
  bankDetails: z.object({
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    accountHolderName: z.string().optional(),
    routingNumber: z.string().optional()
  }).optional()
})

const refundFiltersSchema = z.object({
  paymentId: z.string().cuid().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
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
    console.error('Refund API error:', error)
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
    const validatedFilters = refundFiltersSchema.parse(req.query)
    
    const {
      paymentId,
      status,
      dateFrom,
      dateTo,
      limit,
      offset
    } = validatedFilters

    // Build where clause for refunded payments
    const where: any = {
      status: 'REFUNDED'
    }
    
    if (paymentId) {
      where.id = paymentId
    }
    
    if (dateFrom || dateTo) {
      where.refundedAt = {}
      if (dateFrom) where.refundedAt.gte = new Date(dateFrom)
      if (dateTo) where.refundedAt.lte = new Date(dateTo)
    }

    const refundedPayments = await prisma.payment.findMany({
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
        refundedAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Transform data to include refund-specific information
    const transformedRefunds = refundedPayments.map(payment => ({
      id: payment.id,
      refundId: `REF_${payment.id.slice(-8)}`,
      appointmentId: payment.appointmentId,
      appointmentNumber: payment.appointment.appointmentNumber,
      patientName: payment.appointment.patientName,
      doctorName: payment.appointment.doctor.name,
      hospitalName: payment.appointment.hospital.name,
      originalAmount: Number(payment.amount),
      refundAmount: Number(payment.refundAmount || 0),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      refundedAt: payment.refundedAt,
      refundReason: (payment.gatewayResponse as any)?.refundReason || null,
      refundMethod: (payment.gatewayResponse as any)?.refundMethod || 'ORIGINAL_PAYMENT_METHOD',
      refundStatus: getRefundStatus(payment),
      transactionId: payment.transactionId,
      refundTransactionId: (payment.gatewayResponse as any)?.refundTransactionId || null,
      createdAt: payment.createdAt,
      bookedBy: payment.appointment.bookedBy
    }))

    // Get total count for pagination
    const totalCount = await prisma.payment.count({ where })

    // Calculate refund summary
    const summary = await calculateRefundSummary(where)

    res.status(200).json({
      data: transformedRefunds,
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
    const validatedData = refundRequestSchema.parse(req.body)
    
    const {
      paymentId,
      amount,
      reason,
      refundMethod,
      bankDetails
    } = validatedData

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    // Validate payment can be refunded
    if (payment.status !== 'COMPLETED') {
      return res.status(409).json({ 
        error: 'Only completed payments can be refunded',
        currentStatus: payment.status
      })
    }

    if (payment.refundedAt) {
      return res.status(409).json({ 
        error: 'Payment has already been refunded',
        refundedAt: payment.refundedAt,
        refundAmount: Number(payment.refundAmount || 0)
      })
    }

    // Validate refund amount
    const originalAmount = Number(payment.amount)
    const refundAmount = amount || originalAmount
    
    if (refundAmount > originalAmount) {
      return res.status(400).json({ 
        error: 'Refund amount cannot exceed original payment amount',
        originalAmount,
        requestedRefundAmount: refundAmount
      })
    }

    if (refundAmount <= 0) {
      return res.status(400).json({ error: 'Refund amount must be greater than 0' })
    }

    // Check appointment cancellation policy (business rule)
    const appointmentDate = new Date(payment.appointment.appointmentDate)
    const now = new Date()
    const timeDifference = appointmentDate.getTime() - now.getTime()
    const hoursUntilAppointment = timeDifference / (1000 * 3600)

    let refundPercentage = 100
    let refundPolicyMessage = ''

    // Apply refund policy based on timing
    if (hoursUntilAppointment < 24) {
      refundPercentage = 50 // 50% refund for cancellations within 24 hours
      refundPolicyMessage = 'Reduced refund due to late cancellation (within 24 hours)'
    } else if (hoursUntilAppointment < 48) {
      refundPercentage = 75 // 75% refund for cancellations within 48 hours
      refundPolicyMessage = 'Reduced refund due to cancellation within 48 hours'
    }

    const policyAdjustedRefundAmount = Math.round((refundAmount * refundPercentage) / 100)

    // Process refund
    let refundResult
    try {
      refundResult = await processRefund(
        payment.transactionId!, 
        policyAdjustedRefundAmount, 
        payment.currency,
        refundMethod,
        bankDetails
      )
    } catch (refundError) {
      return res.status(502).json({
        error: 'Refund processing failed',
        message: refundError instanceof Error ? refundError.message : 'Unknown refund error'
      })
    }

    // Update payment record
    const updatedPayment = await prisma.$transaction(async (tx) => {
      // Update payment with refund information
      const refundedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount: policyAdjustedRefundAmount,
          gatewayResponse: {
            ...(payment.gatewayResponse as any || {}),
            refund: {
              refundTransactionId: refundResult.refundTransactionId,
              refundAmount: policyAdjustedRefundAmount,
              refundMethod,
              refundReason: reason,
              refundPolicy: {
                originalAmount: refundAmount,
                policyPercentage: refundPercentage,
                policyMessage: refundPolicyMessage,
                finalAmount: policyAdjustedRefundAmount
              },
              processedAt: new Date().toISOString(),
              gatewayResponse: refundResult.gatewayResponse
            }
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

      // Update appointment status if fully refunded
      if (policyAdjustedRefundAmount === originalAmount) {
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: { 
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED',
            cancellationReason: reason,
            cancellationDate: new Date()
          }
        })
      }

      return refundedPayment
    })

    // Send refund confirmation
    await sendRefundConfirmation(updatedPayment, refundResult)

    res.status(200).json({
      message: 'Refund processed successfully',
      data: {
        refundId: `REF_${updatedPayment.id.slice(-8)}`,
        paymentId: updatedPayment.id,
        appointmentNumber: updatedPayment.appointment.appointmentNumber,
        patientName: updatedPayment.appointment.patientName,
        originalAmount: Number(payment.amount),
        refundAmount: policyAdjustedRefundAmount,
        currency: updatedPayment.currency,
        refundMethod,
        refundTransactionId: refundResult.refundTransactionId,
        refundedAt: updatedPayment.refundedAt,
        refundPolicy: {
          appliedPercentage: refundPercentage,
          policyMessage: refundPolicyMessage
        }
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

async function calculateRefundSummary(where: any) {
  const [
    totalRefunds,
    totalRefundAmount,
    averageRefundAmount,
    refundsThisMonth
  ] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      where,
      _sum: { refundAmount: true }
    }),
    prisma.payment.aggregate({
      where,
      _avg: { refundAmount: true }
    }),
    prisma.payment.count({
      where: {
        ...where,
        refundedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })
  ])

  return {
    totalRefunds,
    totalRefundAmount: Number(totalRefundAmount._sum.refundAmount || 0),
    averageRefundAmount: Number(averageRefundAmount._avg.refundAmount || 0),
    refundsThisMonth
  }
}

function getRefundStatus(payment: any): string {
  if (!payment.refundedAt) return 'NOT_REFUNDED'
  
  const refundData = (payment.gatewayResponse as any)?.refund
  if (!refundData) return 'COMPLETED'
  
  return refundData.gatewayResponse?.status || 'COMPLETED'
}

// Mock refund processing function - replace with actual payment gateway integration
async function processRefund(
  originalTransactionId: string,
  refundAmount: number,
  currency: string,
  refundMethod: string,
  bankDetails?: any
) {
  // Simulate refund processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Simulate different refund scenarios
  const random = Math.random()
  
  if (random < 0.02) { // 2% failure rate
    throw new Error('Refund failed: Original transaction not found')
  }
  
  if (random < 0.05) { // Additional 3% failure rate
    throw new Error('Refund failed: Insufficient merchant balance')
  }

  // Generate mock refund transaction ID
  const refundTransactionId = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return {
    refundTransactionId,
    gatewayResponse: {
      success: true,
      refundTransactionId,
      originalTransactionId,
      refundAmount,
      currency,
      refundMethod,
      status: 'COMPLETED',
      processedAt: new Date().toISOString(),
      expectedSettlement: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
    }
  }
}

// Mock refund confirmation function
async function sendRefundConfirmation(payment: any, refundResult: any) {
  // In a real application, this would send email/SMS notifications
  console.log(`Refund confirmation sent for payment ${payment.id}`)
  
  return Promise.resolve()
}