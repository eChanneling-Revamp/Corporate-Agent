import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { store, persistor } from '../store/store'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../store/Toast'
import '../styles/globals.css'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
          <ToastProvider>
            <AuthProvider>
              <Component {...pageProps} />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </AuthProvider>
          </ToastProvider>
        </PersistGate>
      </Provider>
    </SessionProvider>
  )
}