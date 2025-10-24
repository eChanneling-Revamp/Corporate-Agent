import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '../../../lib/prisma'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'

// Validation schemas
const doctorFiltersSchema = z.object({
  search: z.string().optional(),
  specialization: z.string().optional(),
  hospitalId: z.string().optional(),
  city: z.string().optional(),
  availability: z.string().optional(),
  rating: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  minExperience: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  sortBy: z.string().optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
})

const doctorCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  specialization: z.string().min(1, 'Specialization is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  experience: z.number().min(0, 'Experience must be a positive number'),
  consultationFee: z.number().min(0, 'Consultation fee must be positive'),
  hospitalId: z.string().min(1, 'Hospital ID is required'),
  description: z.string().optional(),
  languages: z.array(z.string()).optional().default(['English']),
  availableDays: z.array(z.string()).optional().default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getDoctors(req, res)
    case 'POST':
      return createDoctor(req, res)
    default:
      return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }
}

async function getDoctors(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedQuery = doctorFiltersSchema.parse(req.query)
    const {
      search,
      specialization,
      hospitalId,
      city,
      availability,
      rating,
      minExperience,
      sortBy,
      sortOrder,
      page,
      limit
    } = validatedQuery

    // Mock data for development
    const mockDoctors = [
      {
        id: '1',
        name: 'Dr. John Smith',
        email: 'john.smith@hospital.com',
        specialization: 'Cardiology',
        qualification: 'MBBS, MD Cardiology',
        experience: 15,
        consultationFee: 5000,
        rating: 4.8,
        profileImage: null,
        description: 'Experienced cardiologist with 15 years of practice',
        languages: ['English', 'Sinhala'],
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isActive: true,
        hospitalId: 'hospital-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hospital: {
          id: 'hospital-1',
          name: 'Apollo Hospital',
          city: 'Colombo',
          district: 'Colombo',
          facilities: ['ICU', 'CT Scan', 'MRI']
        },
        timeSlots: [
          {
            id: 'slot-1',
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '12:00',
            maxAppointments: 20,
            currentBookings: 5,
            consultationFee: 5000
          }
        ],
        isAvailable: true,
        nextAvailableSlot: {
          id: 'slot-1',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '12:00',
          maxAppointments: 20,
          currentBookings: 5,
          consultationFee: 5000
        },
        upcomingAppointments: 5
      },
      {
        id: '2',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        specialization: 'Neurology',
        qualification: 'MBBS, MD Neurology',
        experience: 12,
        consultationFee: 6000,
        rating: 4.9,
        profileImage: null,
        description: 'Neurologist specializing in brain disorders',
        languages: ['English', 'Tamil'],
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        isActive: true,
        hospitalId: 'hospital-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hospital: {
          id: 'hospital-2',
          name: 'Nawaloka Hospital',
          city: 'Colombo',
          district: 'Colombo',
          facilities: ['ICU', 'Neurosurgery Unit']
        },
        timeSlots: [
          {
            id: 'slot-2',
            date: new Date().toISOString().split('T')[0],
            startTime: '14:00',
            endTime: '17:00',
            maxAppointments: 15,
            currentBookings: 3,
            consultationFee: 6000
          }
        ],
        isAvailable: true,
        nextAvailableSlot: {
          id: 'slot-2',
          date: new Date().toISOString().split('T')[0],
          startTime: '14:00',
          endTime: '17:00',
          maxAppointments: 15,
          currentBookings: 3,
          consultationFee: 6000
        },
        upcomingAppointments: 3
      },
      {
        id: '3',
        name: 'Dr. Michael Brown',
        email: 'michael.brown@hospital.com',
        specialization: 'Pediatrics',
        qualification: 'MBBS, MD Pediatrics',
        experience: 10,
        consultationFee: 4500,
        rating: 4.7,
        profileImage: null,
        description: 'Pediatrician with expertise in child healthcare',
        languages: ['English', 'Sinhala'],
        availableDays: ['Tuesday', 'Thursday', 'Saturday'],
        isActive: true,
        hospitalId: 'hospital-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hospital: {
          id: 'hospital-1',
          name: 'Apollo Hospital',
          city: 'Colombo',
          district: 'Colombo',
          facilities: ['ICU', 'CT Scan', 'MRI']
        },
        timeSlots: [
          {
            id: 'slot-3',
            date: new Date().toISOString().split('T')[0],
            startTime: '10:00',
            endTime: '13:00',
            maxAppointments: 25,
            currentBookings: 8,
            consultationFee: 4500
          }
        ],
        isAvailable: true,
        nextAvailableSlot: {
          id: 'slot-3',
          date: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '13:00',
          maxAppointments: 25,
          currentBookings: 8,
          consultationFee: 4500
        },
        upcomingAppointments: 8
      }
    ]

    // Apply filters
    let filteredDoctors = mockDoctors

    if (search) {
      filteredDoctors = filteredDoctors.filter(doctor => 
        doctor.name.toLowerCase().includes(search.toString().toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(search.toString().toLowerCase())
      )
    }

    if (specialization) {
      filteredDoctors = filteredDoctors.filter(doctor => 
        doctor.specialization.toLowerCase().includes(specialization.toString().toLowerCase())
      )
    }

    if (hospitalId) {
      filteredDoctors = filteredDoctors.filter(doctor => 
        doctor.hospitalId === hospitalId
      )
    }

    if (city) {
      filteredDoctors = filteredDoctors.filter(doctor => 
        doctor.hospital.city.toLowerCase().includes(city.toString().toLowerCase())
      )
    }

    if (availability === 'available') {
      filteredDoctors = filteredDoctors.filter(doctor => doctor.isAvailable)
    }

    if (rating) {
      filteredDoctors = filteredDoctors.filter(doctor => 
        doctor.rating >= parseFloat(rating.toString())
      )
    }

    if (minExperience) {
      filteredDoctors = filteredDoctors.filter(doctor => 
        doctor.experience >= parseInt(minExperience.toString())
      )
    }

    // Apply sorting
    filteredDoctors.sort((a, b) => {
      const aValue = (a as any)[sortBy.toString()]
      const bValue = (b as any)[sortBy.toString()]
      
      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1
      }
      return aValue > bValue ? 1 : -1
    })

    // Apply pagination
    const pageNum = parseInt(page.toString())
    const limitNum = parseInt(limit.toString())
    const offset = (pageNum - 1) * limitNum
    const paginatedDoctors = filteredDoctors.slice(offset, offset + limitNum)

    res.status(200).json(apiResponse.success({
      doctors: paginatedDoctors,
      pagination: {
        total: filteredDoctors.length,
        limit: limitNum,
        offset,
        hasMore: offset + limitNum < filteredDoctors.length,
        currentPage: pageNum,
        totalPages: Math.ceil(filteredDoctors.length / limitNum)
      }
    }, 'Doctors retrieved successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

async function createDoctor(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, email, specialization, qualification, experience, consultationFee, hospitalId } = req.body

    // Mock response for creating a doctor
    const newDoctor = {
      id: Date.now().toString(),
      name,
      email,
      specialization,
      qualification,
      experience: parseInt(experience),
      consultationFee: parseFloat(consultationFee),
      hospitalId,
      rating: null,
      profileImage: null,
      description: null,
      languages: ['English'],
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    res.status(201).json(apiResponse.success(newDoctor, 'Doctor created successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

export default requireAuth(handler)