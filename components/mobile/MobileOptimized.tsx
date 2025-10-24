import React, { ReactNode, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { 
  useBreakpoint, 
  useScrollLock,
  useSafeArea,
  useVirtualKeyboard
} from '../../hooks/useMobile'

// Mobile-optimized Bottom Navigation
interface BottomNavItem {
  icon: ReactNode
  label: string
  href?: string
  onClick?: () => void
  badge?: number
}

interface MobileBottomNavProps {
  items: BottomNavItem[]
  activeIndex: number
  className?: string
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  items,
  activeIndex,
  className = ''
}) => {
  const safeArea = useSafeArea()
  const { isKeyboardVisible } = useVirtualKeyboard()

  if (isKeyboardVisible) return null // Hide when keyboard is visible

  return (
    <nav 
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white border-t border-gray-200
        ${className}
      `}
      style={{ paddingBottom: safeArea.bottom || 0 }}
    >
      <div className="flex justify-around items-center h-16">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`
              relative flex-1 h-full flex flex-col items-center justify-center
              transition-colors duration-200
              ${activeIndex === index 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <div className="relative">
              {item.icon}
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

// Pull-to-Refresh Component
interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  disabled?: boolean
  threshold?: number
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  disabled = false,
  threshold = 80
}) => {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startYRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop === 0) {
      startYRef.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startYRef.current || disabled || isRefreshing) return
    
    const currentY = e.touches[0].clientY
    const distance = currentY - startYRef.current
    
    if (distance > 0) {
      e.preventDefault()
      setIsPulling(true)
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling || disabled || isRefreshing) return
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
    
    setIsPulling(false)
    setPullDistance(0)
    startYRef.current = null
  }

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-300"
        style={{
          height: pullDistance,
          opacity: pullDistance / threshold
        }}
      >
        <div className={`${isRefreshing ? 'animate-spin' : ''}`}>
          {pullDistance >= threshold ? '🔄' : '⬇️'}
        </div>
      </div>
      
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  )
}

// Swipeable Card Carousel
interface SwipeableCarouselProps {
  items: ReactNode[]
  className?: string
  showIndicators?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
}

export const SwipeableCarousel: React.FC<SwipeableCarouselProps> = ({
  items,
  className = '',
  showIndicators = true,
  autoPlay = false,
  autoPlayInterval = 3000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
    
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  React.useEffect(() => {
    if (!autoPlay) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, items.length])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={containerRef}
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {items.map((item, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {item}
          </div>
        ))}
      </div>

      {/* Navigation Buttons (for desktop) */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-lg"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setCurrentIndex(Math.min(items.length - 1, currentIndex + 1))}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-lg"
            disabled={currentIndex === items.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && items.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${index === currentIndex 
                  ? 'bg-white w-8' 
                  : 'bg-white/50'
                }
              `}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Mobile-optimized Drawer/Sheet
interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  position?: 'left' | 'right' | 'bottom'
  className?: string
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  children,
  title,
  position = 'bottom',
  className = ''
}) => {
  useScrollLock(isOpen)
  const safeArea = useSafeArea()
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const threshold = 50
    
    if (position === 'bottom' && distance < -threshold) {
      onClose()
    }
  }

  if (!isOpen) return null

  const positionClasses = {
    left: 'left-0 top-0 h-full w-80 animate-slideInLeft',
    right: 'right-0 top-0 h-full w-80 animate-slideInRight',
    bottom: 'bottom-0 left-0 right-0 max-h-[90vh] animate-slideInUp'
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`
          fixed z-50 bg-white rounded-t-2xl shadow-xl
          ${positionClasses[position]}
          ${className}
        `}
        style={{
          paddingBottom: position === 'bottom' ? safeArea.bottom : 0,
          paddingTop: position !== 'bottom' ? safeArea.top : 0
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle for bottom drawer */}
        {position === 'bottom' && (
          <div className="flex justify-center py-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        )}
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-auto">
          {children}
        </div>
      </div>
    </>
  )
}

// Touch-friendly Button
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  hapticFeedback?: boolean
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  hapticFeedback = true,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Haptic feedback for supported devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    onClick?.(e)
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]', // iOS recommended touch target
    lg: 'px-6 py-4 text-lg min-h-[52px]'
  }

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100',
    ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
  }

  return (
    <button
      className={`
        relative inline-flex items-center justify-center
        font-medium rounded-lg transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-60 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="animate-spin">⚪</span>
        </span>
      )}
      <span className={loading ? 'opacity-0' : ''}>
        {children}
      </span>
    </button>
  )
}

// Responsive Container
interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 'xl',
  padding = true
}) => {
  const breakpoint = useBreakpoint()
  const safeArea = useSafeArea()

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  const paddingClass = padding 
    ? breakpoint.isMobile 
      ? 'px-4 py-3' 
      : 'px-6 py-4'
    : ''

  return (
    <div 
      className={`
        mx-auto
        ${maxWidthClasses[maxWidth]}
        ${paddingClass}
        ${className}
      `}
      style={{
        paddingLeft: padding ? Math.max(16, safeArea.left) : 0,
        paddingRight: padding ? Math.max(16, safeArea.right) : 0
      }}
    >
      {children}
    </div>
  )
}

// Add required animations
if (typeof window !== 'undefined' && !document.getElementById('mobile-animations')) {
  const style = document.createElement('style')
  style.id = 'mobile-animations'
  style.textContent = `
    @keyframes slideInUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes slideInLeft {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-slideInUp { animation: slideInUp 0.3s ease-out; }
    .animate-slideInLeft { animation: slideInLeft 0.3s ease-out; }
    .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
    .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
  `
  document.head.appendChild(style)
}
