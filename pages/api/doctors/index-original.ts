import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { doctorSchema, apiResponse, handleApiError } from '../../../lib/validation'
import { requireRole } from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return await getDoctors(req, res)
    case 'POST':
      return await createDoctor(req, res)
    default:
      return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }
}

async function getDoctors(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      search, 
      specialization, 
      hospitalId, 
      city, 
      limit = '20', 
      offset = '0',
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query

    const whereClause: any = {
      isActive: true
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { specialization: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (specialization) {
      whereClause.specialization = { contains: specialization as string, mode: 'insensitive' }
    }

    if (hospitalId) {
      whereClause.hospitalId = hospitalId as string
    }

    if (city) {
      whereClause.hospital = { city: { contains: city as string, mode: 'insensitive' } }
    }

    const orderBy: any = {}
    orderBy[sortBy as string] = sortOrder as string

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            district: true,
            facilities: true
          }
        },
        timeSlots: {
          where: {
            date: { gte: new Date() },
            isActive: true
          },
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            maxAppointments: true,
            currentBookings: true,
            consultationFee: true
          },
          orderBy: { date: 'asc' },
          take: 10 // Next 10 available slots
        },
        _count: {
          select: {
            appointments: {
              where: {
                status: 'CONFIRMED',
                appointmentDate: { gte: new Date() }
              }
            }
          }
        }
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy
    })

    const total = await prisma.doctor.count({
      where: whereClause
    })

    // Calculate availability for each doctor
    const doctorsWithAvailability = doctors.map(doctor => ({
      ...doctor,
      isAvailable: doctor.timeSlots.some(slot => slot.currentBookings < slot.maxAppointments),
      nextAvailableSlot: doctor.timeSlots.find(slot => slot.currentBookings < slot.maxAppointments),
      upcomingAppointments: doctor._count.appointments
    }))

    res.status(200).json(apiResponse.paginated(
      doctorsWithAvailability,
      {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + parseInt(limit as string)
      }
    ))

  } catch (error) {
    return handleApiError(error, res)
  }
}

async function createDoctor(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = doctorSchema.parse(req.body)

    // Check if doctor with email already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email: validatedData.email }
    })

    if (existingDoctor) {
      return res.status(409).json(apiResponse.error('Doctor with this email already exists', 409))
    }

    const doctor = await prisma.doctor.create({
      data: {
        ...validatedData,
        experience: parseInt(validatedData.experience)
      },
      include: {
        hospital: true
      }
    })

    res.status(201).json(apiResponse.success(doctor, 'Doctor created successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

// Apply role-based access control for POST requests
export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    return requireRole(['ADMIN', 'SUPERVISOR'])(handler)(req, res)
  }
  return handler(req, res)
}
