import { NextApiRequest, NextApiResponse } from 'next'

// Export Templates API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getExportTemplates(req, res)
  } else if (req.method === 'POST') {
    return createExportTemplate(req, res)
  } else {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }
}

// Get export templates
async function getExportTemplates(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { entityType } = req.query

    // Predefined export templates for different entity types
    const templates = getDefaultExportTemplates()

    // Filter by entity type if specified
    const filteredTemplates = entityType 
      ? templates.filter(template => template.entityType === entityType)
      : templates

    return res.status(200).json({
      success: true,
      data: {
        templates: filteredTemplates
      }
    })

  } catch (error) {
    console.error('Get Export Templates Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Create export template
async function createExportTemplate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      name,
      description,
      entityType,
      format,
      columns,
      filters,
      createdBy
    } = req.body

    // Validate required fields
    if (!name || !entityType || !format || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Name, entity type, format, and created by are required'
      })
    }

    // Create new template
    const newTemplate = {
      id: `template_${Date.now()}`,
      name,
      description: description || '',
      entityType,
      format,
      columns: columns || getDefaultColumns(entityType),
      filters: filters || {},
      isDefault: false,
      createdBy,
      createdAt: new Date().toISOString()
    }

    // In production, save to database
    // For demo purposes, just return the template
    
    return res.status(201).json({
      success: true,
      message: 'Export template created successfully',
      data: {
        template: newTemplate
      }
    })

  } catch (error) {
    console.error('Create Export Template Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Get default export templates
function getDefaultExportTemplates() {
  return [
    // Appointments Templates
    {
      id: 'template_appointments_basic',
      name: 'Basic Appointment Report',
      description: 'Essential appointment information',
      entityType: 'appointments',
      format: 'excel',
      columns: [
        'appointmentNumber',
        'patientName',
        'patientEmail',
        'patientPhone',
        'doctor.name',
        'hospital.name',
        'appointmentDate',
        'appointmentTime',
        'status',
        'consultationFee'
      ],
      filters: {},
      isDefault: true,
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'template_appointments_detailed',
      name: 'Detailed Appointment Report',
      description: 'Comprehensive appointment information including patient details',
      entityType: 'appointments',
      format: 'excel',
      columns: [
        'appointmentNumber',
        'patientName',
        'patientEmail',
        'patientPhone',
        'patientNIC',
        'patientGender',
        'patientDateOfBirth',
        'doctor.name',
        'doctor.specialization',
        'hospital.name',
        'hospital.city',
        'appointmentDate',
        'appointmentTime',
        'status',
        'paymentStatus',
        'consultationFee',
        'totalAmount',
        'medicalHistory',
        'currentMedications',
        'allergies',
        'createdAt'
      ],
      filters: {},
      isDefault: false,
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'template_appointments_financial',
      name: 'Financial Appointment Report',
      description: 'Appointment report focused on payment and financial data',
      entityType: 'appointments',
      format: 'excel',
      columns: [
        'appointmentNumber',
        'patientName',
        'doctor.name',
        'hospital.name',
        'appointmentDate',
        'status',
        'paymentStatus',
        'consultationFee',
        'totalAmount',
        'payments.amount',
        'payments.paymentMethod',
        'payments.transactionId',
        'payments.paidAt'
      ],
      filters: {},
      isDefault: false,
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00.000Z'
    },

    // Patients Templates
    {
      id: 'template_patients_basic',
      name: 'Basic Patient List',
      description: 'Basic patient contact information',
      entityType: 'patients',
      format: 'csv',
      columns: [
        'patientName',
        'patientEmail',
        'patientPhone',
        'patientGender',
        'patientDateOfBirth'
      ],
      filters: {},
      isDefault: true,
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'template_patients_medical',
      name: 'Patient Medical Information',
      description: 'Patient list with medical history and conditions',
      entityType: 'patients',
      format: 'excel',
      columns: [
        'patientName',
        'patientEmail',
        'patientPhone',
        'patientNIC',
        'patientGender',
        'patientDateOfBirth',
        'emergencyContactName',
        'emergencyContactPhone',
        'medicalHistory',
        'currentMedications',
        'allergies',
        'insuranceProvider',
        'insurancePolicyNumber'
      ],
      filters: {},
      isDefault: false,
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00.000Z'
    },

    // Doctors Templates
    {
      id: 'template_doctors_basic',
      name: 'Doctor Directory',
      description: 'Basic doctor information and contact details',
      entityType: 'doctors',
      format: 'excel',
      columns: [
        'name',
        'email',
        'specialization',
        'qualification',
        'experience',
        'consultationFee',
        'hospital.name',
        'hospital.city',
        'isActive'
      ],
      filters: { isActive: true },
      isDefault: true,
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'template_doctors_performance',
      name: 'Doctor Performance Report',
      description: 'Doctor performance metrics and appointment statistics',
      entityType: 'doctors',
      format: 'excel',
      columns: [
        'name',
        'specialization',
        'hospital.name',
        'consultationFee',
        'rating',
        '_count.appointments',
        '_count.timeSlots',
        'isActive',
        'createdAt'
      ],
      filters: {},
      isDefault: false,
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00.000Z'
    },

    // Hospitals Templates
    {
      id: 'template_hospitals_directory',
      name: 'Hospital Directory',
      description: 'Hospital contact information and details',
      entityType: 'hospitals',
      format: 'excel',
      columns: [
        'name',
        'address',
        'city',
        'district',
        'contactNumber',
        'email',
        'website',
        'facilities',
        '_count.doctors',
        'isActive'
      ],
      filters: { isActive: true },
      isDefault: true,
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00.000Z'
    },

    // Users Templates
    {
      id: 'template_users_agents',
      name: 'Agent User List',
      description: 'List of agent users with contact information',
      entityType: 'users',
      format: 'csv',
      columns: [
        'name',
        'email',
        'role',
        'companyName',
        'contactNumber',
        'isActive',
        'isEmailVerified',
        'lastLoginAt',
        '_count.appointments',
        'createdAt'
      ],
      filters: { role: 'AGENT' },
      isDefault: true,
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00.000Z'
    },

    // Payments Templates
    {
      id: 'template_payments_summary',
      name: 'Payment Summary Report',
      description: 'Payment transactions summary',
      entityType: 'payments',
      format: 'excel',
      columns: [
        'amount',
        'currency',
        'paymentMethod',
        'transactionId',
        'status',
        'appointment.appointmentNumber',
        'appointment.patientName',
        'appointment.doctor.name',
        'paidAt',
        'createdAt'
      ],
      filters: {},
      isDefault: true,
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  ]
}

// Get default columns for entity type
function getDefaultColumns(entityType: string): string[] {
  const columnMappings: Record<string, string[]> = {
    appointments: [
      'appointmentNumber', 'patientName', 'patientEmail', 'patientPhone',
      'doctor.name', 'hospital.name', 'appointmentDate', 'appointmentTime',
      'status', 'paymentStatus', 'consultationFee', 'totalAmount', 'createdAt'
    ],
    patients: [
      'patientName', 'patientEmail', 'patientPhone', 'patientNIC',
      'patientGender', 'patientDateOfBirth', 'emergencyContactName',
      'emergencyContactPhone', 'medicalHistory', 'currentMedications',
      'allergies', 'insuranceProvider', 'insurancePolicyNumber'
    ],
    doctors: [
      'name', 'email', 'specialization', 'qualification', 'experience',
      'consultationFee', 'rating', 'hospital.name', 'isActive', 'createdAt'
    ],
    hospitals: [
      'name', 'address', 'city', 'district', 'contactNumber', 'email',
      'website', 'facilities', 'isActive', 'createdAt'
    ],
    users: [
      'name', 'email', 'role', 'companyName', 'contactNumber', 'isActive',
      'isEmailVerified', 'lastLoginAt', 'createdAt'
    ],
    payments: [
      'amount', 'currency', 'paymentMethod', 'transactionId', 'status',
      'appointment.appointmentNumber', 'appointment.patientName',
      'paidAt', 'createdAt'
    ]
  }

  return columnMappings[entityType] || []
}