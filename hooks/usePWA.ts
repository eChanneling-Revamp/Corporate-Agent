import { useEffect, useState, useCallback } from 'react'
import { showToast } from '../components/common/ToastProvider'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  // Register service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker()
      checkIfInstalled()
      setupNetworkListeners()
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const registerServiceWorker = async () => {
    // Skip service worker in development if disabled
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_SW === 'true') {
      console.log('Service Worker disabled in development')
      return
    }
    
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })
      
      setRegistration(reg)
      console.log('Service Worker registered:', reg)

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setIsUpdateAvailable(true)
              showToast.info('A new version is available! Refresh to update.')
            }
          })
        }
      })

      // Check for updates periodically
      setInterval(() => {
        reg.update()
      }, 60000) // Check every minute

    } catch (error) {
      console.error('Service Worker registration failed:', error)
      showToast.error('Failed to enable offline functionality')
    }
  }

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  const checkIfInstalled = () => {
    // Check if app is running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check for iOS
    if ('standalone' in window.navigator && (window.navigator as any).standalone) {
      setIsInstalled(true)
      return
    }

    // Check if installed via beforeinstallprompt
    window.addEventListener('appinstalled', handleAppInstalled)
  }

  const setupNetworkListeners = () => {
    setIsOffline(!navigator.onLine)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  const handleOnline = () => {
    setIsOffline(false)
    showToast.online()
  }

  const handleOffline = () => {
    setIsOffline(true)
    showToast.offline()
  }

  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault()
    const promptEvent = e as BeforeInstallPromptEvent
    setDeferredPrompt(promptEvent)
    setIsInstallable(true)
    
    // Show custom install banner
    showToast.info('Install eChanneling app for better experience!')
  }

  const handleAppInstalled = () => {
    setIsInstalled(true)
    setIsInstallable(false)
    setDeferredPrompt(null)
    showToast.success('App installed successfully!')
  }

  // Listen for beforeinstallprompt
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available')
      return false
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        showToast.success('Installing app...')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setIsInstallable(false)
      
      return outcome === 'accepted'
    } catch (error) {
      console.error('Error installing app:', error)
      showToast.error('Failed to install app')
      return false
    }
  }, [deferredPrompt])

  const clearCache = useCallback(async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        showToast.success('Cache cleared successfully')
        return true
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
      showToast.error('Failed to clear cache')
      return false
    }
  }, [])

  const unregisterServiceWorker = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(reg => reg.unregister()))
        showToast.success('Service worker unregistered')
        return true
      }
    } catch (error) {
      console.error('Error unregistering service worker:', error)
      showToast.error('Failed to unregister service worker')
      return false
    }
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        showToast.success('Notifications enabled!')
        return true
      }
    }

    showToast.warning('Notifications are disabled')
    return false
  }, [])

  const subscribeToPushNotifications = useCallback(async () => {
    if (!registration) {
      console.error('Service worker not registered')
      return null
    }

    try {
      const permission = await requestNotificationPermission()
      if (!permission) return null

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })

      showToast.success('Push notifications enabled!')
      return subscription
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      showToast.error('Failed to enable push notifications')
      return null
    }
  }, [registration, requestNotificationPermission])

  return {
    isInstalled,
    isInstallable,
    isUpdateAvailable,
    isOffline,
    installApp,
    clearCache,
    unregisterServiceWorker,
    updateServiceWorker,
    requestNotificationPermission,
    subscribeToPushNotifications,
    registration,
  }
}

