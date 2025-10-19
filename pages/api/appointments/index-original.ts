import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { appointmentSchema, apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return await getAppointments(req, res)
    case 'POST':
      return await createAppointment(req, res)
    default:
      return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }
}

async function getAppointments(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      status, 
      doctorId, 
      hospitalId,
      dateFrom,
      dateTo,
      patientEmail,
      appointmentNumber,
      limit = '20', 
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const whereClause: any = {}

    if (status) {
      whereClause.status = status as string
    }

    if (doctorId) {
      whereClause.doctorId = doctorId as string
    }

    if (hospitalId) {
      whereClause.hospitalId = hospitalId as string
    }

    if (dateFrom || dateTo) {
      whereClause.appointmentDate = {}
      if (dateFrom) {
        whereClause.appointmentDate.gte = new Date(dateFrom as string)
      }
      if (dateTo) {
        whereClause.appointmentDate.lte = new Date(dateTo as string)
      }
    }

    if (patientEmail) {
      whereClause.patientEmail = { contains: patientEmail as string, mode: 'insensitive' }
    }

    if (appointmentNumber) {
      whereClause.appointmentNumber = appointmentNumber as string
    }

    const orderBy: any = {}
    orderBy[sortBy as string] = sortOrder as string

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            qualification: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            contactNumber: true
          }
        },
        timeSlot: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            consultationFee: true
          }
        },
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            transactionId: true,
            paidAt: true
          }
        }
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy
    })

    const total = await prisma.appointment.count({
      where: whereClause
    })

    const appointmentsWithStatus = appointments.map(appointment => ({
      ...appointment,
      isUpcoming: new Date(appointment.appointmentDate) > new Date(),
      isPast: new Date(appointment.appointmentDate) < new Date(),
      canCancel: appointment.status === 'CONFIRMED' && new Date(appointment.appointmentDate) > new Date(),
      canReschedule: appointment.status === 'CONFIRMED' && new Date(appointment.appointmentDate) > new Date()
    }))

    res.status(200).json(apiResponse.paginated(
      appointmentsWithStatus,
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

async function createAppointment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = appointmentSchema.parse(req.body)
    const { timeSlotId, ...appointmentData } = validatedData

    // Get the time slot to check availability
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        doctor: {
          include: {
            hospital: true
          }
        }
      }
    })

    if (!timeSlot) {
      return res.status(404).json(apiResponse.error('Time slot not found', 404))
    }

    if (timeSlot.currentBookings >= timeSlot.maxAppointments) {
      return res.status(400).json(apiResponse.error('Time slot is fully booked', 400))
    }

    // Generate unique appointment number
    const appointmentNumber = `APT${Date.now()}${Math.floor(Math.random() * 1000)}`

    // Calculate queue position and estimated wait time
    const queuePosition = timeSlot.currentBookings + 1
    const estimatedWaitTime = queuePosition * 15 // 15 minutes per appointment

    // Create appointment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create appointment
      const appointment = await tx.appointment.create({
        data: {
          ...appointmentData,
          timeSlotId,
          appointmentNumber,
          queuePosition,
          estimatedWaitTime,
          appointmentDate: timeSlot.date,
          appointmentTime: timeSlot.startTime,
          doctorId: timeSlot.doctorId,
          hospitalId: timeSlot.doctor.hospitalId!,
          consultationFee: timeSlot.consultationFee,
          totalAmount: timeSlot.consultationFee,
          bookedById: (req as any).user.id // From auth middleware
        },
        include: {
          doctor: {
            include: {
              hospital: true
            }
          },
          timeSlot: true
        }
      })

      // Update time slot booking count
      await tx.timeSlot.update({
        where: { id: timeSlotId },
        data: {
          currentBookings: {
            increment: 1
          }
        }
      })

      return appointment
    })

    res.status(201).json(apiResponse.success(result, 'Appointment booked successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

export default requireAuth(handler)