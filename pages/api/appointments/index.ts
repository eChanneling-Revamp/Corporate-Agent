import { NextApiRequest, NextApiResponse } from 'next'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getAppointments(req, res)
    case 'POST':
      return createAppointment(req, res)
    default:
      return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }
}

async function getAppointments(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      status = '',
      doctorId = '',
      hospitalId = '',
      date = '',
      page = '1',
      limit = '10'
    } = req.query

    // Mock appointments data
    const mockAppointments = [
      {
        id: '1',
        appointmentNumber: 'APT001',
        patientName: 'John Doe',
        patientEmail: 'john.doe@email.com',
        patientPhone: '+94771234567',
        patientNIC: '123456789V',
        doctorId: '1',
        hospitalId: 'hospital-1',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:00',
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        consultationFee: 5000,
        totalAmount: 5000,
        notes: 'Regular checkup',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctor: {
          id: '1',
          name: 'Dr. John Smith',
          specialization: 'Cardiology'
        },
        hospital: {
          id: 'hospital-1',
          name: 'Apollo Hospital',
          city: 'Colombo'
        },
        isUpcoming: true,
        isPast: false,
        canCancel: true,
        canReschedule: true
      },
      {
        id: '2',
        appointmentNumber: 'APT002',
        patientName: 'Jane Smith',
        patientEmail: 'jane.smith@email.com',
        patientPhone: '+94777654321',
        patientNIC: '987654321V',
        doctorId: '2',
        hospitalId: 'hospital-2',
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        appointmentTime: '14:00',
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        consultationFee: 6000,
        totalAmount: 6000,
        notes: 'Follow-up consultation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctor: {
          id: '2',
          name: 'Dr. Sarah Johnson',
          specialization: 'Neurology'
        },
        hospital: {
          id: 'hospital-2',
          name: 'Nawaloka Hospital',
          city: 'Colombo'
        },
        isUpcoming: true,
        isPast: false,
        canCancel: true,
        canReschedule: true
      },
      {
        id: '3',
        appointmentNumber: 'APT003',
        patientName: 'Michael Brown',
        patientEmail: 'michael.brown@email.com',
        patientPhone: '+94763334444',
        patientNIC: '456789123V',
        doctorId: '3',
        hospitalId: 'hospital-1',
        appointmentDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        appointmentTime: '11:00',
        status: 'COMPLETED',
        paymentStatus: 'COMPLETED',
        consultationFee: 4500,
        totalAmount: 4500,
        notes: 'Pediatric consultation completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctor: {
          id: '3',
          name: 'Dr. Michael Brown',
          specialization: 'Pediatrics'
        },
        hospital: {
          id: 'hospital-1',
          name: 'Apollo Hospital',
          city: 'Colombo'
        },
        isUpcoming: false,
        isPast: true,
        canCancel: false,
        canReschedule: false
      }
    ]

    // Apply filters
    let filteredAppointments = mockAppointments

    if (status) {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.status.toLowerCase() === status.toString().toLowerCase()
      )
    }

    if (doctorId) {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.doctorId === doctorId
      )
    }

    if (hospitalId) {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.hospitalId === hospitalId
      )
    }

    if (date) {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.appointmentDate === date
      )
    }

    // Apply pagination
    const pageNum = parseInt(page.toString())
    const limitNum = parseInt(limit.toString())
    const offset = (pageNum - 1) * limitNum
    const paginatedAppointments = filteredAppointments.slice(offset, offset + limitNum)

    res.status(200).json(apiResponse.success({
      appointments: paginatedAppointments,
      pagination: {
        total: filteredAppointments.length,
        limit: limitNum,
        offset,
        hasMore: offset + limitNum < filteredAppointments.length,
        currentPage: pageNum,
        totalPages: Math.ceil(filteredAppointments.length / limitNum)
      }
    }, 'Appointments retrieved successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

async function createAppointment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      patientName,
      patientEmail,
      patientPhone,
      doctorId,
      hospitalId,
      appointmentDate,
      appointmentTime,
      consultationFee
    } = req.body

    // Mock response for creating an appointment
    const newAppointment = {
      id: Date.now().toString(),
      appointmentNumber: `APT${Date.now().toString().slice(-6)}`,
      patientName,
      patientEmail,
      patientPhone,
      doctorId,
      hospitalId,
      appointmentDate,
      appointmentTime,
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      consultationFee: parseFloat(consultationFee),
      totalAmount: parseFloat(consultationFee),
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    res.status(201).json(apiResponse.success(newAppointment, 'Appointment created successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

export default requireAuth(handler)