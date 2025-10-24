import React, { useState } from 'react'
import { usePWA } from '../../hooks/usePWA'

const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, installApp } = usePWA()
  const [showPrompt, setShowPrompt] = useState(true)

  if (!isInstallable || !showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white rounded-lg shadow-lg border border-blue-200 p-4 z-50">
      <div className="flex items-start">
        <img src="/logo.png" alt="App Icon" className="w-12 h-12 rounded-lg mr-3" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Install eChanneling</h3>
          <p className="text-sm text-gray-600 mt-1">
            Install our app for a better experience with offline access and notifications.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={installApp}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Install
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
            >
              Not Now
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default PWAInstallPrompt
