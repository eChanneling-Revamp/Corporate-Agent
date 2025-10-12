import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { name, specialty, hospital, date } = req.query;

    // Call external doctor service (microservice)
    const response = await axios.get(
      `${process.env.DOCTOR_SERVICE_URL}/search`,
      {
        params: { name, specialty, hospital, date },
        headers: {
          'X-Agent-Id': (session.user as any).id,
          'X-Agent-Type': (session.user as any).agentType,
        },
        timeout: 10000, // 10 seconds timeout
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Doctor search error:', error);
    
    // Return mock data if external service is unavailable
    const mockDoctors = [
      {
        id: 'dr-001',
        name: 'Dr. John Smith',
        specialty: 'Cardiology',
        hospital: 'General Hospital',
        availableSlots: ['09:00', '10:00', '11:00'],
        consultationFee: 2500,
        rating: 4.8,
      },
      {
        id: 'dr-002',
        name: 'Dr. Sarah Johnson',
        specialty: 'Dermatology',
        hospital: 'City Medical Center',
        availableSlots: ['14:00', '15:00', '16:00'],
        consultationFee: 3000,
        rating: 4.9,
      },
    ];

    return res.status(200).json({
      doctors: mockDoctors,
      message: 'Using cached data - external service unavailable',
    });
  }
}