import React, { Suspense, lazy, ComponentType } from 'react'
import LoadingSpinner from './LoadingSpinner'
import ErrorBoundary from './ErrorBoundary'

interface LazyLoadOptions {
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
  delay?: number
}

/**
 * Higher-order component for lazy loading with error boundary
 */
export function withLazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = lazy(async () => {
    if (options.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay))
    }
    return importFunc()
  })

  return (props: React.ComponentProps<T>) => (
    <ErrorBoundary fallback={options.errorFallback}>
      <Suspense fallback={options.fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}

/**
 * Lazy load component with intersection observer
 */
interface LazyLoadWrapperProps {
  children: React.ReactNode
  threshold?: number
  rootMargin?: string
  placeholder?: React.ReactNode
  onVisible?: () => void
}

export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  threshold = 0.1,
  rootMargin = '100px',
  placeholder = <LoadingSpinner />,
  onVisible,
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          onVisible?.()
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin, onVisible])

  return <div ref={ref}>{isVisible ? children : placeholder}</div>
}

/**
 * Lazy load images with placeholder
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = '/images/placeholder.svg',
  onLoad,
  onError,
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder)
  const [imageRef, setImageRef] = React.useState<HTMLImageElement | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    if (!imageRef) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image()
          img.src = src
          img.onload = () => {
            setImageSrc(src)
            setIsLoading(false)
            onLoad?.()
          }
          img.onerror = () => {
            setHasError(true)
            setIsLoading(false)
            onError?.()
          }
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(imageRef)

    return () => observer.disconnect()
  }, [imageRef, src, onLoad, onError])

  return (
    <div className={`relative ${className}`}>
      <img
        ref={setImageRef}
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'blur-sm' : ''} transition-all duration-300`}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400">Failed to load image</span>
        </div>
      )}
    </div>
  )
}

/**
 * Preload component for critical resources
 */
export const preloadComponent = (componentPath: string) => {
  return import(componentPath)
}

/**
 * Batch preload multiple components
 */
export const preloadComponents = (paths: string[]) => {
  return Promise.all(paths.map(path => import(path)))
}

// Export lazy-loaded page components
export const LazyDashboard = withLazyLoad(
  () => import('../../pages/dashboard')
)

export const LazyAppointments = withLazyLoad(
  () => import('../../pages/appointments')
)

export const LazyDoctorSearch = withLazyLoad(
  () => import('../../pages/doctor-search')
)

export const LazyBulkBooking = withLazyLoad(
  () => import('../../pages/bulk-booking')
)

export const LazyReports = withLazyLoad(
  () => import('../../pages/reports')
)

export const LazySettings = withLazyLoad(
  () => import('../../pages/settings')
)

export const LazyPayments = withLazyLoad(
  () => import('../../pages/payments')
)
