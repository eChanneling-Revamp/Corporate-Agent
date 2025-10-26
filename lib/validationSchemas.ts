import { z } from 'zod'

// Custom error messages
const requiredError = (field: string) => `${field} is required`
const minLengthError = (field: string, min: number) => `${field} must be at least ${min} characters`
const maxLengthError = (field: string, max: number) => `${field} must be at most ${max} characters`
const invalidFormatError = (field: string) => `Invalid ${field} format`

// Phone number regex patterns
const phoneRegex = /^(\+?94|0)?[0-9]{9}$/ // Sri Lankan format
const internationalPhoneRegex = /^\+?[1-9]\d{1,14}$/

// NIC validation (Sri Lankan)
const nicRegex = /^([0-9]{9}[x|X|v|V]|[0-9]{12})$/

// Email validation with custom error
const emailSchema = z.string()
  .min(1, requiredError('Email'))
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim()

// Password validation schemas
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const confirmPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Enhanced Login Schema
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, requiredError('Password')),
  rememberMe: z.boolean().optional()
})

// Enhanced Registration Schema
export const registerFormSchema = z.object({
  // Personal Information
  firstName: z.string()
    .min(1, requiredError('First name'))
    .min(2, minLengthError('First name', 2))
    .max(50, maxLengthError('First name', 50))
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters')
    .trim(),
  
  lastName: z.string()
    .min(1, requiredError('Last name'))
    .min(2, minLengthError('Last name', 2))
    .max(50, maxLengthError('Last name', 50))
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters')
    .trim(),
  
  email: emailSchema,
  
  phone: z.string()
    .min(1, requiredError('Phone number'))
    .regex(phoneRegex, 'Please enter a valid phone number (e.g., 0771234567)')
    .transform(val => val.replace(/\s/g, '')), // Remove spaces
  
  // Company Information
  companyName: z.string()
    .min(1, requiredError('Company name'))
    .min(2, minLengthError('Company name', 2))
    .max(100, maxLengthError('Company name', 100))
    .trim(),
  
  companyRegistrationNumber: z.string()
    .min(1, requiredError('Company registration number'))
    .regex(/^[A-Z0-9]+$/, 'Invalid registration number format')
    .optional(),
  
  designation: z.string()
    .min(1, requiredError('Designation'))
    .min(2, minLengthError('Designation', 2))
    .max(50, maxLengthError('Designation', 50))
    .trim(),
  
  // Account Security
  password: passwordSchema,
  confirmPassword: z.string().min(1, requiredError('Password confirmation')),
  
  // Terms and Conditions
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  
  subscribeToNewsletter: z.boolean().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Enhanced Appointment Booking Schema
export const appointmentBookingSchema = z.object({
  // Patient Information
  patientName: z.string()
    .min(1, requiredError('Patient name'))
    .min(3, minLengthError('Patient name', 3))
    .max(100, maxLengthError('Patient name', 100))
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters')
    .trim(),
  
  patientNIC: z.string()
    .min(1, requiredError('NIC'))
    .regex(nicRegex, 'Please enter a valid NIC number')
    .transform(val => val.toUpperCase()),
  
  patientEmail: emailSchema,
  
  patientPhone: z.string()
    .min(1, requiredError('Phone number'))
    .regex(phoneRegex, 'Please enter a valid phone number'),
  
  patientDateOfBirth: z.string()
    .min(1, requiredError('Date of birth'))
    .refine((date) => {
      const dob = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      return age >= 0 && age <= 120
    }, 'Please enter a valid date of birth'),
  
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Please select a valid gender'
  }),
  
  // Emergency Contact
  emergencyContactName: z.string()
    .min(1, requiredError('Emergency contact name'))
    .min(3, minLengthError('Emergency contact name', 3))
    .max(100, maxLengthError('Emergency contact name', 100))
    .trim(),
  
  emergencyContactPhone: z.string()
    .min(1, requiredError('Emergency contact phone'))
    .regex(phoneRegex, 'Please enter a valid phone number'),
  
  emergencyRelationship: z.string()
    .min(1, requiredError('Relationship'))
    .max(50, maxLengthError('Relationship', 50)),
  
  // Medical Information
  medicalHistory: z.string()
    .max(1000, maxLengthError('Medical history', 1000))
    .optional(),
  
  currentMedications: z.string()
    .max(500, maxLengthError('Current medications', 500))
    .optional(),
  
  allergies: z.string()
    .max(500, maxLengthError('Allergies', 500))
    .optional(),
  
  // Insurance Information (Optional)
  hasInsurance: z.boolean(),
  insuranceProvider: z.string()
    .max(100, maxLengthError('Insurance provider', 100))
    .optional(),
  
  insurancePolicyNumber: z.string()
    .max(50, maxLengthError('Policy number', 50))
    .optional(),
  
  // Appointment Details
  doctorId: z.string()
    .min(1, requiredError('Doctor'))
    .uuid('Invalid doctor selection'),
  
  timeSlotId: z.string()
    .min(1, requiredError('Time slot'))
    .uuid('Invalid time slot selection'),
  
  appointmentType: z.enum(['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY'], {
    message: 'Please select a valid appointment type'
  }),
  
  visitReason: z.string()
    .min(1, requiredError('Visit reason'))
    .min(10, minLengthError('Visit reason', 10))
    .max(500, maxLengthError('Visit reason', 500)),
  
  isFirstVisit: z.boolean(),
  
  preferredLanguage: z.enum(['ENGLISH', 'SINHALA', 'TAMIL'], {
    message: 'Please select preferred language'
  }).optional(),
  
  specialRequirements: z.string()
    .max(500, maxLengthError('Special requirements', 500))
    .optional(),
  
  // Consent
  consentToTreatment: z.boolean().refine((val) => val === true, {
    message: 'You must provide consent for treatment'
  }),
  
  agreeToPayment: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the payment terms'
  })
}).refine((data) => {
  // If has insurance, insurance details are required
  if (data.hasInsurance) {
    return data.insuranceProvider && data.insurancePolicyNumber
  }
  return true
}, {
  message: 'Insurance details are required when insurance is selected',
  path: ['insuranceProvider']
})

// Doctor Search Schema
export const doctorSearchSchema = z.object({
  search: z.string().optional(),
  specialization: z.string().optional(),
  hospitalId: z.string().uuid().optional(),
  city: z.string().optional(),
  availableDate: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxConsultationFee: z.number().positive().optional(),
  languages: z.array(z.string()).optional(),
  consultationType: z.enum(['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY']).optional()
})

// Payment Information Schema
export const paymentFormSchema = z.object({
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH'], {
    message: 'Please select a payment method'
  }),
  
  // Card Details (for card payments)
  cardNumber: z.string()
    .regex(/^[0-9]{16}$/, 'Card number must be 16 digits')
    .optional(),
  
  cardholderName: z.string()
    .min(3, minLengthError('Cardholder name', 3))
    .max(100, maxLengthError('Cardholder name', 100))
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters')
    .optional(),
  
  expiryMonth: z.string()
    .regex(/^(0[1-9]|1[0-2])$/, 'Invalid month')
    .optional(),
  
  expiryYear: z.string()
    .regex(/^20[2-9][0-9]$/, 'Invalid year')
    .optional(),
  
  cvv: z.string()
    .regex(/^[0-9]{3,4}$/, 'CVV must be 3 or 4 digits')
    .optional(),
  
  // Bank Transfer Details
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  
  // Billing Address
  billingAddress: z.string()
    .min(5, minLengthError('Billing address', 5))
    .max(200, maxLengthError('Billing address', 200)),
  
  billingCity: z.string()
    .min(2, minLengthError('City', 2))
    .max(50, maxLengthError('City', 50)),
  
  billingPostalCode: z.string()
    .regex(/^[0-9]{5}$/, 'Postal code must be 5 digits'),
  
  // Save payment info
  savePaymentInfo: z.boolean().optional()
}).superRefine((data, ctx) => {
  // Validate card details if payment method is card
  if (data.paymentMethod === 'CREDIT_CARD' || data.paymentMethod === 'DEBIT_CARD') {
    if (!data.cardNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredError('Card number'),
        path: ['cardNumber']
      })
    }
    if (!data.cardholderName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredError('Cardholder name'),
        path: ['cardholderName']
      })
    }
    if (!data.expiryMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredError('Expiry month'),
        path: ['expiryMonth']
      })
    }
    if (!data.expiryYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredError('Expiry year'),
        path: ['expiryYear']
      })
    }
    if (!data.cvv) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredError('CVV'),
        path: ['cvv']
      })
    }
  }
  
  // Validate bank details if payment method is bank transfer
  if (data.paymentMethod === 'BANK_TRANSFER') {
    if (!data.bankName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredError('Bank name'),
        path: ['bankName']
      })
    }
    if (!data.accountNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredError('Account number'),
        path: ['accountNumber']
      })
    }
  }
})

// Contact Form Schema
export const contactFormSchema = z.object({
  name: z.string()
    .min(1, requiredError('Name'))
    .min(3, minLengthError('Name', 3))
    .max(100, maxLengthError('Name', 100))
    .trim(),
  
  email: emailSchema,
  
  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional(),
  
  subject: z.string()
    .min(1, requiredError('Subject'))
    .min(5, minLengthError('Subject', 5))
    .max(200, maxLengthError('Subject', 200))
    .trim(),
  
  message: z.string()
    .min(1, requiredError('Message'))
    .min(20, minLengthError('Message', 20))
    .max(2000, maxLengthError('Message', 2000))
    .trim(),
  
  category: z.enum(['GENERAL', 'SUPPORT', 'BILLING', 'FEEDBACK', 'COMPLAINT'], {
    message: 'Please select a category'
  })
})

// Profile Update Schema
export const profileUpdateSchema = z.object({
  firstName: z.string()
    .min(2, minLengthError('First name', 2))
    .max(50, maxLengthError('First name', 50))
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters')
    .trim(),
  
  lastName: z.string()
    .min(2, minLengthError('Last name', 2))
    .max(50, maxLengthError('Last name', 50))
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters')
    .trim(),
  
  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid phone number'),
  
  dateOfBirth: z.string().optional(),
  
  address: z.string()
    .min(5, minLengthError('Address', 5))
    .max(200, maxLengthError('Address', 200))
    .optional(),
  
  city: z.string()
    .min(2, minLengthError('City', 2))
    .max(50, maxLengthError('City', 50))
    .optional(),
  
  postalCode: z.string()
    .regex(/^[0-9]{5}$/, 'Postal code must be 5 digits')
    .optional(),
  
  bio: z.string()
    .max(500, maxLengthError('Bio', 500))
    .optional()
})

// Change Password Schema
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, requiredError('Current password')),
  
  newPassword: passwordSchema,
  
  confirmNewPassword: z.string()
    .min(1, requiredError('Password confirmation'))
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"]
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"]
})

// Feedback/Review Schema
export const reviewSchema = z.object({
  rating: z.number()
    .min(1, 'Please provide a rating')
    .max(5, 'Rating must be between 1 and 5'),
  
  title: z.string()
    .min(1, requiredError('Review title'))
    .min(5, minLengthError('Review title', 5))
    .max(100, maxLengthError('Review title', 100))
    .trim(),
  
  comment: z.string()
    .min(1, requiredError('Review comment'))
    .min(20, minLengthError('Review comment', 20))
    .max(1000, maxLengthError('Review comment', 1000))
    .trim(),
  
  wouldRecommend: z.boolean(),
  
  appointmentId: z.string().uuid('Invalid appointment reference')
})

// Customer Management Schemas
export const customerCreateSchema = z.object({
  firstName: z.string()
    .min(1, requiredError('First name'))
    .min(2, minLengthError('First name', 2))
    .max(50, maxLengthError('First name', 50))
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters')
    .trim(),
  
  lastName: z.string()
    .min(1, requiredError('Last name'))
    .min(2, minLengthError('Last name', 2))
    .max(50, maxLengthError('Last name', 50))
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters')
    .trim(),
  
  email: emailSchema,
  
  phone: z.string()
    .min(1, requiredError('Phone number'))
    .regex(phoneRegex, 'Please enter a valid phone number')
    .transform(val => val.replace(/\s/g, '')),
  
  dateOfBirth: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true
      const dob = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      return age >= 0 && age <= 120
    }, 'Please enter a valid date of birth'),
  
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  
  // Address Information
  street: z.string().max(200, maxLengthError('Street address', 200)).optional(),
  city: z.string().max(100, maxLengthError('City', 100)).optional(),
  state: z.string().max(100, maxLengthError('State/Province', 100)).optional(),
  zipCode: z.string().regex(/^[0-9]{5,10}$/, 'Invalid ZIP/postal code').optional(),
  country: z.string().max(100, maxLengthError('Country', 100)).default('Sri Lanka'),
  
  // Emergency Contact
  emergencyContactName: z.string()
    .max(100, maxLengthError('Emergency contact name', 100))
    .optional(),
  
  emergencyContactRelationship: z.string()
    .max(50, maxLengthError('Relationship', 50))
    .optional(),
  
  emergencyContactPhone: z.string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional(),
  
  // Medical Information
  bloodType: z.string()
    .regex(/^(A|B|AB|O)[+-]?$/, 'Invalid blood type')
    .optional(),
  
  allergies: z.array(z.string().max(100)).max(20, 'Too many allergies listed').optional(),
  chronicConditions: z.array(z.string().max(100)).max(20, 'Too many conditions listed').optional(),
  currentMedications: z.array(z.string().max(100)).max(50, 'Too many medications listed').optional(),
  
  // Insurance Information
  insuranceProvider: z.string().max(100, maxLengthError('Insurance provider', 100)).optional(),
  insurancePolicyNumber: z.string().max(50, maxLengthError('Policy number', 50)).optional(),
  insuranceGroupNumber: z.string().max(50, maxLengthError('Group number', 50)).optional(),
  insuranceValidUntil: z.string().optional(),
  
  // Preferences
  preferredLanguage: z.string().max(50).default('English'),
  communicationMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'WHATSAPP']).default('EMAIL'),
  appointmentReminders: z.boolean().default(true),
  newsletterSubscription: z.boolean().default(false),
  
  // Management
  tags: z.array(z.string().max(50)).max(10, 'Too many tags').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED']).default('ACTIVE'),
  assignedAgentId: z.string().uuid().optional()
})

export const customerUpdateSchema = customerCreateSchema.partial().extend({
  id: z.string().min(1, requiredError('Customer ID'))
})

export const customerSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED']).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  assignedAgentId: z.string().uuid().optional(),
  ageRange: z.string().optional(),
  tags: z.array(z.string()).optional(),
  communicationMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'WHATSAPP']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt', 'lastAppointmentAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Support Ticket Schemas
export const supportTicketCreateSchema = z.object({
  customerId: z.string()
    .min(1, requiredError('Customer'))
    .uuid('Invalid customer selection'),
  
  customerName: z.string()
    .min(1, requiredError('Customer name'))
    .min(3, minLengthError('Customer name', 3))
    .max(100, maxLengthError('Customer name', 100))
    .trim(),
  
  customerEmail: emailSchema,
  
  title: z.string()
    .min(1, requiredError('Ticket title'))
    .min(5, minLengthError('Title', 5))
    .max(200, maxLengthError('Title', 200))
    .trim(),
  
  description: z.string()
    .min(1, requiredError('Description'))
    .min(20, minLengthError('Description', 20))
    .max(2000, maxLengthError('Description', 2000))
    .trim(),
  
  category: z.enum(['TECHNICAL', 'BILLING', 'APPOINTMENT', 'COMPLAINT', 'GENERAL', 'EMERGENCY', 'FEEDBACK'], {
    message: 'Please select a category'
  }),
  
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).default('MEDIUM'),
  
  assignedAgentId: z.string().uuid().optional(),
  
  tags: z.array(z.string().max(50)).max(10, 'Too many tags').optional(),
  
  estimatedResolutionAt: z.string().optional()
})

export const supportTicketUpdateSchema = z.object({
  id: z.string().min(1, requiredError('Ticket ID')),
  
  title: z.string()
    .min(5, minLengthError('Title', 5))
    .max(200, maxLengthError('Title', 200))
    .trim()
    .optional(),
  
  description: z.string()
    .min(20, minLengthError('Description', 20))
    .max(2000, maxLengthError('Description', 2000))
    .trim()
    .optional(),
  
  category: z.enum(['TECHNICAL', 'BILLING', 'APPOINTMENT', 'COMPLAINT', 'GENERAL', 'EMERGENCY', 'FEEDBACK']).optional(),
  
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_AGENT', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
  
  assignedAgentId: z.string().uuid().nullable().optional(),
  
  tags: z.array(z.string().max(50)).max(10, 'Too many tags').optional(),
  
  estimatedResolutionAt: z.string().nullable().optional(),
  
  resolutionNotes: z.string()
    .max(1000, maxLengthError('Resolution notes', 1000))
    .optional(),
  
  satisfactionRating: z.number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional()
})

export const ticketMessageCreateSchema = z.object({
  ticketId: z.string()
    .min(1, requiredError('Ticket ID'))
    .uuid('Invalid ticket ID'),
  
  message: z.string()
    .min(1, requiredError('Message'))
    .min(1, minLengthError('Message', 1))
    .max(2000, maxLengthError('Message', 2000))
    .trim(),
  
  senderName: z.string()
    .min(1, requiredError('Sender name'))
    .max(100, maxLengthError('Sender name', 100)),
  
  senderType: z.enum(['CUSTOMER', 'AGENT', 'SYSTEM', 'ADMIN']),
  
  attachments: z.array(z.string().url('Invalid attachment URL')).max(5, 'Too many attachments').optional(),
  
  isInternal: z.boolean().default(false)
})

export const supportTicketSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_AGENT', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  category: z.enum(['TECHNICAL', 'BILLING', 'APPOINTMENT', 'COMPLAINT', 'GENERAL', 'EMERGENCY', 'FEEDBACK']).optional(),
  assignedAgentId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['ticketNumber', 'title', 'priority', 'status', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Export all schemas
export const validationSchemas = {
  login: loginFormSchema,
  register: registerFormSchema,
  appointmentBooking: appointmentBookingSchema,
  doctorSearch: doctorSearchSchema,
  payment: paymentFormSchema,
  contact: contactFormSchema,
  profileUpdate: profileUpdateSchema,
  changePassword: changePasswordSchema,
  review: reviewSchema,
  
  // Customer Management
  customerCreate: customerCreateSchema,
  customerUpdate: customerUpdateSchema,
  customerSearch: customerSearchSchema,
  
  // Support Tickets
  supportTicketCreate: supportTicketCreateSchema,
  supportTicketUpdate: supportTicketUpdateSchema,
  ticketMessageCreate: ticketMessageCreateSchema,
  supportTicketSearch: supportTicketSearchSchema
}

// Type exports for TypeScript
export type LoginFormData = z.infer<typeof loginFormSchema>
export type RegisterFormData = z.infer<typeof registerFormSchema>
export type AppointmentBookingData = z.infer<typeof appointmentBookingSchema>
export type DoctorSearchData = z.infer<typeof doctorSearchSchema>
export type PaymentFormData = z.infer<typeof paymentFormSchema>
export type ContactFormData = z.infer<typeof contactFormSchema>
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>
export type ChangePasswordData = z.infer<typeof changePasswordSchema>
export type ReviewData = z.infer<typeof reviewSchema>

// Customer Management Types
export type CustomerCreateData = z.infer<typeof customerCreateSchema>
export type CustomerUpdateData = z.infer<typeof customerUpdateSchema>
export type CustomerSearchData = z.infer<typeof customerSearchSchema>

// Support Ticket Types
export type SupportTicketCreateData = z.infer<typeof supportTicketCreateSchema>
export type SupportTicketUpdateData = z.infer<typeof supportTicketUpdateSchema>
export type TicketMessageCreateData = z.infer<typeof ticketMessageCreateSchema>
export type SupportTicketSearchData = z.infer<typeof supportTicketSearchSchema>
