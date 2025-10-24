import { z } from 'zod'

// Common validation patterns
const phoneRegex = /^(\+94|0)?[0-9]{9,10}$/
const nicRegex = /^([0-9]{9}[xXvV]|[0-9]{12})$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Common field validations
export const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 characters')
  .regex(phoneRegex, 'Invalid phone number format')
  .transform(val => val.replace(/\D/g, ''))

export const emailSchema = z.string()
  .email('Invalid email address')
  .toLowerCase()
  .trim()

export const nicSchema = z.string()
  .regex(nicRegex, 'Invalid NIC format (e.g., 123456789V or 123456789012)')
  .toUpperCase()

// Authentication Schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  companyName: z.string().min(2, 'Company name is required'),
  companyRegistration: z.string().optional(),
  department: z.string().optional(),
  contactNumber: phoneSchema,
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Appointment Booking Schemas
export const patientDetailsSchema = z.object({
  patientName: z.string().min(2, 'Patient name is required'),
  patientEmail: emailSchema.optional(),
  patientPhone: phoneSchema,
  patientNIC: nicSchema.optional(),
  patientAge: z.number()
    .min(0, 'Age cannot be negative')
    .max(150, 'Please enter a valid age'),
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER']).describe('Please select a gender'),
  patientAddress: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  isNewPatient: z.boolean().default(true),
})

export const medicalDetailsSchema = z.object({
  medicalHistory: z.string().max(1000, 'Medical history is too long').optional(),
  currentMedications: z.string().max(500, 'Medication list is too long').optional(),
  allergies: z.string().max(500, 'Allergy list is too long').optional(),
  specialRequirements: z.string().max(500, 'Special requirements are too long').optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
})

export const appointmentBookingSchema = z.object({
  doctorId: z.string().uuid('Please select a doctor'),
  hospitalId: z.string().uuid('Please select a hospital'),
  timeSlotId: z.string().uuid('Please select a time slot'),
  appointmentDate: z.date().min(new Date(), 'Appointment date cannot be in the past'),
  appointmentType: z.enum(['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'CHECKUP']).describe('Please select appointment type'),
  reasonForVisit: z.string()
    .min(10, 'Please provide more details about your visit')
    .max(500, 'Reason is too long'),
  ...patientDetailsSchema.shape,
  ...medicalDetailsSchema.shape,
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'CASH', 'INSURANCE']).describe('Please select a payment method'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the booking terms'
  }),
})

// Bulk Booking Schema
export const bulkPatientSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: emailSchema.optional(),
  phone: phoneSchema,
  nic: nicSchema.optional(),
  age: z.number().min(0).max(150),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  medicalHistory: z.string().optional(),
})

export const bulkBookingSchema = z.object({
  doctorId: z.string().uuid('Please select a doctor'),
  hospitalId: z.string().uuid('Please select a hospital'),
  appointmentDate: z.date().min(new Date(), 'Date cannot be in the past'),
  appointmentType: z.enum(['CONSULTATION', 'FOLLOW_UP', 'CHECKUP']),
  patients: z.array(bulkPatientSchema)
    .min(2, 'At least 2 patients required for bulk booking')
    .max(20, 'Maximum 20 patients allowed per bulk booking'),
  paymentMethod: z.enum(['CORPORATE_ACCOUNT', 'INVOICE', 'PREPAID']),
  corporateAccount: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

// Doctor Search Schema
export const doctorSearchSchema = z.object({
  search: z.string().optional(),
  specialization: z.string().optional(),
  hospital: z.string().optional(),
  location: z.string().optional(),
  date: z.date().optional(),
  consultationType: z.enum(['IN_PERSON', 'VIDEO', 'AUDIO']).optional(),
  priceRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  rating: z.number().min(0).max(5).optional(),
  availability: z.enum(['TODAY', 'TOMORROW', 'THIS_WEEK', 'NEXT_WEEK']).optional(),
})

// Payment Schema
export const paymentSchema = z.object({
  appointmentId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'CASH', 'INSURANCE']),
  cardDetails: z.object({
    cardNumber: z.string()
      .regex(/^[0-9]{16}$/, 'Card number must be 16 digits')
      .optional(),
    cardHolder: z.string().min(2).optional(),
    expiryMonth: z.number().min(1).max(12).optional(),
    expiryYear: z.number().min(new Date().getFullYear()).optional(),
    cvv: z.string().regex(/^[0-9]{3,4}$/, 'CVV must be 3 or 4 digits').optional(),
  }).optional(),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional(),
  }).optional(),
  insuranceDetails: z.object({
    provider: z.string().optional(),
    policyNumber: z.string().optional(),
    membershipNumber: z.string().optional(),
  }).optional(),
  billingAddress: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().regex(/^[0-9]{5}$/),
    country: z.string().min(2),
  }).optional(),
})

// Report Generation Schema
export const reportGenerationSchema = z.object({
  reportType: z.enum([
    'APPOINTMENTS',
    'PAYMENTS',
    'PATIENTS',
    'DOCTORS',
    'PERFORMANCE',
    'REVENUE'
  ]),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }).refine(data => data.to >= data.from, {
    message: 'End date must be after start date',
  }),
  filters: z.object({
    status: z.array(z.string()).optional(),
    doctorIds: z.array(z.string()).optional(),
    hospitalIds: z.array(z.string()).optional(),
    patientIds: z.array(z.string()).optional(),
    agentIds: z.array(z.string()).optional(),
  }).optional(),
  format: z.enum(['PDF', 'EXCEL', 'CSV']),
  includeDetails: z.boolean().default(true),
  groupBy: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']).optional(),
})

// Profile Update Schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  companyName: z.string().min(2).optional(),
  department: z.string().optional(),
  avatar: z.string().url().optional(),
  notifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    appointmentReminders: z.boolean(),
    paymentAlerts: z.boolean(),
    systemUpdates: z.boolean(),
  }).optional(),
  preferences: z.object({
    language: z.enum(['en', 'si', 'ta']),
    timezone: z.string(),
    dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
    timeFormat: z.enum(['12h', '24h']),
    theme: z.enum(['light', 'dark', 'auto']),
  }).optional(),
})

// Agent Management Schema
export const agentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: emailSchema,
  phone: phoneSchema,
  role: z.enum(['ADMIN', 'AGENT', 'SUPERVISOR', 'MANAGER']),
  department: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
})

// Task Management Schema
export const taskSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  dueDate: z.date().optional(),
  assignedTo: z.string().uuid().optional(),
  relatedAppointmentId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
})

// Feedback Schema
export const feedbackSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  rating: z.number().min(1).max(5),
  feedback: z.string().min(10, 'Please provide at least 10 characters of feedback').max(1000),
  category: z.enum(['SERVICE', 'DOCTOR', 'FACILITY', 'BOOKING', 'OTHER']),
  wouldRecommend: z.boolean(),
  anonymous: z.boolean().default(false),
})

// Export all schemas
export const schemas = {
  login: loginSchema,
  register: registerSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  patientDetails: patientDetailsSchema,
  medicalDetails: medicalDetailsSchema,
  appointmentBooking: appointmentBookingSchema,
  bulkBooking: bulkBookingSchema,
  doctorSearch: doctorSearchSchema,
  payment: paymentSchema,
  reportGeneration: reportGenerationSchema,
  profileUpdate: profileUpdateSchema,
  agent: agentSchema,
  task: taskSchema,
  feedback: feedbackSchema,
}

// Type exports
export type LoginSchema = z.infer<typeof loginSchema>
export type RegisterSchema = z.infer<typeof registerSchema>
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>
export type PatientDetailsSchema = z.infer<typeof patientDetailsSchema>
export type MedicalDetailsSchema = z.infer<typeof medicalDetailsSchema>
export type AppointmentBookingSchema = z.infer<typeof appointmentBookingSchema>
export type BulkBookingSchema = z.infer<typeof bulkBookingSchema>
export type DoctorSearchSchema = z.infer<typeof doctorSearchSchema>
export type PaymentSchema = z.infer<typeof paymentSchema>
export type ReportGenerationSchema = z.infer<typeof reportGenerationSchema>
export type ProfileUpdateSchema = z.infer<typeof profileUpdateSchema>
export type AgentSchema = z.infer<typeof agentSchema>
export type TaskSchema = z.infer<typeof taskSchema>
export type FeedbackSchema = z.infer<typeof feedbackSchema>
