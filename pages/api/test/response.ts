import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Test endpoint to check API response structure
  const mockResponse = {
    success: true,
    data: {
      appointments: [
        {
          id: '1',
          appointmentNumber: 'APT001',
          patientName: 'John Doe',
          patientEmail: 'john.doe@email.com',
          patientPhone: '+94771234567',
          doctorId: '1',
          hospitalId: 'hospital-1',
          appointmentDate: new Date().toISOString().split('T')[0],
          appointmentTime: '10:00',
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          consultationFee: 5000,
          totalAmount: 5000,
          createdAt: new Date().toISOString(),
          doctor: { name: 'Dr. John Smith' },
          hospital: { name: 'Apollo Hospital' }
        }
      ]
    },
    message: 'Test response'
  }

  res.status(200).json(mockResponse)
}