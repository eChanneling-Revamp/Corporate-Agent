import apiClient from './authService'

export interface Appointment {
  id: string
  appointmentNumber: string
  patientName: string
  patientEmail: string
  patientPhone: string
  patientNIC?: string
  patientDateOfBirth?: string
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER'
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalHistory?: string
  currentMedications?: string
  allergies?: string
  insuranceProvider?: string
  insurancePolicyNumber?: string
  isNewPatient: boolean
  doctorId: string
  hospitalId: string
  timeSlotId: string
  appointmentDate: string
  appointmentTime: string
  estimatedWaitTime?: number
  queuePosition?: number
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'RESCHEDULED'
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  consultationFee: number
  totalAmount: number
  notes?: string
  cancellationReason?: string
  cancellationDate?: string
  createdAt: string
  updatedAt: string
  doctor?: any
  hospital?: any
  timeSlot?: any
  bookedBy?: any
  payments?: any[]
  isUpcoming?: boolean
  isPast?: boolean
  canCancel?: boolean
  canReschedule?: boolean
}

export interface AppointmentFilters {
  status?: string
  doctorId?: string
  hospitalId?: string
  dateFrom?: string
  dateTo?: string
  patientEmail?: string
  appointmentNumber?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface BookAppointmentData {
  doctorId: string
  timeSlotId: string
  patientName: string
  patientEmail: string
  patientPhone: string
  patientAge: number
  patientGender: 'MALE' | 'FEMALE' | 'OTHER'
  appointmentType: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY'
  medicalHistory?: string
  currentMedications?: string
  allergies?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  insuranceProvider?: string
  insurancePolicyNumber?: string
  isNewPatient?: boolean
}

export const appointmentAPI = {
  // Get all appointments with optional filters
  getAppointments: async (filters: AppointmentFilters = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/appointments?${params.toString()}`)
    return response.data
  },

  // Get appointment by ID
  getAppointmentById: async (id: string) => {
    const response = await apiClient.get(`/appointments/${id}`)
    return response.data
  },

  // Create new appointment
  createAppointment: async (appointmentData: BookAppointmentData) => {
    const response = await apiClient.post('/appointments', appointmentData)
    return response.data
  },

  // Update appointment
  updateAppointment: async (id: string, appointmentData: Partial<Appointment>) => {
    const response = await apiClient.put(`/appointments/${id}`, appointmentData)
    return response.data
  },

  // Cancel appointment
  cancelAppointment: async (id: string, reason?: string) => {
    const response = await apiClient.patch(`/appointments/${id}/cancel`, { 
      cancellationReason: reason 
    })
    return response.data
  },

  // Reschedule appointment
  rescheduleAppointment: async (id: string, newTimeSlotId: string) => {
    const response = await apiClient.patch(`/appointments/${id}/reschedule`, {
      timeSlotId: newTimeSlotId
    })
    return response.data
  },

  // Confirm appointment
  confirmAppointment: async (id: string) => {
    const response = await apiClient.patch(`/appointments/${id}/confirm`)
    return response.data
  },

  // Mark appointment as completed
  completeAppointment: async (id: string, notes?: string) => {
    const response = await apiClient.patch(`/appointments/${id}/complete`, {
      notes
    })
    return response.data
  },

  // Mark appointment as no-show
  markNoShow: async (id: string, reason?: string) => {
    const response = await apiClient.patch(`/appointments/${id}/no-show`, {
      notes: reason
    })
    return response.data
  },

  // Get appointment statistics
  getAppointmentStats: async (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams()
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)
    
    const response = await apiClient.get(`/appointments/stats?${params.toString()}`)
    return response.data
  },

  // Get today's appointments
  getTodayAppointments: async () => {
    const today = new Date().toISOString().split('T')[0]
    return await appointmentAPI.getAppointments({
      dateFrom: today,
      dateTo: today,
      sortBy: 'appointmentTime',
      sortOrder: 'asc'
    })
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (limit: number = 10) => {
    const today = new Date().toISOString().split('T')[0]
    return await appointmentAPI.getAppointments({
      dateFrom: today,
      status: 'CONFIRMED',
      sortBy: 'appointmentDate',
      sortOrder: 'asc',
      limit
    })
  },

  // Get patient's appointment history
  getPatientAppointments: async (patientEmail: string) => {
    return await appointmentAPI.getAppointments({
      patientEmail,
      sortBy: 'appointmentDate',
      sortOrder: 'desc'
    })
  },

  // Search appointments by appointment number
  searchByAppointmentNumber: async (appointmentNumber: string) => {
    return await appointmentAPI.getAppointments({
      appointmentNumber
    })
  },

  // Get appointment by confirmation code
  getByConfirmationCode: async (code: string) => {
    const response = await apiClient.get(`/appointments/confirm/${code}`)
    return response.data
  },

  // Bulk operations
  bulkUpdateStatus: async (appointmentIds: string[], status: string) => {
    const response = await apiClient.patch('/appointments/bulk-update', {
      appointmentIds,
      status
    })
    return response.data
  },

  // Export appointments
  exportAppointments: async (filters: AppointmentFilters = {}, format: 'csv' | 'pdf' | 'excel' = 'csv') => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    params.append('format', format)

    const response = await apiClient.get(`/appointments/export?${params.toString()}`, {
      responseType: 'blob'
    })
    return response.data
  }
}

export default appointmentAPI