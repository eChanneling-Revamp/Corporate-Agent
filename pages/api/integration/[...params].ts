import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// Third-Party Integration APIs
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for API access
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // API Key authentication
  const apiKey = req.headers['x-api-key'] as string || req.headers.authorization?.replace('Bearer ', '')
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API_KEY_REQUIRED',
      message: 'API key is required. Include X-API-Key header or Authorization Bearer token.'
    })
  }

  // Validate API key and get client info
  const client = await validateApiKey(apiKey)
  if (!client) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_API_KEY',
      message: 'Invalid API key provided.'
    })
  }

  // Rate limiting check
  const rateLimitResult = await checkRateLimit(client.id, req.ip || 'unknown')
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: rateLimitResult.retryAfter
    })
  }

  try {
    // Route to appropriate handler based on method
    switch (req.method) {
      case 'GET':
        return handleGetRequest(req, res, client)
      case 'POST':
        return handlePostRequest(req, res, client)
      case 'PUT':
        return handlePutRequest(req, res, client)
      case 'DELETE':
        return handleDeleteRequest(req, res, client)
      default:
        return res.status(405).json({
          success: false,
          error: 'METHOD_NOT_ALLOWED',
          message: `Method ${req.method} not allowed`
        })
    }
  } catch (error) {
    console.error('Integration API Error:', error)
    
    // Log API usage for monitoring
    await logApiUsage(client.id, req.method || 'UNKNOWN', req.url || '', 'ERROR', error)

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred'
    })
  }
}

// Handle GET requests (Read operations)
async function handleGetRequest(req: NextApiRequest, res: NextApiResponse, client: any) {
  const { resource, id } = req.query

  switch (resource) {
    case 'appointments':
      return getAppointments(req, res, client)
    case 'doctors':
      return getDoctors(req, res, client)
    case 'hospitals':
      return getHospitals(req, res, client)
    case 'timeslots':
      return getTimeSlots(req, res, client)
    case 'patients':
      return getPatients(req, res, client)
    default:
      return res.status(400).json({
        success: false,
        error: 'INVALID_RESOURCE',
        message: 'Invalid resource. Supported: appointments, doctors, hospitals, timeslots, patients'
      })
  }
}

// Handle POST requests (Create operations)
async function handlePostRequest(req: NextApiRequest, res: NextApiResponse, client: any) {
  const { resource } = req.query

  switch (resource) {
    case 'appointments':
      return createAppointment(req, res, client)
    case 'patients':
      return createPatient(req, res, client)
    case 'timeslots':
      return createTimeSlot(req, res, client)
    default:
      return res.status(400).json({
        success: false,
        error: 'INVALID_RESOURCE',
        message: 'Invalid resource for creation. Supported: appointments, patients, timeslots'
      })
  }
}

// Handle PUT requests (Update operations)
async function handlePutRequest(req: NextApiRequest, res: NextApiResponse, client: any) {
  const { resource, id } = req.query

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID_REQUIRED',
      message: 'Resource ID is required for updates'
    })
  }

  switch (resource) {
    case 'appointments':
      return updateAppointment(req, res, client, id as string)
    case 'patients':
      return updatePatient(req, res, client, id as string)
    default:
      return res.status(400).json({
        success: false,
        error: 'INVALID_RESOURCE',
        message: 'Invalid resource for updates. Supported: appointments, patients'
      })
  }
}

// Handle DELETE requests
async function handleDeleteRequest(req: NextApiRequest, res: NextApiResponse, client: any) {
  const { resource, id } = req.query

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID_REQUIRED',
      message: 'Resource ID is required for deletion'
    })
  }

  switch (resource) {
    case 'appointments':
      return cancelAppointment(req, res, client, id as string)
    default:
      return res.status(400).json({
        success: false,
        error: 'INVALID_RESOURCE',
        message: 'Invalid resource for deletion. Supported: appointments (cancel)'
      })
  }
}

// Get Appointments
async function getAppointments(req: NextApiRequest, res: NextApiResponse, client: any) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      doctorId,
      hospitalId,
      dateFrom,
      dateTo,
      patientEmail
    } = req.query

    // Build where clause
    const where: any = {}
    
    if (status) where.status = status
    if (doctorId) where.doctorId = doctorId
    if (hospitalId) where.hospitalId = hospitalId
    if (patientEmail) where.patientEmail = patientEmail
    
    if (dateFrom || dateTo) {
      where.appointmentDate = {}
      if (dateFrom) where.appointmentDate.gte = new Date(dateFrom as string)
      if (dateTo) where.appointmentDate.lte = new Date(dateTo as string)
    }

    // Get appointments with pagination
    const skip = (Number(page) - 1) * Number(limit)
    
    const [appointments, totalCount] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
              consultationFee: true
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.appointment.count({ where })
    ])

    // Log successful API call
    await logApiUsage(client.id, 'GET', '/api/integration/appointments', 'SUCCESS')

    return res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalCount,
          limit: Number(limit)
        }
      }
    })

  } catch (error) {
    await logApiUsage(client.id, 'GET', '/api/integration/appointments', 'ERROR', error)
    throw error
  }
}

// Create Appointment
async function createAppointment(req: NextApiRequest, res: NextApiResponse, client: any) {
  try {
    const {
      patientName,
      patientEmail,
      patientPhone,
      patientNIC,
      doctorId,
      hospitalId,
      appointmentDate,
      appointmentTime,
      medicalHistory,
      currentMedications,
      allergies
    } = req.body

    // Validate required fields
    if (!patientName || !patientEmail || !patientPhone || !doctorId || !hospitalId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Required fields: patientName, patientEmail, patientPhone, doctorId, hospitalId, appointmentDate, appointmentTime'
      })
    }

    // Check if doctor exists and is active
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { hospital: true }
    })

    if (!doctor || !doctor.isActive) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DOCTOR',
        message: 'Doctor not found or inactive'
      })
    }

    // Check if hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    })

    if (!hospital || !hospital.isActive) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_HOSPITAL',
        message: 'Hospital not found or inactive'
      })
    }

    // Find available time slot
    const requestedDate = new Date(appointmentDate)
    const requestedTime = new Date(`${appointmentDate}T${appointmentTime}`)

    const timeSlot = await prisma.timeSlot.findFirst({
      where: {
        doctorId,
        date: requestedDate,
        startTime: {
          lte: requestedTime
        },
        endTime: {
          gt: requestedTime
        },
        isActive: true,
        currentBookings: {
          lt: prisma.timeSlot.fields.maxAppointments
        }
      }
    })

    if (!timeSlot) {
      return res.status(400).json({
        success: false,
        error: 'NO_AVAILABLE_SLOT',
        message: 'No available time slot found for the requested time'
      })
    }

    // Generate appointment number
    const appointmentNumber = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        appointmentNumber,
        patientName,
        patientEmail,
        patientPhone,
        patientNIC,
        doctorId,
        hospitalId,
        timeSlotId: timeSlot.id,
        bookedById: client.userId, // Integration client user
        appointmentDate: requestedDate,
        appointmentTime: requestedTime,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        consultationFee: timeSlot.consultationFee,
        totalAmount: timeSlot.consultationFee,
        medicalHistory,
        currentMedications,
        allergies,
        isNewPatient: true
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true,
            consultationFee: true
          }
        },
        hospital: {
          select: {
            name: true,
            address: true,
            city: true,
            contactNumber: true
          }
        }
      }
    })

    // Update time slot booking count
    await prisma.timeSlot.update({
      where: { id: timeSlot.id },
      data: {
        currentBookings: {
          increment: 1
        }
      }
    })

    // Log successful API call
    await logApiUsage(client.id, 'POST', '/api/integration/appointments', 'SUCCESS', { appointmentId: appointment.id })

    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    })

  } catch (error) {
    await logApiUsage(client.id, 'POST', '/api/integration/appointments', 'ERROR', error)
    throw error
  }
}

// Update Appointment
async function updateAppointment(req: NextApiRequest, res: NextApiResponse, client: any, appointmentId: string) {
  try {
    const {
      status,
      patientName,
      patientEmail,
      patientPhone,
      medicalHistory,
      currentMedications,
      allergies
    } = req.body

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    })

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        error: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment not found'
      })
    }

    // Build update data
    const updateData: any = {}
    if (status) updateData.status = status
    if (patientName) updateData.patientName = patientName
    if (patientEmail) updateData.patientEmail = patientEmail
    if (patientPhone) updateData.patientPhone = patientPhone
    if (medicalHistory) updateData.medicalHistory = medicalHistory
    if (currentMedications) updateData.currentMedications = currentMedications
    if (allergies) updateData.allergies = allergies

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true
          }
        },
        hospital: {
          select: {
            name: true,
            city: true
          }
        }
      }
    })

    // Log successful API call
    await logApiUsage(client.id, 'PUT', `/api/integration/appointments/${appointmentId}`, 'SUCCESS')

    return res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment: updatedAppointment }
    })

  } catch (error) {
    await logApiUsage(client.id, 'PUT', `/api/integration/appointments/${appointmentId}`, 'ERROR', error)
    throw error
  }
}

// Cancel Appointment
async function cancelAppointment(req: NextApiRequest, res: NextApiResponse, client: any, appointmentId: string) {
  try {
    const { cancellationReason } = req.body

    // Check if appointment exists and can be cancelled
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { timeSlot: true }
    })

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment not found'
      })
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'ALREADY_CANCELLED',
        message: 'Appointment is already cancelled'
      })
    }

    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_CANCEL_COMPLETED',
        message: 'Cannot cancel completed appointment'
      })
    }

    // Cancel appointment
    const cancelledAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancellationReason: cancellationReason || 'Cancelled via API',
        cancellationDate: new Date()
      }
    })

    // Update time slot booking count
    if (appointment.timeSlot) {
      await prisma.timeSlot.update({
        where: { id: appointment.timeSlotId },
        data: {
          currentBookings: {
            decrement: 1
          }
        }
      })
    }

    // Log successful API call
    await logApiUsage(client.id, 'DELETE', `/api/integration/appointments/${appointmentId}`, 'SUCCESS')

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment: cancelledAppointment }
    })

  } catch (error) {
    await logApiUsage(client.id, 'DELETE', `/api/integration/appointments/${appointmentId}`, 'ERROR', error)
    throw error
  }
}

// Get Doctors
async function getDoctors(req: NextApiRequest, res: NextApiResponse, client: any) {
  try {
    const {
      page = 1,
      limit = 20,
      specialization,
      hospitalId,
      isActive = 'true'
    } = req.query

    const where: any = {}
    if (specialization) where.specialization = { contains: specialization as string, mode: 'insensitive' }
    if (hospitalId) where.hospitalId = hospitalId
    if (isActive) where.isActive = isActive === 'true'

    const skip = (Number(page) - 1) * Number(limit)

    const [doctors, totalCount] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
              city: true,
              district: true
            }
          },
          _count: {
            select: {
              appointments: true,
              timeSlots: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit)
      }),
      prisma.doctor.count({ where })
    ])

    await logApiUsage(client.id, 'GET', '/api/integration/doctors', 'SUCCESS')

    return res.status(200).json({
      success: true,
      data: {
        doctors,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalCount,
          limit: Number(limit)
        }
      }
    })

  } catch (error) {
    await logApiUsage(client.id, 'GET', '/api/integration/doctors', 'ERROR', error)
    throw error
  }
}

// Get Hospitals
async function getHospitals(req: NextApiRequest, res: NextApiResponse, client: any) {
  try {
    const {
      page = 1,
      limit = 20,
      city,
      district,
      isActive = 'true'
    } = req.query

    const where: any = {}
    if (city) where.city = { contains: city as string, mode: 'insensitive' }
    if (district) where.district = { contains: district as string, mode: 'insensitive' }
    if (isActive) where.isActive = isActive === 'true'

    const skip = (Number(page) - 1) * Number(limit)

    const [hospitals, totalCount] = await Promise.all([
      prisma.hospital.findMany({
        where,
        include: {
          _count: {
            select: {
              doctors: true,
              appointments: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit)
      }),
      prisma.hospital.count({ where })
    ])

    await logApiUsage(client.id, 'GET', '/api/integration/hospitals', 'SUCCESS')

    return res.status(200).json({
      success: true,
      data: {
        hospitals,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalCount,
          limit: Number(limit)
        }
      }
    })

  } catch (error) {
    await logApiUsage(client.id, 'GET', '/api/integration/hospitals', 'ERROR', error)
    throw error
  }
}

// Get Time Slots
async function getTimeSlots(req: NextApiRequest, res: NextApiResponse, client: any) {
  try {
    const {
      doctorId,
      hospitalId,
      date,
      availableOnly = 'true'
    } = req.query

    if (!doctorId && !hospitalId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FILTER',
        message: 'Either doctorId or hospitalId is required'
      })
    }

    const where: any = { isActive: true }
    if (doctorId) where.doctorId = doctorId
    if (hospitalId) where.doctor = { hospitalId }
    if (date) where.date = new Date(date as string)
    
    if (availableOnly === 'true') {
      where.currentBookings = { lt: prisma.timeSlot.fields.maxAppointments }
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })

    await logApiUsage(client.id, 'GET', '/api/integration/timeslots', 'SUCCESS')

    return res.status(200).json({
      success: true,
      data: { timeSlots }
    })

  } catch (error) {
    await logApiUsage(client.id, 'GET', '/api/integration/timeslots', 'ERROR', error)
    throw error
  }
}

// Utility functions

// Validate API Key
async function validateApiKey(apiKey: string) {
  // In production, validate against a proper API keys table
  // For demo purposes, accept a few predefined keys
  const validKeys = {
    'demo_hospital_api_key_001': {
      id: 'client_001',
      name: 'Demo Hospital System',
      userId: 'system_integration_user',
      permissions: ['read', 'write'],
      rateLimit: 1000 // requests per hour
    },
    'demo_payment_gateway_002': {
      id: 'client_002', 
      name: 'Payment Gateway Integration',
      userId: 'payment_integration_user',
      permissions: ['read'],
      rateLimit: 500
    }
  }

  return validKeys[apiKey as keyof typeof validKeys] || null
}

// Rate Limiting
async function checkRateLimit(clientId: string, ip: string) {
  // In production, implement proper rate limiting with Redis or similar
  // For demo purposes, always allow
  return {
    allowed: true,
    retryAfter: null
  }
}

// Log API Usage
async function logApiUsage(clientId: string, method: string, endpoint: string, status: string, details?: any) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: 'integration_system',
        action: 'API_CALL',
        entityType: 'INTEGRATION',
        entityId: clientId,
        details: {
          method,
          endpoint,
          status,
          clientId,
          timestamp: new Date().toISOString(),
          error: details instanceof Error ? details.message : details
        }
      }
    })
  } catch (err) {
    console.error('Failed to log API usage:', err)
  }
}