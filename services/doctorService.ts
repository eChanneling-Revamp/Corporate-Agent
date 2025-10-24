import apiClient from './authService'

export interface Doctor {
  id: string
  name: string
  specialization: string
  qualifications: string
  experience: string
  consultationTypes: string[]
  hospital: string
  languages: string[]
  availableDays: string[]
  bio?: string
  rating?: number
  image?: string
  consultationFee?: number
  isAvailable?: boolean
  nextAvailableSlot?: any
  upcomingAppointments?: number
}

export interface DoctorSearchFilters {
  search?: string
  specialization?: string
  hospitalId?: string
  city?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const doctorAPI = {
  // Get all doctors with optional filters
  getDoctors: async (filters: DoctorSearchFilters = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/doctors?${params.toString()}`)
    return response.data
  },

  // Get doctor by ID
  getDoctorById: async (id: string) => {
    const response = await apiClient.get(`/doctors/${id}`)
    return response.data
  },

  // Create new doctor (admin only)
  createDoctor: async (doctorData: Omit<Doctor, 'id'>) => {
    const response = await apiClient.post('/doctors', doctorData)
    return response.data
  },

  // Update doctor (admin only)
  updateDoctor: async (id: string, doctorData: Partial<Doctor>) => {
    const response = await apiClient.put(`/doctors/${id}`, doctorData)
    return response.data
  },

  // Delete doctor (admin only)
  deleteDoctor: async (id: string) => {
    const response = await apiClient.delete(`/doctors/${id}`)
    return response.data
  },

  // Get doctor's time slots
  getDoctorTimeSlots: async (doctorId: string, date?: string) => {
    const params = date ? `?date=${date}` : ''
    const response = await apiClient.get(`/doctors/${doctorId}/time-slots${params}`)
    return response.data
  },

  // Get doctor's appointments
  getDoctorAppointments: async (doctorId: string, filters: any = {}) => {
    const params = new URLSearchParams()
    params.append('doctorId', doctorId)
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/appointments?${params.toString()}`)
    return response.data
  },

  // Search doctors by specialization
  searchBySpecialization: async (specialization: string) => {
    return await doctorAPI.getDoctors({ specialization, limit: 50 })
  },

  // Get popular doctors (by rating)
  getPopularDoctors: async (limit: number = 10) => {
    return await doctorAPI.getDoctors({ 
      sortBy: 'rating', 
      sortOrder: 'desc', 
      limit 
    })
  },

  // Get available doctors for today
  getAvailableDoctors: async () => {
    const today = new Date().toISOString().split('T')[0]
    return await doctorAPI.getDoctors({ 
      // Add filter for doctors with available slots today
      limit: 20 
    })
  }
}

export default doctorAPI