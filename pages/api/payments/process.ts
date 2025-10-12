import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { appointmentIds, amount, paymentMethod, cardDetails } = req.body;

    if (!appointmentIds || appointmentIds.length === 0) {
      return res.status(400).json({ message: 'No appointments provided' });
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        transactionId: `TXN-${Date.now()}-${uuidv4().slice(0, 8)}`,
        amount,
        currency: 'LKR',
        paymentMethod,
        status: 'PENDING',
        agentId: (session.user as any).id,
        appointmentIds,
      },
    });

    // Process payment through gateway (mock implementation)
    let paymentResponse;
    try {
      // Mock payment processing - in real implementation, call actual payment gateway
      const mockPaymentSuccess = Math.random() > 0.1; // 90% success rate
      
      if (mockPaymentSuccess) {
        paymentResponse = {
          data: {
            status: 'success',
            transactionId: transaction.transactionId,
            gatewayTransactionId: `GW-${Date.now()}`,
            message: 'Payment processed successfully',
          }
        };
      } else {
        throw new Error('Payment gateway declined the transaction');
      }

      // Update transaction with gateway response
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: paymentResponse.data.status === 'success' ? 'PAID' : 'FAILED',
          gatewayResponse: paymentResponse.data,
        },
      });

      // Update appointments if payment successful
      if (paymentResponse.data.status === 'success') {
        await prisma.appointment.updateMany({
          where: { id: { in: appointmentIds } },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
          },
        });

        // Send confirmation SMS/Email
        // await sendConfirmationNotifications(appointmentIds);
      }

      return res.status(200).json({
        success: paymentResponse.data.status === 'success',
        transaction,
        paymentResponse: paymentResponse.data,
      });
    } catch (paymentError: any) {
      // Update transaction as failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          gatewayResponse: { error: paymentError.message } as any,
        },
      });

      return res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        error: paymentError.message,
      });
    }
  } catch (error: any) {
    console.error('Payment error:', error);
    return res.status(500).json({
      message: 'Failed to process payment',
      error: error.message,
    });
  }
}