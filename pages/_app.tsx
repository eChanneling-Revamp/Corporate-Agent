import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '../store/store'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../components/common/ToastProvider'
import ErrorBoundary from '../components/common/ErrorBoundary'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { connectSocket } from '../lib/socketClient'
import { setupGlobalErrorHandlers } from '../lib/errorHandler'
import PWAInstallPrompt from '../components/common/PWAInstallPrompt'
import '../lib/devtools'
import '../styles/globals.css'

function MyApp({ Component, pageProps }: { Component: any, pageProps: any }) {
  useEffect(() => {
    // Setup global error handlers
    setupGlobalErrorHandlers()

    // Only connect to socket server in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true') {
      try {
        const socket = connectSocket()
        console.log('WebSocket connection initialized')
      } catch (error) {
        console.warn('WebSocket connection failed (optional feature)')
      }
    } else {
      console.log('WebSocket disabled in development mode')
    }

    // Cleanup on unmount
    return () => {
      // Socket connection persists across pages
    }
  }, [])

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
      <PWAInstallPrompt />
    </ErrorBoundary>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner size="xl" text="Loading application..." />
          </div>
        } 
        persistor={persistor}
      >
        <ToastProvider>
          <AuthProvider>
            <MyApp Component={Component} pageProps={pageProps} />
          </AuthProvider>
        </ToastProvider>
      </PersistGate>
    </Provider>
  )
}