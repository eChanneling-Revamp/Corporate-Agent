import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const pendingACBAppointments = await prisma.aCBAppointment.findMany({
        where: {
          agentId: (session.user as any).id,
          isConfirmed: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        appointments: pendingACBAppointments,
        total: pendingACBAppointments.length,
      });
    } catch (error: any) {
      console.error('Get pending ACB appointments error:', error);
      return res.status(500).json({
        message: 'Failed to fetch pending ACB appointments',
        error: error.message,
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}