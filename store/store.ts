import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import createWebStorage from 'redux-persist/lib/storage/createWebStorage'
import { combineReducers } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import doctorSlice from './slices/doctorSlice'
import appointmentSlice from './slices/appointmentSlice'
import paymentSlice from './slices/paymentSlice'
import reportSlice from './slices/reportSlice'

// Create a noop storage for server-side rendering
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null)
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value)
    },
    removeItem(_key: string) {
      return Promise.resolve()
    },
  }
}

const storage = typeof window !== 'undefined' 
  ? createWebStorage('local') 
  : createNoopStorage()

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'] // Only persist auth state
}

const rootReducer = combineReducers({
  auth: authSlice,
  doctors: doctorSlice,
  appointments: appointmentSlice,
  payments: paymentSlice,
  reports: reportSlice,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch