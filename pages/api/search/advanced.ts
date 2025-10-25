import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// Advanced Search API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }

  try {
    const {
      entity, // 'appointments', 'patients', 'doctors', 'corporate_packages', 'users'
      query, // General text search
      filters, // JSON string of specific filters
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      includeArchived = 'false'
    } = req.query

    if (!entity) {
      return res.status(400).json({
        success: false,
        message: 'Entity type is required'
      })
    }

    // Parse filters
    let parsedFilters = {}
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters as string)
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filters format'
        })
      }
    }

    const searchParams = {
      entity: entity as string,
      query: query as string || '',
      filters: parsedFilters,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      page: Number(page),
      limit: Number(limit),
      includeArchived: includeArchived === 'true'
    }

    let searchResults: any
    
    switch (entity) {
      case 'appointments':
        searchResults = await searchAppointments(searchParams)
        break
      case 'patients':
        searchResults = await searchPatients(searchParams)
        break
      case 'doctors':
        searchResults = await searchDoctors(searchParams)
        break
      case 'corporate_packages':
        searchResults = await searchCorporatePackages(searchParams)
        break
      case 'users':
        searchResults = await searchUsers(searchParams)
        break
      case 'payments':
        searchResults = await searchPayments(searchParams)
        break
      case 'hospitals':
        searchResults = await searchHospitals(searchParams)
        break
      default:
        return res.status(400).json({
          success: false,
          message: `Unsupported entity type: ${entity}`
        })
    }

    return res.status(200).json({
      success: true,
      data: searchResults
    })

  } catch (error) {
    console.error('Advanced Search Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Search appointments with advanced filters
async function searchAppointments(params: any) {
  const { query, filters, sortBy, sortOrder, page, limit } = params
  const skip = (page - 1) * limit

  const where: any = {}
  const include = {
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
        contactNumber: true,
        address: true
      }
    },
    bookedBy: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    },
    payments: {
      select: {
        id: true,
        amount: true,
        status: true,
        paymentMethod: true,
        paidAt: true
      }
    }
  }

  // Text search across multiple fields
  if (query) {
    where.OR = [
      { appointmentNumber: { contains: query, mode: 'insensitive' } },
      { patientName: { contains: query, mode: 'insensitive' } },
      { patientEmail: { contains: query, mode: 'insensitive' } },
      { patientPhone: { contains: query, mode: 'insensitive' } },
      { patientNIC: { contains: query, mode: 'insensitive' } },
      { doctor: { name: { contains: query, mode: 'insensitive' } } },
      { hospital: { name: { contains: query, mode: 'insensitive' } } }
    ]
  }

  // Apply specific filters
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      where.status = { in: filters.status }
    } else {
      where.status = filters.status
    }
  }

  if (filters.paymentStatus) {
    if (Array.isArray(filters.paymentStatus)) {
      where.paymentStatus = { in: filters.paymentStatus }
    } else {
      where.paymentStatus = filters.paymentStatus
    }
  }

  if (filters.doctorId) {
    where.doctorId = filters.doctorId
  }

  if (filters.hospitalId) {
    where.hospitalId = filters.hospitalId
  }

  if (filters.bookedById) {
    where.bookedById = filters.bookedById
  }

  // Date range filters
  if (filters.dateFrom || filters.dateTo) {
    where.appointmentDate = {}
    if (filters.dateFrom) {
      where.appointmentDate.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      where.appointmentDate.lte = new Date(filters.dateTo)
    }
  }

  // Created date range
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {}
    if (filters.createdFrom) {
      where.createdAt.gte = new Date(filters.createdFrom)
    }
    if (filters.createdTo) {
      where.createdAt.lte = new Date(filters.createdTo)
    }
  }

  // Fee range filter
  if (filters.feeMin || filters.feeMax) {
    where.consultationFee = {}
    if (filters.feeMin) {
      where.consultationFee.gte = filters.feeMin
    }
    if (filters.feeMax) {
      where.consultationFee.lte = filters.feeMax
    }
  }

  // Patient demographics filters
  if (filters.patientGender) {
    where.patientGender = filters.patientGender
  }

  if (filters.isNewPatient !== undefined) {
    where.isNewPatient = filters.isNewPatient === 'true'
  }

  // Execute search with pagination
  const [appointments, total, facets] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.appointment.count({ where }),
    getAppointmentFacets(where)
  ])

  return {
    results: appointments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    facets,
    summary: await getAppointmentSummary(where)
  }
}

// Search patients (extracted from appointments)
async function searchPatients(params: any) {
  const { query, filters, sortBy, sortOrder, page, limit } = params
  const skip = (page - 1) * limit

  // Get unique patients from appointments
  const appointmentWhere: any = {}
  
  if (query) {
    appointmentWhere.OR = [
      { patientName: { contains: query, mode: 'insensitive' } },
      { patientEmail: { contains: query, mode: 'insensitive' } },
      { patientPhone: { contains: query, mode: 'insensitive' } },
      { patientNIC: { contains: query, mode: 'insensitive' } }
    ]
  }

  // Apply filters
  if (filters.gender) {
    appointmentWhere.patientGender = filters.gender
  }

  if (filters.isNewPatient !== undefined) {
    appointmentWhere.isNewPatient = filters.isNewPatient === 'true'
  }

  if (filters.hasInsurance !== undefined) {
    if (filters.hasInsurance === 'true') {
      appointmentWhere.insuranceProvider = { not: null }
    } else {
      appointmentWhere.OR = [
        { insuranceProvider: null },
        { insuranceProvider: '' }
      ]
    }
  }

  // Get appointments and group by patient
  const appointments = await prisma.appointment.findMany({
    where: appointmentWhere,
    include: {
      doctor: { select: { name: true, specialization: true } },
      hospital: { select: { name: true } },
      payments: { select: { amount: true, status: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Group by patient email (unique identifier)
  const patientMap = new Map()

  appointments.forEach(appointment => {
    const patientKey = appointment.patientEmail || appointment.patientPhone
    if (!patientMap.has(patientKey)) {
      patientMap.set(patientKey, {
        patientName: appointment.patientName,
        patientEmail: appointment.patientEmail,
        patientPhone: appointment.patientPhone,
        patientNIC: appointment.patientNIC,
        patientGender: appointment.patientGender,
        patientDateOfBirth: appointment.patientDateOfBirth,
        emergencyContactName: appointment.emergencyContactName,
        emergencyContactPhone: appointment.emergencyContactPhone,
        insuranceProvider: appointment.insuranceProvider,
        insurancePolicyNumber: appointment.insurancePolicyNumber,
        totalAppointments: 0,
        completedAppointments: 0,
        totalSpent: 0,
        lastVisit: null,
        firstVisit: appointment.createdAt,
        appointments: []
      })
    }

    const patient = patientMap.get(patientKey)
    patient.totalAppointments++
    
    if (appointment.status === 'COMPLETED') {
      patient.completedAppointments++
    }

    const paidAmount = appointment.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    patient.totalSpent += paidAmount

    if (!patient.lastVisit || appointment.createdAt > patient.lastVisit) {
      patient.lastVisit = appointment.createdAt
    }

    if (appointment.createdAt < patient.firstVisit) {
      patient.firstVisit = appointment.createdAt
    }

    patient.appointments.push({
      id: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      appointmentDate: appointment.appointmentDate,
      status: appointment.status,
      doctor: appointment.doctor,
      hospital: appointment.hospital
    })
  })

  const patients = Array.from(patientMap.values())
  
  // Apply sorting
  patients.sort((a, b) => {
    const aValue = a[sortBy] || 0
    const bValue = b[sortBy] || 0
    return sortOrder === 'desc' ? 
      (bValue > aValue ? 1 : -1) : 
      (aValue > bValue ? 1 : -1)
  })

  // Apply pagination
  const paginatedPatients = patients.slice(skip, skip + limit)

  return {
    results: paginatedPatients,
    pagination: {
      page,
      limit,
      total: patients.length,
      pages: Math.ceil(patients.length / limit)
    },
    summary: {
      totalPatients: patients.length,
      averageAppointments: patients.reduce((sum, p) => sum + p.totalAppointments, 0) / patients.length,
      totalRevenue: patients.reduce((sum, p) => sum + p.totalSpent, 0)
    }
  }
}

// Search doctors
async function searchDoctors(params: any) {
  const { query, filters, sortBy, sortOrder, page, limit } = params
  const skip = (page - 1) * limit

  const where: any = {}

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { specialization: { contains: query, mode: 'insensitive' } },
      { qualification: { contains: query, mode: 'insensitive' } }
    ]
  }

  // Apply filters
  if (filters.specialization) {
    where.specialization = { contains: filters.specialization, mode: 'insensitive' }
  }

  if (filters.hospitalId) {
    where.hospitalId = filters.hospitalId
  }

  if (filters.experienceMin || filters.experienceMax) {
    where.experience = {}
    if (filters.experienceMin) {
      where.experience.gte = Number(filters.experienceMin)
    }
    if (filters.experienceMax) {
      where.experience.lte = Number(filters.experienceMax)
    }
  }

  if (filters.feeMin || filters.feeMax) {
    where.consultationFee = {}
    if (filters.feeMin) {
      where.consultationFee.gte = filters.feeMin
    }
    if (filters.feeMax) {
      where.consultationFee.lte = filters.feeMax
    }
  }

  if (filters.ratingMin) {
    where.rating = { gte: filters.ratingMin }
  }

  if (filters.isAvailable !== undefined) {
    where.isAvailable = filters.isAvailable === 'true'
  }

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        timeSlots: {
          where: {
            date: { gte: new Date() }
          },
          take: 5,
          orderBy: { date: 'asc' }
        },
        _count: {
          select: {
            appointments: true,
            timeSlots: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.doctor.count({ where })
  ])

  return {
    results: doctors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

// Search corporate packages
async function searchCorporatePackages(params: any) {
  const { query, filters, sortBy, sortOrder, page, limit } = params
  const skip = (page - 1) * limit

  const where: any = {}

  if (query) {
    where.OR = [
      { packageNumber: { contains: query, mode: 'insensitive' } },
      { packageName: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { corporate: { name: { contains: query, mode: 'insensitive' } } }
    ]
  }

  // Apply filters
  if (filters.packageType) {
    where.packageType = filters.packageType
  }

  if (filters.corporateId) {
    where.corporateId = filters.corporateId
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true'
  }

  if (filters.valueMin || filters.valueMax) {
    where.packageValue = {}
    if (filters.valueMin) {
      where.packageValue.gte = filters.valueMin
    }
    if (filters.valueMax) {
      where.packageValue.lte = filters.valueMax
    }
  }

  // Date range filters
  if (filters.validFrom || filters.validTo) {
    if (filters.validFrom) {
      where.validFromDate = { gte: new Date(filters.validFrom) }
    }
    if (filters.validTo) {
      where.validToDate = { lte: new Date(filters.validTo) }
    }
  }

  // Utilization filters
  if (filters.utilizationMin !== undefined) {
    // This requires calculated field - we'll filter after query
  }

  // Note: Replace with actual model name when available
  // For now, return empty results as corporatePackage model needs to be regenerated
  const packages: any[] = []
  const total = 0

  // Calculate utilization and apply utilization filter if needed
  let filteredPackages = packages.map(pkg => ({
    ...pkg,
    utilizationRate: pkg.totalAppointments > 0 ? 
      (pkg.usedAppointments / pkg.totalAppointments) * 100 : 0
  }))

  if (filters.utilizationMin !== undefined) {
    filteredPackages = filteredPackages.filter(
      pkg => pkg.utilizationRate >= filters.utilizationMin
    )
  }

  return {
    results: filteredPackages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

// Search users
async function searchUsers(params: any) {
  const { query, filters, sortBy, sortOrder, page, limit } = params
  const skip = (page - 1) * limit

  const where: any = {}

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { companyName: { contains: query, mode: 'insensitive' } },
      { contactNumber: { contains: query, mode: 'insensitive' } }
    ]
  }

  // Apply filters
  if (filters.role) {
    if (Array.isArray(filters.role)) {
      where.role = { in: filters.role }
    } else {
      where.role = filters.role
    }
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true'
  }

  if (filters.isEmailVerified !== undefined) {
    where.isEmailVerified = filters.isEmailVerified === 'true'
  }

  // Date filters
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {}
    if (filters.createdFrom) {
      where.createdAt.gte = new Date(filters.createdFrom)
    }
    if (filters.createdTo) {
      where.createdAt.lte = new Date(filters.createdTo)
    }
  }

  if (filters.lastLoginFrom || filters.lastLoginTo) {
    where.lastLoginAt = {}
    if (filters.lastLoginFrom) {
      where.lastLoginAt.gte = new Date(filters.lastLoginFrom)
    }
    if (filters.lastLoginTo) {
      where.lastLoginAt.lte = new Date(filters.lastLoginTo)
    }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        contactNumber: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            appointments: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.user.count({ where })
  ])

  return {
    results: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

// Search payments
async function searchPayments(params: any) {
  const { query, filters, sortBy, sortOrder, page, limit } = params
  const skip = (page - 1) * limit

  const where: any = {}

  if (query) {
    where.OR = [
      { transactionId: { contains: query, mode: 'insensitive' } },
      { appointment: { appointmentNumber: { contains: query, mode: 'insensitive' } } },
      { appointment: { patientName: { contains: query, mode: 'insensitive' } } }
    ]
  }

  // Apply filters
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      where.status = { in: filters.status }
    } else {
      where.status = filters.status
    }
  }

  if (filters.paymentMethod) {
    if (Array.isArray(filters.paymentMethod)) {
      where.paymentMethod = { in: filters.paymentMethod }
    } else {
      where.paymentMethod = filters.paymentMethod
    }
  }

  if (filters.amountMin || filters.amountMax) {
    where.amount = {}
    if (filters.amountMin) {
      where.amount.gte = filters.amountMin
    }
    if (filters.amountMax) {
      where.amount.lte = filters.amountMax
    }
  }

  // Date filters
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      where.createdAt.lte = new Date(filters.dateTo)
    }
  }

  if (filters.paidFrom || filters.paidTo) {
    where.paidAt = {}
    if (filters.paidFrom) {
      where.paidAt.gte = new Date(filters.paidFrom)
    }
    if (filters.paidTo) {
      where.paidAt.lte = new Date(filters.paidTo)
    }
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        appointment: {
          select: {
            id: true,
            appointmentNumber: true,
            patientName: true,
            appointmentDate: true,
            doctor: { select: { name: true } },
            hospital: { select: { name: true } }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.payment.count({ where })
  ])

  return {
    results: payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

// Search hospitals
async function searchHospitals(params: any) {
  const { query, filters, sortBy, sortOrder, page, limit } = params
  const skip = (page - 1) * limit

  const where: any = {}

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { address: { contains: query, mode: 'insensitive' } },
      { contactNumber: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } }
    ]
  }

  // Apply filters
  if (filters.type) {
    where.type = filters.type
  }

  if (filters.city) {
    where.address = { contains: filters.city, mode: 'insensitive' }
  }

  const [hospitals, total] = await Promise.all([
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
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.hospital.count({ where })
  ])

  return {
    results: hospitals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

// Helper function to get appointment facets for filtering UI
async function getAppointmentFacets(baseWhere: any) {
  const [
    statusFacets,
    paymentStatusFacets,
    doctorFacets,
    hospitalFacets
  ] = await Promise.all([
    prisma.appointment.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: { status: true }
    }),
    prisma.appointment.groupBy({
      by: ['paymentStatus'],
      where: baseWhere,
      _count: { paymentStatus: true }
    }),
    prisma.appointment.groupBy({
      by: ['doctorId'],
      where: baseWhere,
      _count: { doctorId: true },
      orderBy: { _count: { doctorId: 'desc' } },
      take: 10
    }),
    prisma.appointment.groupBy({
      by: ['hospitalId'],
      where: baseWhere,
      _count: { hospitalId: true },
      orderBy: { _count: { hospitalId: 'desc' } },
      take: 10
    })
  ])

  return {
    status: statusFacets,
    paymentStatus: paymentStatusFacets,
    topDoctors: doctorFacets,
    topHospitals: hospitalFacets
  }
}

// Helper function to get appointment summary
async function getAppointmentSummary(where: any) {
  const summary = await prisma.appointment.aggregate({
    where,
    _count: { id: true },
    _sum: { consultationFee: true },
    _avg: { consultationFee: true }
  })

  return {
    totalAppointments: summary._count.id,
    totalRevenue: Number(summary._sum.consultationFee || 0),
    averageFee: Number(summary._avg.consultationFee || 0)
  }
}