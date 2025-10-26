import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '../../../lib/prisma'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'

// Validation schemas
const timeSlotCreateSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  maxAppointments: z.number().int().min(1).max(50),
  consultationFee: z.number().min(0),
  isActive: z.boolean().optional().default(true)
})

const timeSlotUpdateSchema = timeSlotCreateSchema.partial()

const timeSlotFiltersSchema = z.object({
  doctorId: z.string().optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
  hasAvailability: z.string().transform((val) => val === 'true').optional(),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 50),
  offset: z.string().optional().transform((val) => val ? parseInt(val) : 0),
  specialization: z.string().optional(),
  hospitalId: z.string().optional()
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
    }
  } catch (error) {
    return handleApiError(error, res)
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedFilters = timeSlotFiltersSchema.parse(req.query)
    
    const {
      doctorId,
      date,
      dateFrom,
      dateTo,
      isActive,
      hasAvailability,
      limit = 50,
      offset = 0,
      specialization,
      hospitalId
    } = validatedFilters

    // Build where clause
    const where: any = {}
    
    if (doctorId) {
      where.doctorId = doctorId
    }
    
    if (date) {
      where.date = new Date(date)
    } else if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive
    }
    
    if (hasAvailability) {
      where.currentBookings = {
        lt: prisma.$queryRaw`max_appointments`
      }
    }

    // Add doctor filters if provided
    if (specialization || hospitalId) {
      where.doctor = {}
      if (specialization) {
        where.doctor.specialization = {
          contains: specialization,
          mode: 'insensitive'
        }
      }
      if (hospitalId) {
        where.doctor.hospitalId = hospitalId
      }
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where,
      include: {
        doctor: {
          include: {
            hospital: true
          }
        },
        appointments: {
          where: {
            status: {
              notIn: ['CANCELLED']
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ],
      take: limit,
      skip: offset
    })

    // Transform data with additional computed fields
    const transformedSlots = timeSlots.map(slot => ({
      ...slot,
      availableSlots: slot.maxAppointments - slot.currentBookings,
      status: getSlotStatus(slot.maxAppointments, slot.currentBookings),
      appointments: slot.appointments.length,
      consultationFee: Number(slot.consultationFee)
    }))

    // Get total count for pagination
    const totalCount = await prisma.timeSlot.count({ where })

    return res.status(200).json(apiResponse.success({
      timeSlots: transformedSlots,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, 'Time slots retrieved successfully'))

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(apiResponse.error('Validation error', 400, error.issues))
    } else {
      throw error
    }
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = timeSlotCreateSchema.parse(req.body)
    
    const {
      doctorId,
      date,
      startTime,
      endTime,
      maxAppointments,
      consultationFee,
      isActive
    } = validatedData

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { hospital: true }
    })

    if (!doctor) {
      return res.status(404).json(apiResponse.error('Doctor not found', 404))
    }

    // Check for overlapping time slots
    const existingSlot = await prisma.timeSlot.findFirst({
      where: {
        doctorId,
        date: new Date(date),
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(`1970-01-01T${startTime}:00Z`) } },
              { endTime: { gt: new Date(`1970-01-01T${startTime}:00Z`) } }
            ]
          },
          {
            AND: [
              { startTime: { lt: new Date(`1970-01-01T${endTime}:00Z`) } },
              { endTime: { gte: new Date(`1970-01-01T${endTime}:00Z`) } }
            ]
          },
          {
            AND: [
              { startTime: { gte: new Date(`1970-01-01T${startTime}:00Z`) } },
              { endTime: { lte: new Date(`1970-01-01T${endTime}:00Z`) } }
            ]
          }
        ]
      }
    })

    if (existingSlot) {
      return res.status(409).json(apiResponse.error('Time slot conflicts with existing slot', 409, {
        conflictingSlot: existingSlot
      }))
    }

    // Create the time slot
    const timeSlot = await prisma.timeSlot.create({
      data: {
        doctorId,
        date: new Date(date),
        startTime: new Date(`1970-01-01T${startTime}:00Z`),
        endTime: new Date(`1970-01-01T${endTime}:00Z`),
        maxAppointments,
        consultationFee,
        isActive,
        currentBookings: 0
      },
      include: {
        doctor: {
          include: {
            hospital: true
          }
        }
      }
    })

    return res.status(201).json(apiResponse.success({
      ...timeSlot,
      availableSlots: timeSlot.maxAppointments - timeSlot.currentBookings,
      status: getSlotStatus(timeSlot.maxAppointments, timeSlot.currentBookings),
      consultationFee: Number(timeSlot.consultationFee)
    }, 'Time slot created successfully'))

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(apiResponse.error('Validation error', 400, error.issues))
    } else {
      throw error
    }
  }
}

function getSlotStatus(maxAppointments: number, currentBookings: number): 'AVAILABLE' | 'FILLING_FAST' | 'FULL' {
  const utilization = currentBookings / maxAppointments
  
  if (utilization >= 1) return 'FULL'
  if (utilization >= 0.8) return 'FILLING_FAST'
  return 'AVAILABLE'
}

export default requireAuth(handler)
