import { NextApiRequest, NextApiResponse } from 'next'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }

  try {
    // Mock data for pending ACB appointments
    const pendingAcbAppointments = [
      {
        id: '1',
        appointmentNumber: 'ACB001',
        patientName: 'John Doe',
        patientEmail: 'john.doe@email.com',
        patientPhone: '+94771234567',
        doctorName: 'Dr. Smith',
        specialization: 'Cardiology',
        hospital: 'Apollo Hospital',
        hospitalName: 'Apollo Hospital',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:00 AM',
        amount: 5000,
        totalAmount: 5000,
        status: 'PENDING_ACB',
        notes: 'Regular checkup appointment',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        appointmentNumber: 'ACB002',
        patientName: 'Jane Smith',
        patientEmail: 'jane.smith@email.com',
        patientPhone: '+94777654321',
        doctorName: 'Dr. Johnson',
        specialization: 'Neurology',
        hospital: 'Nawaloka Hospital',
        hospitalName: 'Nawaloka Hospital',
        date: new Date().toISOString().split('T')[0],
        time: '2:00 PM',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '2:00 PM',
        amount: 6000,
        totalAmount: 6000,
        status: 'PENDING_ACB',
        notes: 'Follow-up consultation',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        appointmentNumber: 'ACB003',
        patientName: 'Michael Brown',
        patientEmail: 'michael.brown@email.com',
        patientPhone: '+94779876543',
        doctorName: 'Dr. Wilson',
        specialization: 'Pediatrics',
        hospital: 'Lanka Hospital',
        hospitalName: 'Lanka Hospital',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: '11:30 AM',
        appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        appointmentTime: '11:30 AM',
        amount: 4500,
        totalAmount: 4500,
        status: 'PENDING_ACB',
        notes: '',
        createdAt: new Date().toISOString()
      }
    ]

    res.status(200).json(apiResponse.success(pendingAcbAppointments, 'Pending ACB appointments retrieved successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

export default requireAuth(handler)