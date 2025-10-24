import { useState, useEffect, useCallback, useRef } from 'react'

// Device detection utilities
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  )
}

export const isIOS = () => {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export const isAndroid = () => {
  if (typeof window === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

export const isTablet = () => {
  if (typeof window === 'undefined') return false
  return /iPad|Android/i.test(navigator.userAgent) && !isMobilePhone()
}

export const isMobilePhone = () => {
  if (typeof window === 'undefined') return false
  return /iPhone|Android.*Mobile/i.test(navigator.userAgent)
}

// Breakpoint definitions
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

export type Breakpoint = keyof typeof breakpoints

// Hook: useBreakpoint
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs')

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      
      if (width >= breakpoints['2xl']) setBreakpoint('2xl')
      else if (width >= breakpoints.xl) setBreakpoint('xl')
      else if (width >= breakpoints.lg) setBreakpoint('lg')
      else if (width >= breakpoints.md) setBreakpoint('md')
      else if (width >= breakpoints.sm) setBreakpoint('sm')
      else setBreakpoint('xs')
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isAbove = useCallback((bp: Breakpoint) => {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0
    return currentWidth >= breakpoints[bp]
  }, [])

  const isBelow = useCallback((bp: Breakpoint) => {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0
    return currentWidth < breakpoints[bp]
  }, [])

  const isBetween = useCallback((min: Breakpoint, max: Breakpoint) => {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0
    return currentWidth >= breakpoints[min] && currentWidth < breakpoints[max]
  }, [])

  return {
    breakpoint,
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2xl: breakpoint === '2xl',
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md' || breakpoint === 'lg',
    isDesktop: breakpoint === 'xl' || breakpoint === '2xl',
    isAbove,
    isBelow,
    isBetween
  }
}

// Hook: useDeviceDetection
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isTouchDevice: false,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false,
    devicePixelRatio: 1,
    orientation: 'portrait' as 'portrait' | 'landscape'
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo({
        isTouchDevice: isTouchDevice(),
        isMobile: isMobileDevice(),
        isTablet: isTablet(),
        isDesktop: !isMobileDevice() && !isTablet(),
        isIOS: isIOS(),
        isAndroid: isAndroid(),
        devicePixelRatio: window.devicePixelRatio || 1,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      })
    }

    updateDeviceInfo()
    
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}

// Hook: useTouchEvents with improved handling
interface TouchHandlers {
  onTap?: (e: TouchEvent) => void
  onDoubleTap?: (e: TouchEvent) => void
  onLongPress?: (e: TouchEvent) => void
  onSwipeLeft?: (e: TouchEvent) => void
  onSwipeRight?: (e: TouchEvent) => void
  onSwipeUp?: (e: TouchEvent) => void
  onSwipeDown?: (e: TouchEvent) => void
  onPinch?: (scale: number) => void
  onRotate?: (angle: number) => void
  swipeThreshold?: number
  longPressDelay?: number
  doubleTapDelay?: number
}

export const useTouchEvents = (handlers: TouchHandlers = {}) => {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onRotate,
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300
  } = handlers

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTapRef = useRef<number>(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const initialDistanceRef = useRef<number | null>(null)
  const initialAngleRef = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    // Long press detection
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress(e)
      }, longPressDelay)
    }

    // Multi-touch gestures
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      // Calculate initial distance for pinch
      initialDistanceRef.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      // Calculate initial angle for rotation
      initialAngleRef.current = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      )
    }
  }, [onLongPress, longPressDelay])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // Handle pinch and rotate
    if (e.touches.length === 2 && (onPinch || onRotate)) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      // Calculate current distance
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      // Calculate current angle
      const currentAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      )
      
      // Pinch gesture
      if (onPinch && initialDistanceRef.current) {
        const scale = currentDistance / initialDistanceRef.current
        onPinch(scale)
      }
      
      // Rotate gesture
      if (onRotate && initialAngleRef.current !== null) {
        const rotation = (currentAngle - initialAngleRef.current) * (180 / Math.PI)
        onRotate(rotation)
      }
    }
  }, [onPinch, onRotate])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    // Swipe detection
    if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight(e)
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft(e)
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown(e)
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp(e)
        }
      }
    } else if (deltaTime < 200) {
      // Tap detection
      const now = Date.now()
      const timeSinceLastTap = now - lastTapRef.current

      if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
        onDoubleTap(e)
        lastTapRef.current = 0
      } else if (onTap) {
        onTap(e)
        lastTapRef.current = now
      }
    }

    // Reset
    touchStartRef.current = null
    initialDistanceRef.current = null
    initialAngleRef.current = null
  }, [
    onTap,
    onDoubleTap,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    swipeThreshold,
    doubleTapDelay
  ])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }
}

// Hook: useViewportSize
export const useViewportSize = () => {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    vh: typeof window !== 'undefined' ? window.innerHeight * 0.01 : 0,
    vw: typeof window !== 'undefined' ? window.innerWidth * 0.01 : 0
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
        vh: window.innerHeight * 0.01,
        vw: window.innerWidth * 0.01
      })
    }

    handleResize()
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return size
}

// Hook: useSafeArea for iOS notch handling
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  })

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = window.getComputedStyle(document.documentElement)
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0')
      })
    }

    // Add CSS variables for safe area
    const style = document.createElement('style')
    style.innerHTML = `
      :root {
        --sat: env(safe-area-inset-top);
        --sar: env(safe-area-inset-right);
        --sab: env(safe-area-inset-bottom);
        --sal: env(safe-area-inset-left);
      }
    `
    document.head.appendChild(style)

    updateSafeArea()
    
    window.addEventListener('resize', updateSafeArea)
    
    return () => {
      window.removeEventListener('resize', updateSafeArea)
      document.head.removeChild(style)
    }
  }, [])

  return safeArea
}

// Hook: useScrollLock for modals on mobile
export const useScrollLock = (lock: boolean = false) => {
  useEffect(() => {
    if (!lock) return

    const originalStyle = window.getComputedStyle(document.body).overflow
    const scrollY = window.scrollY

    // Lock scroll
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      // Restore scroll
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = originalStyle
      window.scrollTo(0, scrollY)
    }
  }, [lock])
}

// Hook: useVirtualKeyboard for input handling
export const useVirtualKeyboard = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    if (!isMobileDevice()) return

    const handleFocusIn = () => {
      setIsKeyboardVisible(true)
      
      // Estimate keyboard height
      setTimeout(() => {
        const viewportHeight = window.innerHeight
        const documentHeight = document.documentElement.clientHeight
        const keyboardHeight = documentHeight - viewportHeight
        setKeyboardHeight(Math.max(0, keyboardHeight))
      }, 300)
    }

    const handleFocusOut = () => {
      setIsKeyboardVisible(false)
      setKeyboardHeight(0)
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  return {
    isKeyboardVisible,
    keyboardHeight
  }
}
