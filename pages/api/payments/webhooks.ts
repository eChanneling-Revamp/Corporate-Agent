import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Configuration for webhook verification
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'your-webhook-secret'
const SUPPORTED_GATEWAYS = ['stripe', 'paypal', 'square', 'razorpay', 'custom']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    await handleWebhook(req, res)
  } catch (error) {
    console.error('Payment webhook error:', error)
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handleWebhook(req: NextApiRequest, res: NextApiResponse) {
  const { gateway } = req.query
  const signature = req.headers['x-webhook-signature'] as string
  const timestamp = req.headers['x-webhook-timestamp'] as string
  
  if (!gateway || !SUPPORTED_GATEWAYS.includes(gateway as string)) {
    return res.status(400).json({ 
      error: 'Invalid or missing gateway parameter',
      supportedGateways: SUPPORTED_GATEWAYS
    })
  }

  // Verify webhook signature
  if (!verifyWebhookSignature(req.body, signature, timestamp)) {
    return res.status(401).json({ error: 'Invalid webhook signature' })
  }

  const webhookData = req.body
  const eventType = webhookData.type || webhookData.event_type

  console.log(`Processing ${gateway} webhook: ${eventType}`)

  try {
    switch (eventType) {
      case 'payment.succeeded':
      case 'payment_intent.succeeded':
      case 'charge.succeeded':
        await handlePaymentSuccess(webhookData, gateway as string)
        break
        
      case 'payment.failed':
      case 'payment_intent.payment_failed':
      case 'charge.failed':
        await handlePaymentFailure(webhookData, gateway as string)
        break
        
      case 'payment.refunded':
      case 'charge.refunded':
      case 'refund.created':
        await handleRefundSuccess(webhookData, gateway as string)
        break
        
      case 'payment.cancelled':
      case 'payment_intent.canceled':
        await handlePaymentCancellation(webhookData, gateway as string)
        break
        
      case 'payment.dispute':
      case 'charge.dispute.created':
        await handlePaymentDispute(webhookData, gateway as string)
        break
        
      default:
        console.log(`Unhandled webhook event: ${eventType}`)
        // Still return success to prevent webhook retries
        break
    }

    // Log webhook for audit trail
    await logWebhookEvent(gateway as string, eventType, webhookData, 'SUCCESS')

    res.status(200).json({ 
      received: true, 
      processed: true,
      eventType 
    })
  } catch (error) {
    // Log failed webhook
    await logWebhookEvent(gateway as string, eventType, webhookData, 'FAILED', error)
    
    res.status(500).json({ 
      received: true, 
      processed: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    })
  }
}

function verifyWebhookSignature(payload: any, signature: string, timestamp: string): boolean {
  if (!signature || !timestamp) {
    return false
  }

  // Implement signature verification based on your payment gateway
  // This is a simplified example - replace with actual gateway verification
  const payloadString = JSON.stringify(payload)
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(timestamp + payloadString)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

async function handlePaymentSuccess(webhookData: any, gateway: string) {
  const transactionId = getTransactionId(webhookData, gateway)
  const amount = getAmount(webhookData, gateway)
  const currency = getCurrency(webhookData, gateway)

  console.log(`Processing successful payment: ${transactionId}`)

  // Find payment by transaction ID
  const payment = await prisma.payment.findFirst({
    where: { transactionId },
    include: { appointment: true }
  })

  if (!payment) {
    console.warn(`Payment not found for transaction ID: ${transactionId}`)
    return
  }

  if (payment.status === 'COMPLETED') {
    console.log(`Payment ${payment.id} already marked as completed`)
    return
  }

  // Update payment and appointment
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        gatewayResponse: {
          ...(payment.gatewayResponse as any || {}),
          webhook: {
            gateway,
            eventType: 'payment.succeeded',
            amount,
            currency,
            processedAt: new Date().toISOString(),
            rawData: webhookData
          }
        }
      }
    })

    await tx.appointment.update({
      where: { id: payment.appointmentId },
      data: { paymentStatus: 'COMPLETED' }
    })
  })

  // Send confirmation notifications
  await sendPaymentSuccessNotification(payment)
}

async function handlePaymentFailure(webhookData: any, gateway: string) {
  const transactionId = getTransactionId(webhookData, gateway)
  const failureReason = getFailureReason(webhookData, gateway)

  console.log(`Processing failed payment: ${transactionId}`)

  const payment = await prisma.payment.findFirst({
    where: { transactionId },
    include: { appointment: true }
  })

  if (!payment) {
    console.warn(`Payment not found for transaction ID: ${transactionId}`)
    return
  }

  // Update payment status
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        gatewayResponse: {
          ...(payment.gatewayResponse as any || {}),
          webhook: {
            gateway,
            eventType: 'payment.failed',
            failureReason,
            processedAt: new Date().toISOString(),
            rawData: webhookData
          }
        }
      }
    })

    await tx.appointment.update({
      where: { id: payment.appointmentId },
      data: { paymentStatus: 'FAILED' }
    })
  })

  // Send failure notifications
  await sendPaymentFailureNotification(payment, failureReason)
}

async function handleRefundSuccess(webhookData: any, gateway: string) {
  const transactionId = getOriginalTransactionId(webhookData, gateway)
  const refundTransactionId = getRefundTransactionId(webhookData, gateway)
  const refundAmount = getRefundAmount(webhookData, gateway)

  console.log(`Processing refund: ${refundTransactionId} for original: ${transactionId}`)

  const payment = await prisma.payment.findFirst({
    where: { transactionId },
    include: { appointment: true }
  })

  if (!payment) {
    console.warn(`Payment not found for transaction ID: ${transactionId}`)
    return
  }

  // Update payment with refund information
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'REFUNDED',
      refundedAt: new Date(),
      refundAmount: refundAmount || payment.amount,
      gatewayResponse: {
        ...(payment.gatewayResponse as any || {}),
        webhook: {
          gateway,
          eventType: 'refund.succeeded',
          refundTransactionId,
          refundAmount,
          processedAt: new Date().toISOString(),
          rawData: webhookData
        }
      }
    }
  })

  // Send refund confirmation
  await sendRefundSuccessNotification(payment, refundAmount || Number(payment.amount))
}

async function handlePaymentCancellation(webhookData: any, gateway: string) {
  const transactionId = getTransactionId(webhookData, gateway)

  console.log(`Processing cancelled payment: ${transactionId}`)

  const payment = await prisma.payment.findFirst({
    where: { transactionId },
    include: { appointment: true }
  })

  if (!payment) {
    console.warn(`Payment not found for transaction ID: ${transactionId}`)
    return
  }

  // Update payment status
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CANCELLED',
        gatewayResponse: {
          ...(payment.gatewayResponse as any || {}),
          webhook: {
            gateway,
            eventType: 'payment.cancelled',
            processedAt: new Date().toISOString(),
            rawData: webhookData
          }
        }
      }
    })

    await tx.appointment.update({
      where: { id: payment.appointmentId },
      data: { paymentStatus: 'CANCELLED' }
    })
  })
}

async function handlePaymentDispute(webhookData: any, gateway: string) {
  const transactionId = getTransactionId(webhookData, gateway)
  const disputeReason = getDisputeReason(webhookData, gateway)

  console.log(`Processing payment dispute: ${transactionId}`)

  const payment = await prisma.payment.findFirst({
    where: { transactionId },
    include: { appointment: true }
  })

  if (!payment) {
    console.warn(`Payment not found for transaction ID: ${transactionId}`)
    return
  }

  // Update payment with dispute information
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      gatewayResponse: {
        ...(payment.gatewayResponse as any || {}),
        dispute: {
          gateway,
          disputeReason,
          disputeId: webhookData.dispute?.id || webhookData.id,
          processedAt: new Date().toISOString(),
          rawData: webhookData
        }
      }
    }
  })

  // Send dispute notification to admin
  await sendDisputeNotification(payment, disputeReason)
}

async function logWebhookEvent(
  gateway: string,
  eventType: string,
  data: any,
  status: string,
  error?: any
) {
  try {
    // In a real application, you might want to store webhook logs in a separate table
    console.log(`Webhook log: ${gateway} - ${eventType} - ${status}`)
    
    if (error) {
      console.error(`Webhook error details:`, error)
    }

    // You could store this in a webhook_logs table for audit purposes
    // await prisma.webhookLog.create({
    //   data: {
    //     gateway,
    //     eventType,
    //     status,
    //     data,
    //     error: error?.message,
    //     processedAt: new Date()
    //   }
    // })
  } catch (logError) {
    console.error('Failed to log webhook event:', logError)
  }
}

// Helper functions to extract data from different gateway formats
function getTransactionId(webhookData: any, gateway: string): string {
  switch (gateway) {
    case 'stripe':
      return webhookData.data?.object?.id || webhookData.id
    case 'paypal':
      return webhookData.resource?.id
    case 'razorpay':
      return webhookData.payload?.payment?.entity?.id
    default:
      return webhookData.transaction_id || webhookData.id
  }
}

function getAmount(webhookData: any, gateway: string): number {
  switch (gateway) {
    case 'stripe':
      return (webhookData.data?.object?.amount || 0) / 100 // Stripe uses cents
    case 'paypal':
      return parseFloat(webhookData.resource?.amount?.total || '0')
    case 'razorpay':
      return (webhookData.payload?.payment?.entity?.amount || 0) / 100
    default:
      return webhookData.amount || 0
  }
}

function getCurrency(webhookData: any, gateway: string): string {
  switch (gateway) {
    case 'stripe':
      return webhookData.data?.object?.currency || 'usd'
    case 'paypal':
      return webhookData.resource?.amount?.currency || 'USD'
    case 'razorpay':
      return webhookData.payload?.payment?.entity?.currency || 'INR'
    default:
      return webhookData.currency || 'LKR'
  }
}

function getFailureReason(webhookData: any, gateway: string): string {
  switch (gateway) {
    case 'stripe':
      return webhookData.data?.object?.last_payment_error?.message || 'Payment failed'
    case 'paypal':
      return webhookData.resource?.failure_reason || 'Payment failed'
    case 'razorpay':
      return webhookData.payload?.payment?.entity?.error_description || 'Payment failed'
    default:
      return webhookData.failure_reason || 'Payment failed'
  }
}

function getOriginalTransactionId(webhookData: any, gateway: string): string {
  switch (gateway) {
    case 'stripe':
      return webhookData.data?.object?.charge || webhookData.data?.object?.payment_intent
    case 'paypal':
      return webhookData.resource?.sale_id
    default:
      return webhookData.original_transaction_id || webhookData.transaction_id
  }
}

function getRefundTransactionId(webhookData: any, gateway: string): string {
  switch (gateway) {
    case 'stripe':
      return webhookData.data?.object?.id
    case 'paypal':
      return webhookData.resource?.id
    default:
      return webhookData.refund_transaction_id || webhookData.id
  }
}

function getRefundAmount(webhookData: any, gateway: string): number {
  switch (gateway) {
    case 'stripe':
      return (webhookData.data?.object?.amount || 0) / 100
    case 'paypal':
      return parseFloat(webhookData.resource?.amount?.total || '0')
    default:
      return webhookData.refund_amount || 0
  }
}

function getDisputeReason(webhookData: any, gateway: string): string {
  switch (gateway) {
    case 'stripe':
      return webhookData.data?.object?.reason || 'Dispute raised'
    case 'paypal':
      return webhookData.resource?.reason || 'Dispute raised'
    default:
      return webhookData.dispute_reason || 'Dispute raised'
  }
}

// Notification functions (implement based on your notification system)
async function sendPaymentSuccessNotification(payment: any) {
  console.log(`Sending payment success notification for payment ${payment.id}`)
  // Implement notification logic
}

async function sendPaymentFailureNotification(payment: any, reason: string) {
  console.log(`Sending payment failure notification for payment ${payment.id}: ${reason}`)
  // Implement notification logic
}

async function sendRefundSuccessNotification(payment: any, refundAmount: number) {
  console.log(`Sending refund success notification for payment ${payment.id}: ${refundAmount}`)
  // Implement notification logic
}

async function sendDisputeNotification(payment: any, reason: string) {
  console.log(`Sending dispute notification for payment ${payment.id}: ${reason}`)
  // Implement notification logic
}

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}