import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authAPI } from '../../services/authService'

export interface User {
  id: string
  email: string
  name: string
  role: 'agent' | 'admin'
  companyName?: string
  contactNumber?: string
  registrationStatus: 'pending' | 'approved' | 'rejected'
  isVerified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  registrationStep: number
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  registrationStep: 1,
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Dummy credentials for testing
      if (credentials.email === 'agent@gmail.com' && credentials.password === 'ABcd123#') {
        // Simulate API response with dummy data
        return {
          user: {
            id: 'dummy-agent-001',
            email: 'agent@gmail.com',
            name: 'Demo Agent',
            role: 'agent' as const,
            companyName: 'Demo Company',
            contactNumber: '+94771234567',
            registrationStatus: 'approved' as const,
            isVerified: true
          },
          token: 'dummy-jwt-token-12345',
          refreshToken: 'dummy-refresh-token-67890'
        }
      }
      
      // For other credentials, try the real API
      const response = await authAPI.login(credentials)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const registerAgent = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string
    password: string
    name: string
    companyName: string
    contactNumber: string
  }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyEmail(token)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Email verification failed')
    }
  }
)

export const refreshTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const refreshToken = state.auth.refreshToken
      if (!refreshToken) throw new Error('No refresh token')
      
      const response = await authAPI.refreshToken(refreshToken)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
    setRegistrationStep: (state, action: PayloadAction<number>) => {
      state.registrationStep = action.payload
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    // Register
    builder
      .addCase(registerAgent.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerAgent.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.registrationStep = 2 // Move to email verification step
      })
      .addCase(registerAgent.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    // Email verification
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false
        if (state.user) {
          state.user.isVerified = true
        }
        state.registrationStep = 3 // Registration complete
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    // Refresh token
    builder
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
  },
})

export const { logout, clearError, setRegistrationStep, updateUser } = authSlice.actions
export default authSlice.reducer