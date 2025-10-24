import React, { useState } from 'react'
import Image from 'next/image'
import { ImageOff, Loader2 } from 'lucide-react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  className?: string
  containerClassName?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
  showLoader?: boolean
  lazy?: boolean
  aspectRatio?: string
  rounded?: boolean | string
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  className = '',
  containerClassName = '',
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.jpg',
  showLoader = true,
  lazy = true,
  aspectRatio,
  rounded = false
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
    }
    onError?.()
  }

  const getRoundedClass = () => {
    if (typeof rounded === 'string') return rounded
    if (rounded === true) return 'rounded-lg'
    return ''
  }

  const containerStyle = aspectRatio
    ? { paddingBottom: aspectRatio, position: 'relative' as const }
    : {}

  if (hasError && currentSrc === fallbackSrc) {
    return (
      <div 
        className={`
          flex items-center justify-center bg-gray-200 
          ${getRoundedClass()} 
          ${containerClassName}
        `}
        style={{ width, height, ...containerStyle }}
      >
        <ImageOff className="w-8 h-8 text-gray-400" />
      </div>
    )
  }

  return (
    <div 
      className={`relative ${containerClassName}`}
      style={containerStyle}
    >
      {showLoader && isLoading && (
        <div 
          className={`
            absolute inset-0 flex items-center justify-center 
            bg-gray-100 z-10 
            ${getRoundedClass()}
          `}
        >
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}
      
      {fill ? (
        <Image
          src={currentSrc}
          alt={alt}
          fill
          sizes={sizes || '100vw'}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className={`${getRoundedClass()} ${className}`}
          style={{ objectFit, objectPosition }}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
        />
      ) : (
        <Image
          src={currentSrc}
          alt={alt}
          width={width || 500}
          height={height || 300}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className={`${getRoundedClass()} ${className}`}
          style={{ objectFit, objectPosition }}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          sizes={sizes}
        />
      )}
    </div>
  )
}

// Profile Avatar Component with optimization
interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showOnlineStatus?: boolean
  isOnline?: boolean
  priority?: boolean
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
  showOnlineStatus = false,
  isOnline = false,
  priority = false
}) => {
  const sizeMap = {
    xs: { dimension: 24, text: 'text-xs' },
    sm: { dimension: 32, text: 'text-sm' },
    md: { dimension: 40, text: 'text-base' },
    lg: { dimension: 48, text: 'text-lg' },
    xl: { dimension: 64, text: 'text-xl' }
  }

  const { dimension, text } = sizeMap[size]
  const initials = name
    ? name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <OptimizedImage
          src={src}
          alt={alt || name || 'Avatar'}
          width={dimension}
          height={dimension}
          className="rounded-full"
          priority={priority}
          showLoader={false}
          fallbackSrc=""
        />
      ) : (
        <div
          className={`
            flex items-center justify-center rounded-full
            bg-gradient-to-br from-blue-500 to-blue-600
            text-white font-medium ${text}
          `}
          style={{ width: dimension, height: dimension }}
        >
          {initials}
        </div>
      )}
      
      {showOnlineStatus && (
        <span
          className={`
            absolute bottom-0 right-0 block rounded-full
            ring-2 ring-white
            ${isOnline ? 'bg-green-400' : 'bg-gray-300'}
          `}
          style={{
            width: dimension * 0.25,
            height: dimension * 0.25
          }}
        />
      )}
    </div>
  )
}

// Thumbnail Gallery Component
interface ThumbnailGalleryProps {
  images: Array<{
    src: string
    alt: string
    thumbnail?: string
  }>
  columns?: number
  gap?: number
  className?: string
  onImageClick?: (index: number) => void
}

export const ThumbnailGallery: React.FC<ThumbnailGalleryProps> = ({
  images,
  columns = 3,
  gap = 4,
  className = '',
  onImageClick
}) => {
  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg"
          onClick={() => onImageClick?.(index)}
        >
          <OptimizedImage
            src={image.thumbnail || image.src}
            alt={image.alt}
            fill
            sizes={`(max-width: 768px) 50vw, ${100 / columns}vw`}
            className="transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
        </div>
      ))}
    </div>
  )
}

// Hero Image Component with optimization
interface HeroImageProps {
  src: string
  alt: string
  title?: string
  subtitle?: string
  height?: string
  overlay?: boolean
  priority?: boolean
  className?: string
}

export const HeroImage: React.FC<HeroImageProps> = ({
  src,
  alt,
  title,
  subtitle,
  height = '400px',
  overlay = true,
  priority = true,
  className = ''
}) => {
  return (
    <div 
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={90}
        sizes="100vw"
        className="object-cover"
      />
      
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
      )}
      
      {(title || subtitle) && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-white p-8">
          <div>
            {title && (
              <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-lg md:text-xl drop-shadow-lg">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Product Image Component
interface ProductImageProps {
  src: string
  alt: string
  badge?: string
  discount?: number
  className?: string
  onClick?: () => void
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  badge,
  discount,
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`relative group cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {badge && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            {badge}
          </span>
        )}
        
        {discount && discount > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            -{discount}%
          </span>
        )}
      </div>
    </div>
  )
}

export default OptimizedImage
