import { ApiService, RequestBuilder, CacheManager } from '../lib/api/apiClient'

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
    // Check cache first
    const cacheKey = `doctors-${JSON.stringify(filters)}`
    const cached = CacheManager.get(cacheKey)
    if (cached) return cached

    const params = new RequestBuilder()
      .addParams(filters)
      .toString()

    const data = await ApiService.get<{ doctors: Doctor[]; total: number }>(
      `/api/doctors${params ? `?${params}` : ''}`
    )
    
    // Cache the result for 5 minutes
    CacheManager.set(cacheKey, data, 5 * 60 * 1000)
    
    return data
  },

  // Get doctor by ID
  getDoctorById: async (id: string) => {
    const cacheKey = `doctor-${id}`
    const cached = CacheManager.get(cacheKey)
    if (cached) return cached

    const data = await ApiService.get<Doctor>(`/api/doctors/${id}`)
    
    CacheManager.set(cacheKey, data, 10 * 60 * 1000) // Cache for 10 minutes
    
    return data
  },

  // Create new doctor (admin only)
  createDoctor: async (doctorData: Omit<Doctor, 'id'>) => {
    const data = await ApiService.post<Doctor>('/api/doctors', doctorData)
    
    // Clear cache after creating
    CacheManager.clear()
    
    return data
  },

  // Update doctor (admin only)
  updateDoctor: async (id: string, doctorData: Partial<Doctor>) => {
    const data = await ApiService.put<Doctor>(`/api/doctors/${id}`, doctorData)
    
    // Clear specific doctor cache
    CacheManager.remove(`doctor-${id}`)
    
    return data
  },

  // Delete doctor (admin only)
  deleteDoctor: async (id: string) => {
    const data = await ApiService.delete(`/api/doctors/${id}`)
    
    // Clear cache after deletion
    CacheManager.remove(`doctor-${id}`)
    
    return data
  },

  // Get doctor's time slots
  getDoctorTimeSlots: async (doctorId: string, date?: string) => {
    const params = date ? `?date=${date}` : ''
    return await ApiService.get(`/api/doctors/${doctorId}/time-slots${params}`)
  },

  // Get doctor's appointments
  getDoctorAppointments: async (doctorId: string, filters: any = {}) => {
    const params = new RequestBuilder()
      .addParam('doctorId', doctorId)
      .addParams(filters)
      .toString()

    return await ApiService.get(`/api/appointments?${params}`)
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