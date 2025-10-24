import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const timeSlotUpdateSchema = z.object({
  doctorId: z.string().cuid().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format").optional(),
  maxAppointments: z.number().int().min(1).max(50).optional(),
  consultationFee: z.number().min(0).optional(),
  isActive: z.boolean().optional()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid time slot ID' })
  }

  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, id)
        break
      case 'PUT':
        await handlePut(req, res, id)
        break
      case 'DELETE':
        await handleDelete(req, res, id)
        break
      case 'PATCH':
        await handlePatch(req, res, id)
        break
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'PATCH'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Time slot API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id },
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
          },
          include: {
            bookedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!timeSlot) {
      return res.status(404).json({ error: 'Time slot not found' })
    }

    res.status(200).json({
      data: {
        ...timeSlot,
        availableSlots: timeSlot.maxAppointments - timeSlot.currentBookings,
        status: getSlotStatus(timeSlot.maxAppointments, timeSlot.currentBookings),
        appointmentCount: timeSlot.appointments.length
      }
    })
  } catch (error) {
    throw error
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const validatedData = timeSlotUpdateSchema.parse(req.body)
    
    // Check if time slot exists
    const existingSlot = await prisma.timeSlot.findUnique({
      where: { id },
      include: { appointments: true }
    })

    if (!existingSlot) {
      return res.status(404).json({ error: 'Time slot not found' })
    }

    // Prevent modification if there are confirmed appointments
    const activeAppointments = existingSlot.appointments.filter(
      apt => apt.status !== 'CANCELLED'
    )

    if (activeAppointments.length > 0 && (validatedData.date || validatedData.startTime || validatedData.endTime)) {
      return res.status(409).json({ 
        error: 'Cannot modify time/date of slot with active appointments',
        activeAppointments: activeAppointments.length
      })
    }

    // If updating capacity, ensure it's not less than current bookings
    if (validatedData.maxAppointments && validatedData.maxAppointments < existingSlot.currentBookings) {
      return res.status(409).json({ 
        error: 'Cannot reduce capacity below current bookings',
        currentBookings: existingSlot.currentBookings,
        requestedCapacity: validatedData.maxAppointments
      })
    }

    // Check for conflicts if updating time
    if (validatedData.startTime || validatedData.endTime || validatedData.date) {
      const startTime = validatedData.startTime ? 
        new Date(`1970-01-01T${validatedData.startTime}:00Z`) : 
        existingSlot.startTime
      const endTime = validatedData.endTime ? 
        new Date(`1970-01-01T${validatedData.endTime}:00Z`) : 
        existingSlot.endTime
      const date = validatedData.date ? 
        new Date(validatedData.date) : 
        existingSlot.date

      const conflictingSlot = await prisma.timeSlot.findFirst({
        where: {
          id: { not: id },
          doctorId: existingSlot.doctorId,
          date,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        }
      })

      if (conflictingSlot) {
        return res.status(409).json({ 
          error: 'Time slot conflicts with existing slot',
          conflictingSlot
        })
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.date) updateData.date = new Date(validatedData.date)
    if (validatedData.startTime) updateData.startTime = new Date(`1970-01-01T${validatedData.startTime}:00Z`)
    if (validatedData.endTime) updateData.endTime = new Date(`1970-01-01T${validatedData.endTime}:00Z`)
    if (validatedData.maxAppointments !== undefined) updateData.maxAppointments = validatedData.maxAppointments
    if (validatedData.consultationFee !== undefined) updateData.consultationFee = validatedData.consultationFee
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const updatedSlot = await prisma.timeSlot.update({
      where: { id },
      data: updateData,
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
      }
    })

    res.status(200).json({
      message: 'Time slot updated successfully',
      data: {
        ...updatedSlot,
        availableSlots: updatedSlot.maxAppointments - updatedSlot.currentBookings,
        status: getSlotStatus(updatedSlot.maxAppointments, updatedSlot.currentBookings)
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

async function handlePatch(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { action, ...data } = req.body

    const existingSlot = await prisma.timeSlot.findUnique({
      where: { id },
      include: { appointments: true }
    })

    if (!existingSlot) {
      return res.status(404).json({ error: 'Time slot not found' })
    }

    switch (action) {
      case 'updateCapacity':
        return await handleCapacityUpdate(res, id, data.maxAppointments, existingSlot)
      case 'toggleActive':
        return await handleToggleActive(res, id, existingSlot)
      case 'cancel':
        return await handleCancelSlot(res, id, data.reason, existingSlot)
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    throw error
  }
}

async function handleCapacityUpdate(res: NextApiResponse, id: string, maxAppointments: number, existingSlot: any) {
  if (!maxAppointments || maxAppointments < 1) {
    return res.status(400).json({ error: 'Invalid capacity value' })
  }

  if (maxAppointments < existingSlot.currentBookings) {
    return res.status(409).json({ 
      error: 'Cannot reduce capacity below current bookings',
      currentBookings: existingSlot.currentBookings,
      requestedCapacity: maxAppointments
    })
  }

  const updatedSlot = await prisma.timeSlot.update({
    where: { id },
    data: { maxAppointments },
    include: {
      doctor: true
    }
  })

  res.status(200).json({
    message: 'Capacity updated successfully',
    data: {
      ...updatedSlot,
      availableSlots: updatedSlot.maxAppointments - updatedSlot.currentBookings,
      status: getSlotStatus(updatedSlot.maxAppointments, updatedSlot.currentBookings)
    }
  })
}

async function handleToggleActive(res: NextApiResponse, id: string, existingSlot: any) {
  const updatedSlot = await prisma.timeSlot.update({
    where: { id },
    data: { isActive: !existingSlot.isActive },
    include: {
      doctor: true
    }
  })

  res.status(200).json({
    message: `Time slot ${updatedSlot.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      ...updatedSlot,
      availableSlots: updatedSlot.maxAppointments - updatedSlot.currentBookings,
      status: getSlotStatus(updatedSlot.maxAppointments, updatedSlot.currentBookings)
    }
  })
}

async function handleCancelSlot(res: NextApiResponse, id: string, reason: string, existingSlot: any) {
  if (!reason) {
    return res.status(400).json({ error: 'Cancellation reason is required' })
  }

  // Cancel all active appointments in this slot
  const cancelledAppointments = await prisma.appointment.updateMany({
    where: {
      timeSlotId: id,
      status: {
        notIn: ['CANCELLED', 'COMPLETED']
      }
    },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancellationDate: new Date()
    }
  })

  // Deactivate the slot
  const updatedSlot = await prisma.timeSlot.update({
    where: { id },
    data: { 
      isActive: false,
      currentBookings: 0
    },
    include: {
      doctor: true
    }
  })

  res.status(200).json({
    message: 'Time slot cancelled successfully',
    data: {
      ...updatedSlot,
      cancelledAppointments: cancelledAppointments.count,
      availableSlots: updatedSlot.maxAppointments - updatedSlot.currentBookings,
      status: getSlotStatus(updatedSlot.maxAppointments, updatedSlot.currentBookings)
    }
  })
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if time slot exists and has appointments
    const existingSlot = await prisma.timeSlot.findUnique({
      where: { id },
      include: { 
        appointments: {
          where: {
            status: {
              notIn: ['CANCELLED']
            }
          }
        }
      }
    })

    if (!existingSlot) {
      return res.status(404).json({ error: 'Time slot not found' })
    }

    // Prevent deletion if there are active appointments
    if (existingSlot.appointments.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete time slot with active appointments',
        activeAppointments: existingSlot.appointments.length
      })
    }

    await prisma.timeSlot.delete({
      where: { id }
    })

    res.status(200).json({
      message: 'Time slot deleted successfully'
    })
  } catch (error) {
    throw error
  }
}

function getSlotStatus(maxAppointments: number, currentBookings: number): 'AVAILABLE' | 'FILLING_FAST' | 'FULL' {
  const utilization = currentBookings / maxAppointments
  
  if (utilization >= 1) return 'FULL'
  if (utilization >= 0.8) return 'FILLING_FAST'
  return 'AVAILABLE'
}