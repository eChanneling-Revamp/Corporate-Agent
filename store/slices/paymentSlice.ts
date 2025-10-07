import { createSlice } from '@reduxjs/toolkit'

interface PaymentState {
  payments: any[]
  isLoading: boolean
  error: string | null
}

const initialState: PaymentState = {
  payments: [],
  isLoading: false,
  error: null,
}

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    setPayments: (state, action) => {
      state.payments = action.payload
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
  },
})

export const { setPayments, setLoading, setError } = paymentSlice.actions
export default paymentSlice.reducer