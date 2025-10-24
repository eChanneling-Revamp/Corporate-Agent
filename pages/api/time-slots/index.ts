import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const timeSlotCreateSchema = z.object({
  doctorId: z.string().cuid(),
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
  doctorId: z.string().cuid().optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
  hasAvailability: z.string().transform((val) => val === 'true').optional(),
  limit: z.string().transform((val) => parseInt(val)).optional(),
  offset: z.string().transform((val) => parseInt(val)).optional(),
  specialization: z.string().optional(),
  hospitalId: z.string().cuid().optional()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res)
        break
      case 'POST':
        await handlePost(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Time slots API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
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
        lt: prisma.$queryRaw`"maxAppointments"`
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
      appointments: slot.appointments.length
    }))

    // Get total count for pagination
    const totalCount = await prisma.timeSlot.count({ where })

    res.status(200).json({
      data: transformedSlots,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      })
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
      where: { id: doctorId }
    })

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' })
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
      return res.status(409).json({ 
        error: 'Time slot conflicts with existing slot',
        conflictingSlot: existingSlot
      })
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

    res.status(201).json({
      message: 'Time slot created successfully',
      data: {
        ...timeSlot,
        availableSlots: timeSlot.maxAppointments - timeSlot.currentBookings,
        status: getSlotStatus(timeSlot.maxAppointments, timeSlot.currentBookings)
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      })
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