import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../services/authService'

export interface Doctor {
  id: string
  name: string
  specialization: string
  hospital: string
  experience: string
  rating: number
  reviews: number
  fee: string
  availableDates: string[]
  image: string
  qualifications: string[]
  languages: string[]
  nextAvailable: string
}

interface DoctorState {
  doctors: Doctor[]
  filteredDoctors: Doctor[]
  selectedDoctor: Doctor | null
  searchFilters: {
    query?: string
    specialization?: string
    hospital?: string
    date?: string
    feeMin?: number
    feeMax?: number
  }
  isLoading: boolean
  error: string | null
}

const initialState: DoctorState = {
  doctors: [],
  filteredDoctors: [],
  selectedDoctor: null,
  searchFilters: {},
  isLoading: false,
  error: null,
}

// Async thunks
export const fetchDoctors = createAsyncThunk(
  'doctors/fetchDoctors',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/doctors', { params: filters })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctors')
    }
  }
)

export const searchDoctors = createAsyncThunk(
  'doctors/searchDoctors',
  async (searchParams: string, { rejectWithValue }) => {
    try {
      const url = searchParams ? `/doctors?${searchParams}` : '/doctors'
      const response = await apiClient.get(url)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Search failed')
    }
  }
)

export const getDoctorById = createAsyncThunk(
  'doctors/getDoctorById',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctor details')
    }
  }
)

const doctorSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    setSearchFilters: (state, action) => {
      state.searchFilters = action.payload
    },
    clearFilters: (state) => {
      state.searchFilters = {}
      state.filteredDoctors = state.doctors
    },
    setSelectedDoctor: (state, action) => {
      state.selectedDoctor = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch doctors
    builder
      .addCase(fetchDoctors.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.isLoading = false
        state.doctors = action.payload.doctors || []
        state.filteredDoctors = action.payload.doctors || []
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    // Search doctors
    builder
      .addCase(searchDoctors.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(searchDoctors.fulfilled, (state, action) => {
        state.isLoading = false
        state.doctors = action.payload.doctors || []
        state.filteredDoctors = action.payload.doctors || []
      })
      .addCase(searchDoctors.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    // Get doctor by ID
    builder
      .addCase(getDoctorById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getDoctorById.fulfilled, (state, action) => {
        state.isLoading = false
        state.selectedDoctor = action.payload
      })
      .addCase(getDoctorById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { setSearchFilters, clearFilters, setSelectedDoctor, clearError } = doctorSlice.actions
export default doctorSlice.reducer