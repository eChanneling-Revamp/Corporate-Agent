import { z } from 'zod'
import { NextApiRequest, NextApiResponse } from 'next'

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  contactNumber: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
})

export const doctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  specialization: z.string().min(2, 'Specialization required'),
  qualifications: z.string().min(2, 'Qualifications required'),
  experience: z.string().min(1, 'Experience required'),
  consultationTypes: z.array(z.string()).min(1, 'At least one consultation type required'),
  languages: z.array(z.string()).min(1, 'At least one language required'),
  availableDays: z.array(z.string()).min(1, 'At least one available day required'),
  hospitalId: z.string().uuid('Invalid hospital ID')
})

export const hospitalSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City required'),
  district: z.string().min(2, 'District required'),
  contactNumber: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email format'),
  facilities: z.array(z.string()).min(1, 'At least one facility required')
})

export const appointmentSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  timeSlotId: z.string().uuid('Invalid time slot ID'),
  patientName: z.string().min(2, 'Patient name required'),
  patientEmail: z.string().email('Invalid email format'),
  patientPhone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format'),
  patientAge: z.number().min(1).max(150, 'Invalid age'),
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  appointmentType: z.enum(['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY']),
  medicalHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  allergies: z.string().optional()
})

export const timeSlotSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  date: z.string().datetime('Invalid date format'),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  maxAppointments: z.number().min(1, 'Max appointments must be at least 1'),
  consultationFee: z.number().min(0, 'Consultation fee must be positive')
})

// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: NextApiRequest, res: NextApiResponse, next: Function) => {
    try {
      const validatedData = schema.parse(req.body)
      req.body = validatedData
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid request data'
      })
    }
  }
}

// API response helpers
export const apiResponse = {
  success: (data: any, message: string = 'Success') => ({
    success: true,
    message,
    data
  }),
  
  error: (message: string, statusCode: number = 400, errors?: any) => ({
    success: false,
    message,
    errors,
    statusCode
  }),
  
  paginated: (data: any[], pagination: any, message: string = 'Success') => ({
    success: true,
    message,
    data,
    pagination
  })
}

// Error handler
export const handleApiError = (error: any, res: NextApiResponse) => {
  console.error('API Error:', error)
  
  if (error.code === 'P2002') {
    return res.status(409).json(apiResponse.error('Resource already exists', 409))
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json(apiResponse.error('Resource not found', 404))
  }
  
  return res.status(500).json(apiResponse.error('Internal server error', 500))
}