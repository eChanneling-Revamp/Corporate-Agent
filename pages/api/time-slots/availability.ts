import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const availabilityQuerySchema = z.object({
  doctorId: z.string().cuid().optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  specialization: z.string().optional(),
  hospitalId: z.string().cuid().optional(),
  minAvailableSlots: z.string().transform(val => parseInt(val)).optional().default(1),
  includeFullyBooked: z.string().transform(val => val === 'true').optional().default(false)
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    await handleGet(req, res)
  } catch (error) {
    console.error('Time slots availability API error:', error)
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
    const validatedQuery = availabilityQuerySchema.parse(req.query)
    
    const {
      doctorId,
      date,
      dateFrom,
      dateTo,
      specialization,
      hospitalId,
      minAvailableSlots,
      includeFullyBooked
    } = validatedQuery

    // Build where clause
    const where: any = {
      isActive: true
    }
    
    if (doctorId) {
      where.doctorId = doctorId
    }
    
    // Handle date filtering
    if (date) {
      where.date = new Date(date)
    } else {
      // Default to next 30 days if no date range specified
      const today = new Date()
      const defaultEndDate = new Date()
      defaultEndDate.setDate(today.getDate() + 30)
      
      where.date = {
        gte: dateFrom ? new Date(dateFrom) : today,
        lte: dateTo ? new Date(dateTo) : defaultEndDate
      }
    }

    // Add availability filter
    if (!includeFullyBooked) {
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
            hospital: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                district: true
              }
            }
          }
        },
        appointments: {
          where: {
            status: {
              notIn: ['CANCELLED']
            }
          },
          select: {
            id: true,
            appointmentNumber: true,
            patientName: true,
            status: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // Transform and filter slots
    const availableSlots = timeSlots
      .map(slot => {
        const availableCount = slot.maxAppointments - slot.currentBookings
        const status = getSlotStatus(slot.maxAppointments, slot.currentBookings)
        
        return {
          id: slot.id,
          doctorId: slot.doctorId,
          doctorName: slot.doctor.name,
          specialization: slot.doctor.specialization,
          hospital: slot.doctor.hospital,
          date: slot.date.toISOString().split('T')[0],
          startTime: formatTime(slot.startTime),
          endTime: formatTime(slot.endTime),
          maxAppointments: slot.maxAppointments,
          currentBookings: slot.currentBookings,
          availableSlots: availableCount,
          consultationFee: Number(slot.consultationFee),
          status,
          isFullyBooked: availableCount === 0,
          utilizationPercentage: Math.round((slot.currentBookings / slot.maxAppointments) * 100),
          nextAvailableTime: availableCount > 0 ? formatTime(slot.startTime) : null,
          appointmentDetails: slot.appointments
        }
      })
      .filter(slot => slot.availableSlots >= minAvailableSlots || includeFullyBooked)

    // Group by date for better organization
    const groupedByDate = availableSlots.reduce((acc, slot) => {
      const date = slot.date
      if (!acc[date]) {
        acc[date] = {
          date,
          totalSlots: 0,
          availableSlots: 0,
          fullyBookedSlots: 0,
          doctors: {},
          slots: []
        }
      }
      
      acc[date].totalSlots++
      if (slot.isFullyBooked) {
        acc[date].fullyBookedSlots++
      } else {
        acc[date].availableSlots++
      }
      
      // Group by doctor
      if (!acc[date].doctors[slot.doctorId]) {
        acc[date].doctors[slot.doctorId] = {
          doctorId: slot.doctorId,
          doctorName: slot.doctorName,
          specialization: slot.specialization,
          hospital: slot.hospital,
          slotsCount: 0,
          availableSlotsCount: 0,
          nextAvailableTime: null
        }
      }
      
      acc[date].doctors[slot.doctorId].slotsCount++
      if (!slot.isFullyBooked) {
        acc[date].doctors[slot.doctorId].availableSlotsCount++
        if (!acc[date].doctors[slot.doctorId].nextAvailableTime) {
          acc[date].doctors[slot.doctorId].nextAvailableTime = slot.startTime
        }
      }
      
      acc[date].slots.push(slot)
      return acc
    }, {} as any)

    // Convert doctors object to array
    Object.values(groupedByDate).forEach((dayData: any) => {
      dayData.doctors = Object.values(dayData.doctors)
    })

    // Calculate summary statistics
    const summary = {
      totalSlots: availableSlots.length,
      availableSlots: availableSlots.filter(slot => !slot.isFullyBooked).length,
      fullyBookedSlots: availableSlots.filter(slot => slot.isFullyBooked).length,
      uniqueDoctors: new Set(availableSlots.map(slot => slot.doctorId)).size,
      uniqueHospitals: new Set(availableSlots.map(slot => slot.hospital.id)).size,
      dateRange: {
        from: availableSlots.length > 0 ? availableSlots[0].date : null,
        to: availableSlots.length > 0 ? availableSlots[availableSlots.length - 1].date : null
      },
      averageUtilization: availableSlots.length > 0 
        ? Math.round(availableSlots.reduce((sum, slot) => sum + slot.utilizationPercentage, 0) / availableSlots.length)
        : 0
    }

    res.status(200).json({
      summary,
      data: {
        byDate: groupedByDate,
        allSlots: availableSlots
      },
      filters: validatedQuery
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
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

function formatTime(timeString: Date): string {
  return timeString.toISOString().substr(11, 5) // Extract HH:MM from ISO string
}