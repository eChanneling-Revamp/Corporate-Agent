import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '../../../lib/prisma'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'

const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().min(0).optional(),
  reason: z.string().min(1, 'Refund reason is required')
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
    }

    return await processRefund(req, res)
  } catch (error) {
    return handleApiError(error, res)
  }
}

async function processRefund(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = refundSchema.parse(req.body)
    const { paymentId, amount, reason } = validatedData

    // Mock refund processing for development
    const mockRefund = {
      refundId: `re_${Date.now()}`,
      paymentId,
      amount: amount || 3500,
      status: 'REFUNDED',
      refundedAt: new Date(),
      reason,
      transactionId: `ref_${Date.now()}`
    }

    return res.status(200).json(apiResponse.success(mockRefund, 'Refund processed successfully'))

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(apiResponse.error('Validation error', 400, error.issues))
    }
    throw error
  }
}

export default requireAuth(handler)