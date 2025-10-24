import apiClient from './authService'

export interface Hospital {
  id: string
  name: string
  address: string
  city: string
  district: string
  contactNumber: string
  email: string
  website?: string
  facilities: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  doctors?: any[]
  _count?: {
    doctors: number
    appointments: number
  }
}

export interface HospitalFilters {
  search?: string
  city?: string
  district?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export const hospitalAPI = {
  // Get all hospitals with optional filters
  getHospitals: async (filters: HospitalFilters = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/hospitals?${params.toString()}`)
    return response.data
  },

  // Get hospital by ID
  getHospitalById: async (id: string) => {
    const response = await apiClient.get(`/hospitals/${id}`)
    return response.data
  },

  // Create new hospital (admin only)
  createHospital: async (hospitalData: Omit<Hospital, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiClient.post('/hospitals', hospitalData)
    return response.data
  },

  // Update hospital (admin only)
  updateHospital: async (id: string, hospitalData: Partial<Hospital>) => {
    const response = await apiClient.put(`/hospitals/${id}`, hospitalData)
    return response.data
  },

  // Delete hospital (admin only)
  deleteHospital: async (id: string) => {
    const response = await apiClient.delete(`/hospitals/${id}`)
    return response.data
  },

  // Get hospital's doctors
  getHospitalDoctors: async (hospitalId: string) => {
    const response = await apiClient.get(`/hospitals/${hospitalId}/doctors`)
    return response.data
  },

  // Get hospital's departments/specializations
  getHospitalSpecializations: async (hospitalId: string) => {
    const response = await apiClient.get(`/hospitals/${hospitalId}/specializations`)
    return response.data
  },

  // Search hospitals by city
  searchByCity: async (city: string) => {
    return await hospitalAPI.getHospitals({ city, limit: 50 })
  },

  // Get hospitals with specific facility
  getHospitalsWithFacility: async (facility: string) => {
    const response = await apiClient.get(`/hospitals/facility/${facility}`)
    return response.data
  },

  // Get hospital statistics
  getHospitalStats: async (hospitalId: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams()
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)
    
    const response = await apiClient.get(`/hospitals/${hospitalId}/stats?${params.toString()}`)
    return response.data
  }
}

export default hospitalAPI