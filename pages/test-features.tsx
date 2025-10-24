import React, { useState } from 'react'
import Head from 'next/head'
import { showToast } from '../components/common/ToastProvider'
import LoadingSpinner, { SkeletonLoader, CardSkeleton, TableSkeleton } from '../components/common/LoadingSpinner'
import RealtimeNotifications from '../components/common/RealtimeNotifications'
import { useSocket, useNotifications } from '../hooks/useSocket'
import { usePWA } from '../hooks/usePWA'
import { handleAsyncOperation } from '../lib/errorHandler'
import { agentAPI } from '../services/agentService'

const TestFeaturesPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showSkeletons, setShowSkeletons] = useState(false)
  
  // Socket hooks
  const { isConnected, emit } = useSocket()
  const { notifications, unreadCount } = useNotifications()
  
  // PWA hooks
  const {
    isInstalled,
    isInstallable,
    isOffline,
    installApp,
    clearCache,
    requestNotificationPermission
  } = usePWA()

  // Test toast notifications
  const testToasts = () => {
    showToast.success('Success toast example!')
    setTimeout(() => showToast.error('Error toast example!'), 500)
    setTimeout(() => showToast.warning('Warning toast example!'), 1000)
    setTimeout(() => showToast.info('Info toast example!'), 1500)
  }

  // Test async operation
  const testAsyncOperation = async () => {
    await handleAsyncOperation(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        return { success: true }
      },
      {
        loadingMessage: 'Processing async operation...',
        successMessage: 'Async operation completed!',
        errorMessage: 'Async operation failed'
      }
    )
  }

  // Test API call
  const testAPICall = async () => {
    try {
      setLoading(true)
      // This will fail if backend is not running, demonstrating error handling
      const response = await agentAPI.getCurrentAgent()
      showToast.success('API call successful!')
      console.log('API Response:', response)
    } catch (error) {
      // Error will be handled by errorHandler
      console.error('API Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Test socket emit
  const testSocketEmit = () => {
    if (isConnected) {
      emit('test:event', { message: 'Test socket emission' })
      showToast.success('Socket event emitted!')
    } else {
      showToast.error('Socket not connected!')
    }
  }

  // Test PWA install
  const testPWAInstall = async () => {
    if (isInstallable) {
      const result = await installApp()
      if (result) {
        showToast.success('PWA installation initiated!')
      }
    } else {
      showToast.info('PWA is not installable or already installed')
    }
  }

  return (
    <>
      <Head>
        <title>Test Features - eChanneling</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-8">
        {/* Header with Notifications */}
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Feature Testing Dashboard</h1>
            <RealtimeNotifications />
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Socket Connection</h3>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-gray-600">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">PWA Status</h3>
              <div className="space-y-1 text-sm">
                <div>Installed: <span className="font-medium">{isInstalled ? 'Yes' : 'No'}</span></div>
                <div>Installable: <span className="font-medium">{isInstallable ? 'Yes' : 'No'}</span></div>
                <div>Offline: <span className="font-medium">{isOffline ? 'Yes' : 'No'}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Notifications</h3>
              <div className="space-y-1 text-sm">
                <div>Total: <span className="font-medium">{notifications.length}</span></div>
                <div>Unread: <span className="font-medium">{unreadCount}</span></div>
              </div>
            </div>
          </div>

          {/* Test Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Toast Tests */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Toast Notifications</h2>
              <div className="space-y-3">
                <button
                  onClick={testToasts}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Test All Toasts
                </button>
                <button
                  onClick={() => showToast.promise(
                    new Promise(resolve => setTimeout(resolve, 2000)),
                    {
                      loading: 'Loading...',
                      success: 'Promise resolved!',
                      error: 'Promise rejected!'
                    }
                  )}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Test Promise Toast
                </button>
              </div>
            </div>

            {/* Loading States */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Loading States</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setLoading(!loading)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Toggle Loading Spinner
                </button>
                <button
                  onClick={() => setShowSkeletons(!showSkeletons)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Toggle Skeleton Loaders
                </button>
              </div>
              {loading && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <LoadingSpinner size="md" text="Loading example..." />
                </div>
              )}
            </div>

            {/* API & Error Handling */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">API & Error Handling</h2>
              <div className="space-y-3">
                <button
                  onClick={testAsyncOperation}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Test Async Operation
                </button>
                <button
                  onClick={testAPICall}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={loading}
                >
                  Test API Call (May Error)
                </button>
                <button
                  onClick={() => {
                    throw new Error('Test error boundary!')
                  }}
                  className="w-full px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900"
                >
                  Test Error Boundary
                </button>
              </div>
            </div>

            {/* Real-time Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Real-time Features</h2>
              <div className="space-y-3">
                <button
                  onClick={testSocketEmit}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Test Socket Emit
                </button>
                <button
                  onClick={() => {
                    emit('notification:new', {
                      id: Date.now().toString(),
                      title: 'Test Notification',
                      message: 'This is a test notification',
                      timestamp: new Date().toISOString(),
                      type: 'info',
                      read: false
                    })
                  }}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Send Test Notification
                </button>
              </div>
            </div>

            {/* PWA Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">PWA Features</h2>
              <div className="space-y-3">
                <button
                  onClick={testPWAInstall}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                  disabled={!isInstallable}
                >
                  Install PWA
                </button>
                <button
                  onClick={requestNotificationPermission}
                  className="w-full px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                >
                  Request Notification Permission
                </button>
                <button
                  onClick={clearCache}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Clear Cache
                </button>
              </div>
            </div>

            {/* Skeleton Loaders Demo */}
            {showSkeletons && (
              <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Skeleton Loaders</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Lines Skeleton</h3>
                    <SkeletonLoader lines={3} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Card Skeleton</h3>
                    <CardSkeleton />
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="font-medium mb-2">Table Skeleton</h3>
                    <TableSkeleton rows={3} columns={4} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default TestFeaturesPage
