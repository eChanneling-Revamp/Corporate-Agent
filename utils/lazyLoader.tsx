import dynamic from 'next/dynamic'
import React, { ComponentType, ReactNode } from 'react'
import LoadingSpinner, { CardSkeleton, TableSkeleton } from '../components/common/LoadingSpinner'

// Loading fallback types
type LoadingType = 'spinner' | 'card' | 'table' | 'custom' | 'none'

interface LazyLoadOptions {
  loading?: LoadingType | (() => ReactNode)
  ssr?: boolean
  suspense?: boolean
  loadingText?: string
  loadingDelay?: number
}

// Default loading components for different scenarios
const loadingComponents: Record<string, (text?: any) => JSX.Element | null> = {
  spinner: (text?: string) => (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" text={text || 'Loading...'} />
    </div>
  ),
  card: () => <CardSkeleton />,
  table: () => <TableSkeleton rows={5} columns={4} />,
  none: () => null
}

// Enhanced lazy loader with built-in loading states
export function lazyLoad<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyLoadOptions = {}
): ComponentType<P> {
  const {
    loading = 'spinner',
    ssr = false,
    suspense = false,
    loadingText,
    loadingDelay = 200
  } = options

  // Determine loading component
  let loadingComponent: () => JSX.Element | null
  
  if (typeof loading === 'function') {
    loadingComponent = () => {
      const result = loading()
      return result as JSX.Element | null
    }
  } else if (loading in loadingComponents) {
    loadingComponent = () => loadingComponents[loading](loadingText)
  } else {
    loadingComponent = () => null
  }

  return dynamic(importFn, {
    loading: loadingComponent,
    ssr,
    suspense
  }) as ComponentType<P>
}

// Preload component utility
export async function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>
): Promise<void> {
  try {
    await importFn()
  } catch (error) {
    console.error('Failed to preload component:', error)
  }
}

// Intersection Observer based lazy loading for components
export function useLazyLoadOnVisible<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyLoadOptions & { rootMargin?: string; threshold?: number } = {}
): [ComponentType<P> | null, boolean] {
  const [Component, setComponent] = React.useState<ComponentType<P> | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const observerRef = React.useRef<IntersectionObserver | null>(null)
  const elementRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!elementRef.current) return

    const loadComponent = async () => {
      setIsLoading(true)
      try {
        const module = await importFn()
        setComponent(() => module.default)
      } catch (error) {
        console.error('Failed to load component:', error)
      } finally {
        setIsLoading(false)
      }
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !Component) {
            loadComponent()
            observerRef.current?.disconnect()
          }
        })
      },
      {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.01
      }
    )

    observerRef.current.observe(elementRef.current)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  return [Component, isLoading]
}

// Lazy load with retry capability
export function lazyLoadWithRetry<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyLoadOptions & { retries?: number; retryDelay?: number } = {}
): ComponentType<P> {
  const { retries = 3, retryDelay = 1000, ...lazyOptions } = options

  const importWithRetry = async (): Promise<{ default: ComponentType<P> }> => {
    let lastError: Error | null = null
    
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn()
      } catch (error) {
        lastError = error as Error
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)))
        }
      }
    }
    
    throw lastError || new Error('Failed to load component after retries')
  }

  return lazyLoad(importWithRetry, lazyOptions)
}

// Batch lazy loading for multiple components
export async function lazyLoadBatch(
  imports: Array<() => Promise<{ default: ComponentType<any> }>>
): Promise<ComponentType<any>[]> {
  const modules = await Promise.all(
    imports.map(async (importFn) => {
      try {
        const module = await importFn()
        return module.default
      } catch (error) {
        console.error('Failed to load component in batch:', error)
        return null
      }
    })
  )
  
  return modules.filter(Boolean) as ComponentType<any>[]
}

// Component registry for centralized lazy loading
export class ComponentRegistry {
  private static instance: ComponentRegistry
  private components = new Map<string, ComponentType<any>>()
  private loadingPromises = new Map<string, Promise<ComponentType<any>>>()

  private constructor() {}

  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry()
    }
    return ComponentRegistry.instance
  }

  register(name: string, importFn: () => Promise<{ default: ComponentType<any> }>): void {
    if (!this.loadingPromises.has(name)) {
      this.loadingPromises.set(
        name,
        importFn().then((module) => {
          const Component = module.default
          this.components.set(name, Component)
          return Component
        })
      )
    }
  }

  async get(name: string): Promise<ComponentType<any> | null> {
    if (this.components.has(name)) {
      return this.components.get(name)!
    }

    if (this.loadingPromises.has(name)) {
      return await this.loadingPromises.get(name)!
    }

    return null
  }

  preload(names: string[]): Promise<void[]> {
    return Promise.all(
      names.map(async (name) => {
        await this.get(name)
      })
    )
  }

  clear(): void {
    this.components.clear()
    this.loadingPromises.clear()
  }
}

// Export singleton instance
export const componentRegistry = ComponentRegistry.getInstance()
