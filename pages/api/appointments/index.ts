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
      const {
        page = '1',
        limit = '10',
        status,
        startDate,
        endDate,
        search,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Build filter conditions
      const where: any = {
        agentId: (session.user as any).id,
      };

      if (status) {
        where.status = status;
      }

      if (startDate && endDate) {
        where.sessionDate = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      if (search) {
        where.OR = [
          { appointmentNumber: { contains: search as string, mode: 'insensitive' } },
          { patientName: { contains: search as string, mode: 'insensitive' } },
          { patientPhone: { contains: search as string, mode: 'insensitive' } },
          { doctorName: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.appointment.count({ where }),
      ]);

      return res.status(200).json({
        appointments,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error: any) {
      console.error('Get appointments error:', error);
      return res.status(500).json({
        message: 'Failed to fetch appointments',
        error: error.message,
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}