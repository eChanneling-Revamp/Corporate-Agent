import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import doctorSlice from './slices/doctorSlice'
import appointmentSlice from './slices/appointmentSlice'
import paymentSlice from './slices/paymentSlice'
import reportSlice from './slices/reportSlice'

const rootReducer = combineReducers({
  auth: authSlice,
  doctors: doctorSlice,
  appointments: appointmentSlice,
  payments: paymentSlice,
  reports: reportSlice,
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: true,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch