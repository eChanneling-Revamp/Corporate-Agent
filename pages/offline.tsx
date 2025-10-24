import React from 'react'
import { WifiOff, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import Head from 'next/head'

const OfflinePage: React.FC = () => {
  const handleRetry = () => {
    window.location.reload()
  }

  const handleGoBack = () => {
    window.history.back()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <>
      <Head>
        <title>Offline - eChanneling</title>
        <meta name="description" content="You are currently offline" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Offline Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-200 rounded-full blur-xl opacity-50"></div>
                <div className="relative bg-red-100 rounded-full p-6">
                  <WifiOff className="h-16 w-16 text-red-600" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                You're Offline
              </h1>
              <p className="text-gray-600 mb-8">
                It looks like you've lost your internet connection. Please check your connection and try again.
              </p>

              {/* Connection Tips */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Connection Tips:
                </h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Check if your Wi-Fi is turned on
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Verify your internet connection
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Try moving closer to your router
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Restart your device if needed
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={handleGoBack}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Go Back
                  </button>

                  <button
                    onClick={handleGoHome}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Home
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cached Content Notice */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Some features may be available offline if they were previously cached.
            </p>
          </div>
        </div>
      </div>

      {/* Auto-retry script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Auto-retry connection every 30 seconds
            setInterval(function() {
              fetch('/', { method: 'HEAD' })
                .then(function() {
                  // Connection restored, reload page
                  window.location.reload();
                })
                .catch(function() {
                  // Still offline, continue waiting
                });
            }, 30000);
          `,
        }}
      />
    </>
  )
}

export default OfflinePage
