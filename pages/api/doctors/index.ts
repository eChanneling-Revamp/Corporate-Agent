import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

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
        search, 
        specialization, 
        hospital, 
        minFee, 
        maxFee, 
        page = 1, 
        limit = 10 
      } = req.query;

      // Build where conditions
      const where: any = {
        isActive: true
      };

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { specialization: { contains: search as string, mode: 'insensitive' } },
          { hospital: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (specialization) {
        where.specialization = {
          equals: specialization as string,
          mode: 'insensitive'
        };
      }

      if (hospital) {
        where.hospital = {
          equals: hospital as string,
          mode: 'insensitive'
        };
      }

      if (minFee || maxFee) {
        where.fee = {};
        if (minFee) where.fee.gte = parseFloat(minFee as string);
        if (maxFee) where.fee.lte = parseFloat(maxFee as string);
      }

      // Calculate pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Get doctors with pagination
      const [doctors, total] = await Promise.all([
        prisma.doctor.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: [
            { rating: 'desc' },
            { name: 'asc' }
          ]
        }),
        prisma.doctor.count({ where })
      ]);

      // Transform data for frontend compatibility
      const transformedDoctors = doctors.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        location: doctor.location,
        fee: doctor.fee,
        rating: doctor.rating,
        availability: doctor.availableSlots,
        image: doctor.image || '/api/placeholder/150/150',
        experience: doctor.experience,
        qualifications: doctor.qualifications,
        bio: doctor.bio,
        consultationTypes: doctor.consultationTypes,
        workingDays: doctor.workingDays
      }));

      return res.status(200).json({
        doctors: transformedDoctors,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: total > skip + limitNum
      });
    } catch (error: any) {
      console.error('Get doctors error:', error);
      return res.status(500).json({
        message: 'Failed to fetch doctors',
        error: error.message,
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}