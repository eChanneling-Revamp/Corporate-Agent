// Suppress React DevTools warning in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Override console.warn to suppress React DevTools message
  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    const message = args[0]
    if (typeof message === 'string' && message.includes('Download the React DevTools')) {
      // Suppress React DevTools warning
      return
    }
    originalWarn.apply(console, args)
  }

  // Also suppress the DevTools hook
  const win = window as any
  if (!win.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    win.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      isDisabled: true,
      supportsFiber: true,
      inject: () => {},
      onCommitFiberRoot: () => {},
      onCommitFiberUnmount: () => {},
    }
  }
}