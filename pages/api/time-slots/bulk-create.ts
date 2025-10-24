import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const timeRangeSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  maxAppointments: z.number().int().min(1).max(50),
  consultationFee: z.number().min(0)
})

const bulkCreateSchema = z.object({
  doctorId: z.string().cuid(),
  dateRange: z.object({
    from: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format"
    }),
    to: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format"
    })
  }),
  timeRanges: z.array(timeRangeSchema).min(1),
  excludeDates: z.array(z.string()).optional().default([]),
  excludeDays: z.array(z.enum(['0', '1', '2', '3', '4', '5', '6'])).optional().default([]), // 0 = Sunday, 6 = Saturday
  isActive: z.boolean().optional().default(true),
  skipConflicts: z.boolean().optional().default(false)
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    await handlePost(req, res)
  } catch (error) {
    console.error('Bulk create time slots API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = bulkCreateSchema.parse(req.body)
    
    const {
      doctorId,
      dateRange,
      timeRanges,
      excludeDates,
      excludeDays,
      isActive,
      skipConflicts
    } = validatedData

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        hospital: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' })
    }

    // Validate date range
    const fromDate = new Date(dateRange.from)
    const toDate = new Date(dateRange.to)
    
    if (fromDate > toDate) {
      return res.status(400).json({ error: 'Invalid date range: from date must be before to date' })
    }

    // Generate date list
    const dates = generateDateRange(fromDate, toDate, excludeDates, excludeDays)
    
    if (dates.length === 0) {
      return res.status(400).json({ error: 'No valid dates found in the specified range' })
    }

    // Validate time ranges
    for (const timeRange of timeRanges) {
      const startTime = new Date(`1970-01-01T${timeRange.startTime}:00Z`)
      const endTime = new Date(`1970-01-01T${timeRange.endTime}:00Z`)
      
      if (startTime >= endTime) {
        return res.status(400).json({ 
          error: `Invalid time range: ${timeRange.startTime} must be before ${timeRange.endTime}` 
        })
      }
    }

    // Check for existing conflicts if not skipping
    const conflicts = []
    if (!skipConflicts) {
      for (const date of dates) {
        for (const timeRange of timeRanges) {
          const existingSlot = await findConflictingSlot(
            doctorId, 
            date, 
            timeRange.startTime, 
            timeRange.endTime
          )
          
          if (existingSlot) {
            conflicts.push({
              date: date.toISOString().split('T')[0],
              timeRange: `${timeRange.startTime}-${timeRange.endTime}`,
              conflictingSlot: existingSlot
            })
          }
        }
      }
      
      if (conflicts.length > 0) {
        return res.status(409).json({
          error: 'Conflicts found with existing time slots',
          conflicts,
          suggestion: 'Set skipConflicts to true to create only non-conflicting slots'
        })
      }
    }

    // Create time slots
    const slotsToCreate = []
    const skippedSlots = []
    
    for (const date of dates) {
      for (const timeRange of timeRanges) {
        const slotData = {
          doctorId,
          date,
          startTime: new Date(`1970-01-01T${timeRange.startTime}:00Z`),
          endTime: new Date(`1970-01-01T${timeRange.endTime}:00Z`),
          maxAppointments: timeRange.maxAppointments,
          consultationFee: timeRange.consultationFee,
          isActive,
          currentBookings: 0
        }

        if (skipConflicts) {
          const conflict = await findConflictingSlot(
            doctorId, 
            date, 
            timeRange.startTime, 
            timeRange.endTime
          )
          
          if (conflict) {
            skippedSlots.push({
              date: date.toISOString().split('T')[0],
              timeRange: `${timeRange.startTime}-${timeRange.endTime}`,
              reason: 'Conflict with existing slot'
            })
            continue
          }
        }

        slotsToCreate.push(slotData)
      }
    }

    if (slotsToCreate.length === 0) {
      return res.status(409).json({
        error: 'No slots could be created due to conflicts',
        skippedSlots
      })
    }

    // Batch create time slots
    const createdSlots = await prisma.$transaction(async (tx) => {
      const results = []
      
      // Create slots in batches to avoid overwhelming the database
      const batchSize = 50
      for (let i = 0; i < slotsToCreate.length; i += batchSize) {
        const batch = slotsToCreate.slice(i, i + batchSize)
        
        for (const slotData of batch) {
          try {
            const slot = await tx.timeSlot.create({
              data: slotData,
              include: {
                doctor: {
                  select: {
                    id: true,
                    name: true,
                    specialization: true
                  }
                }
              }
            })
            results.push(slot)
          } catch (error) {
            // Skip individual slot creation errors if skipConflicts is true
            if (skipConflicts) {
              skippedSlots.push({
                date: slotData.date.toISOString().split('T')[0],
                timeRange: `${formatTime(slotData.startTime)}-${formatTime(slotData.endTime)}`,
                reason: 'Database constraint violation'
              })
            } else {
              throw error
            }
          }
        }
      }
      
      return results
    })

    // Calculate statistics
    const stats = {
      totalRequested: dates.length * timeRanges.length,
      created: createdSlots.length,
      skipped: skippedSlots.length,
      dateRange: {
        from: dateRange.from,
        to: dateRange.to,
        totalDays: dates.length
      },
      timeRanges: timeRanges.length,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital
      }
    }

    res.status(201).json({
      message: `Successfully created ${createdSlots.length} time slots`,
      stats,
      data: createdSlots.map(slot => ({
        ...slot,
        availableSlots: slot.maxAppointments - slot.currentBookings,
        status: getSlotStatus(slot.maxAppointments, slot.currentBookings)
      })),
      ...(skippedSlots.length > 0 && { skippedSlots })
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

function generateDateRange(
  fromDate: Date, 
  toDate: Date, 
  excludeDates: string[], 
  excludeDays: string[]
): Date[] {
  const dates = []
  const excludeDatesSet = new Set(excludeDates)
  const excludeDaysSet = new Set(excludeDays.map(day => parseInt(day)))
  
  const currentDate = new Date(fromDate)
  
  while (currentDate <= toDate) {
    const dateString = currentDate.toISOString().split('T')[0]
    const dayOfWeek = currentDate.getDay()
    
    // Check if date should be excluded
    if (!excludeDatesSet.has(dateString) && !excludeDaysSet.has(dayOfWeek)) {
      dates.push(new Date(currentDate))
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

async function findConflictingSlot(
  doctorId: string, 
  date: Date, 
  startTime: string, 
  endTime: string
) {
  return await prisma.timeSlot.findFirst({
    where: {
      doctorId,
      date,
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
    },
    select: {
      id: true,
      startTime: true,
      endTime: true
    }
  })
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