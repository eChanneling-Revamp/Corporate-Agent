import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

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
      // Return mock doctors data for now
      // In production, this would fetch from a doctors database or external service
      const doctors = [
        {
          id: 'doc-001',
          name: 'Dr. Sarah Johnson',
          specialty: 'Cardiology',
          hospital: 'City General Hospital',
          consultationFee: 3500,
          availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
          rating: 4.8,
          experience: '15 years',
          qualifications: 'MBBS, MD (Cardiology)'
        },
        {
          id: 'doc-002',
          name: 'Dr. Michael Chen',
          specialty: 'Neurology',
          hospital: 'National Hospital',
          consultationFee: 4000,
          availableSlots: ['08:00', '09:00', '16:00', '17:00'],
          rating: 4.9,
          experience: '12 years',
          qualifications: 'MBBS, MD (Neurology)'
        },
        {
          id: 'doc-003',
          name: 'Dr. Emily Davis',
          specialty: 'Pediatrics',
          hospital: 'Children\'s Hospital',
          consultationFee: 2800,
          availableSlots: ['10:00', '11:00', '14:00', '15:00', '16:00'],
          rating: 4.7,
          experience: '10 years',
          qualifications: 'MBBS, MD (Pediatrics)'
        }
      ];

      return res.status(200).json({
        doctors,
        total: doctors.length,
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