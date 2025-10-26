import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../services/authService'

export interface Appointment {
  id: string
  patientName: string
  patientEmail?: string
  patientPhone?: string
  doctorId: string
  doctorName: string
  specialization: string
  hospital: string
  date: string
  time: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'payment_pending'
  amount: number
  appointmentType: 'regular' | 'acb' | 'bulk'
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface BulkAppointmentRequest {
  doctorId: string
  date: string
  timeSlots: string[]
  patients: {
    name: string
    email?: string
    phone?: string
  }[]
  notes?: string
}

interface AppointmentState {
  appointments: Appointment[]
  selectedAppointment: Appointment | null
  bulkBookingData: BulkAppointmentRequest | null
  pendingACBAppointments: Appointment[]
  isLoading: boolean
  error: string | null
  filters: {
    status?: string
    dateFrom?: string
    dateTo?: string
    doctorId?: string
  }
}

const initialState: AppointmentState = {
  appointments: [],
  selectedAppointment: null,
  bulkBookingData: null,
  pendingACBAppointments: [],
  isLoading: false,
  error: null,
  filters: {},
}

// Async thunks
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/appointments', { params: filters })
      // Return the actual data from the API response
      if (response.data && response.data.success && response.data.data) {
        return response.data.data.appointments || response.data.data
      }
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments')
    }
  }
)

export const bookAppointment = createAsyncThunk(
  'appointments/bookAppointment',
  async (appointmentData: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/appointments', appointmentData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to book appointment')
    }
  }
)

export const bulkBookAppointments = createAsyncThunk(
  'appointments/bulkBookAppointments',
  async (bulkData: BulkAppointmentRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/appointments/bulk', bulkData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to book bulk appointments')
    }
  }
)

export const confirmACBAppointment = createAsyncThunk(
  'appointments/confirmACBAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/appointments/${appointmentId}/confirm-acb`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to confirm ACB appointment')
    }
  }
)

export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/appointments/${appointmentId}/cancel`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel appointment')
    }
  }
)

export const rescheduleAppointment = createAsyncThunk(
  'appointments/rescheduleAppointment',
  async ({ appointmentId, newDate, newTime }: { appointmentId: string; newDate: string; newTime: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/appointments/${appointmentId}/reschedule`, {
        date: newDate,
        time: newTime,
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reschedule appointment')
    }
  }
)

export const fetchPendingACBAppointments = createAsyncThunk(
  'appointments/fetchPendingACBAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/appointments/pending-acb')
      // Return the actual data from the API response
      if (response.data && response.data.success && response.data.data) {
        return response.data.data
      }
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending ACB appointments')
    }
  }
)

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setSelectedAppointment: (state, action) => {
      state.selectedAppointment = action.payload
    },
    setBulkBookingData: (state, action) => {
      state.bulkBookingData = action.payload
    },
    setFilters: (state, action) => {
      state.filters = action.payload
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    clearError: (state) => {
      state.error = null
    },
    updateAppointmentStatus: (state, action) => {
      const { appointmentId, status } = action.payload
      const appointment = state.appointments.find(apt => apt.id === appointmentId)
      if (appointment) {
        appointment.status = status
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch appointments
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false
        // Ensure we always have an array
        state.appointments = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    // Book appointment
    builder
      .addCase(bookAppointment.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.isLoading = false
        state.appointments.unshift(action.payload)
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    // Bulk book appointments
    builder
      .addCase(bulkBookAppointments.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(bulkBookAppointments.fulfilled, (state, action) => {
        state.isLoading = false
        state.appointments = [...action.payload, ...state.appointments]
        state.bulkBookingData = null
      })
      .addCase(bulkBookAppointments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    // Confirm ACB appointment
    builder
      .addCase(confirmACBAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id)
        if (index !== -1) {
          state.appointments[index] = action.payload
        }
        // Remove from pending ACB list
        state.pendingACBAppointments = state.pendingACBAppointments.filter(
          apt => apt.id !== action.payload.id
        )
      })
    
    // Cancel appointment
    builder
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id)
        if (index !== -1) {
          state.appointments[index] = action.payload
        }
      })
    
    // Reschedule appointment
    builder
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id)
        if (index !== -1) {
          state.appointments[index] = action.payload
        }
      })
    
    // Fetch pending ACB appointments
    builder
      .addCase(fetchPendingACBAppointments.fulfilled, (state, action) => {
        // Extract data from API response
        const pendingACB = action.payload?.data || action.payload || []
        state.pendingACBAppointments = Array.isArray(pendingACB) ? pendingACB : []
      })
  },
})

export const {
  setSelectedAppointment,
  setBulkBookingData,
  setFilters,
  clearFilters,
  clearError,
  updateAppointmentStatus,
} = appointmentSlice.actions

export default appointmentSlice.reducer