// Development utilities to reduce console noise
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

// Filter out known development warnings that are not actionable
export const setupDevelopmentFilters = () => {
  if (process.env.NODE_ENV === 'development') {
    // Store original console methods
    const originalWarn = console.warn
    const originalError = console.error
    const originalLog = console.log
    
    console.warn = (...args) => {
      const message = args.join(' ')
      
      // Filter out noisy development warnings
      if (
        message.includes('redux-persist failed to create sync storage') ||
        message.includes('Fast Refresh had to perform a full reload') ||
        message.includes('webpack.hot-update') ||
        message.includes('.well-known') ||
        message.includes('Service Worker registration failed')
      ) {
        return
      }
      
      originalWarn.apply(console, args)
    }
    
    console.error = (...args) => {
      const message = args.join(' ')
      
      // Filter out development-only errors
      if (
        message.includes('Service Worker registration failed') ||
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('webpack.hot-update')
      ) {
        return
      }
      
      originalError.apply(console, args)
    }
    
    console.log = (...args) => {
      const message = args.join(' ')
      
      // Filter out verbose development logs
      if (
        message.includes('using filesystem cache handler') ||
        message.includes('not using memory store for fetch cache') ||
        message.includes('loadTagsManifest')
      ) {
        return
      }
      
      originalLog.apply(console, args)
    }
  }
}

// Restore original console methods
export const restoreConsole = () => {
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
}