import apiClient from './authService'

export interface TimeSlot {
  id: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  maxAppointments: number
  currentBookings: number
  isActive: boolean
  consultationFee: number
  createdAt: string
  updatedAt: string
  doctor?: any
  appointments?: any[]
  availableSlots?: number
  status?: 'AVAILABLE' | 'FILLING_FAST' | 'FULL'
}

export interface TimeSlotFilters {
  doctorId?: string
  date?: string
  dateFrom?: string
  dateTo?: string
  isActive?: boolean
  hasAvailability?: boolean
  limit?: number
  offset?: number
}

export const timeSlotAPI = {
  // Get all time slots with optional filters
  getTimeSlots: async (filters: TimeSlotFilters = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/time-slots?${params.toString()}`)
    return response.data
  },

  // Get time slot by ID
  getTimeSlotById: async (id: string) => {
    const response = await apiClient.get(`/time-slots/${id}`)
    return response.data
  },

  // Create new time slot (admin/doctor only)
  createTimeSlot: async (timeSlotData: Omit<TimeSlot, 'id' | 'currentBookings' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiClient.post('/time-slots', timeSlotData)
    return response.data
  },

  // Update time slot (admin/doctor only)
  updateTimeSlot: async (id: string, timeSlotData: Partial<TimeSlot>) => {
    const response = await apiClient.put(`/time-slots/${id}`, timeSlotData)
    return response.data
  },

  // Delete time slot (admin/doctor only)
  deleteTimeSlot: async (id: string) => {
    const response = await apiClient.delete(`/time-slots/${id}`)
    return response.data
  },

  // Get doctor's time slots for a specific date
  getDoctorTimeSlots: async (doctorId: string, date: string) => {
    const response = await apiClient.get(`/doctors/${doctorId}/time-slots?date=${date}`)
    return response.data
  },

  // Get doctor's available time slots for next N days
  getDoctorAvailableSlots: async (doctorId: string, days: number = 7) => {
    const response = await apiClient.get(`/doctors/${doctorId}/available-slots?days=${days}`)
    return response.data
  },

  // Get available time slots for all doctors on a specific date
  getAvailableSlotsByDate: async (date: string, specialization?: string, hospitalId?: string) => {
    const params = new URLSearchParams()
    params.append('date', date)
    params.append('hasAvailability', 'true')
    
    if (specialization) params.append('specialization', specialization)
    if (hospitalId) params.append('hospitalId', hospitalId)

    const response = await apiClient.get(`/time-slots/available?${params.toString()}`)
    return response.data
  },

  // Check slot availability
  checkSlotAvailability: async (slotId: string) => {
    const response = await apiClient.get(`/time-slots/${slotId}/availability`)
    return response.data
  },

  // Reserve a time slot temporarily (for booking process)
  reserveSlot: async (slotId: string, duration: number = 300) => { // 5 minutes default
    const response = await apiClient.post(`/time-slots/${slotId}/reserve`, {
      duration
    })
    return response.data
  },

  // Release reserved slot
  releaseSlot: async (slotId: string, reservationId: string) => {
    const response = await apiClient.delete(`/time-slots/${slotId}/reserve/${reservationId}`)
    return response.data
  },

  // Bulk create time slots for a doctor
  bulkCreateSlots: async (doctorId: string, dateRange: { from: string, to: string }, timeRanges: Array<{ startTime: string, endTime: string, maxAppointments: number, consultationFee: number }>) => {
    const response = await apiClient.post('/time-slots/bulk-create', {
      doctorId,
      dateRange,
      timeRanges
    })
    return response.data
  },

  // Update slot capacity
  updateSlotCapacity: async (slotId: string, maxAppointments: number) => {
    const response = await apiClient.patch(`/time-slots/${slotId}/capacity`, {
      maxAppointments
    })
    return response.data
  },

  // Get slot statistics
  getSlotStats: async (doctorId?: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams()
    if (doctorId) params.append('doctorId', doctorId)
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)
    
    const response = await apiClient.get(`/time-slots/stats?${params.toString()}`)
    return response.data
  },

  // Get slots with appointments
  getSlotsWithAppointments: async (doctorId: string, date: string) => {
    const response = await apiClient.get(`/time-slots/with-appointments?doctorId=${doctorId}&date=${date}`)
    return response.data
  },

  // Cancel all appointments in a slot (emergency)
  cancelSlot: async (slotId: string, reason: string) => {
    const response = await apiClient.patch(`/time-slots/${slotId}/cancel`, {
      reason
    })
    return response.data
  }
}

export default timeSlotAPI