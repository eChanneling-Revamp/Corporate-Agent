import { createSlice } from '@reduxjs/toolkit'

interface ReportState {
  reports: any[]
  isLoading: boolean
  error: string | null
}

const initialState: ReportState = {
  reports: [],
  isLoading: false,
  error: null,
}

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setReports: (state, action) => {
      state.reports = action.payload
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
  },
})

export const { setReports, setLoading, setError } = reportSlice.actions
export default reportSlice.reducer