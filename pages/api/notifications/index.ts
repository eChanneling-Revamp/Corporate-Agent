import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

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
      const { unreadOnly = 'false', limit = '50' } = req.query;

      const where: any = {
        agentId: (session.user as any).id,
      };

      if (unreadOnly === 'true') {
        where.isRead = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      });

      const unreadCount = await prisma.notification.count({
        where: {
          agentId: (session.user as any).id,
          isRead: false,
        },
      });

      return res.status(200).json({
        notifications,
        unreadCount,
      });
    } catch (error: any) {
      console.error('Get notifications error:', error);
      return res.status(500).json({
        message: 'Failed to fetch notifications',
        error: error.message,
      });
    }
  } else if (req.method === 'PUT') {
    try {
      const { notificationId } = req.body;

      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Update notification error:', error);
      return res.status(500).json({
        message: 'Failed to update notification',
        error: error.message,
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}