import { lazyLoad, lazyLoadWithRetry } from '../utils/lazyLoader'

// Dashboard Components - Load with retry for critical components
export const LazyAnalyticsChart = lazyLoad(
  () => import('./dashboard/AnalyticsChart'),
  { loading: 'card', ssr: false } // Charts should not SSR
)

export const LazyTaskManagement = lazyLoad(
  () => import('./dashboard/TaskManagement'),
  { loading: 'card' }
)

export const LazyPerformanceDashboard = lazyLoad(
  () => import('./dashboard/PerformanceDashboard'),
  { loading: 'spinner', loadingText: 'Loading performance dashboard...' }
)

// Form Components
export const LazyCustomerForm = lazyLoad(
  () => import('./form/CustomerForm'),
  { loading: 'spinner', loadingText: 'Loading customer form...' }
)

export const LazySupportTicketForm = lazyLoad(
  () => import('./form/SupportTicketForm'),
  { loading: 'spinner', loadingText: 'Loading support ticket form...' }
)

// Layout Components
export const LazySidebar = lazyLoad(
  () => import('./layout/Sidebar'),
  { loading: 'none', ssr: true } // Layout should SSR
)

export const LazyHeader = lazyLoad(
  () => import('./layout/Header'),
  { loading: 'none', ssr: true }
)

export const LazyDashboardLayout = lazyLoad(
  () => import('./layout/DashboardLayout'),
  { loading: 'none', ssr: true }
)

// Common Components
export const LazyLoadingSpinner = lazyLoad(
  () => import('./common/LoadingSpinner'),
  { 
    loading: 'none',
    ssr: false
  }
)

// Export all lazy components as a registry
export const LazyComponents = {
  // Dashboard
  AnalyticsChart: LazyAnalyticsChart,
  TaskManagement: LazyTaskManagement,
  PerformanceDashboard: LazyPerformanceDashboard,
  
  // Forms
  CustomerForm: LazyCustomerForm,
  SupportTicketForm: LazySupportTicketForm,
  
  // Layout
  Sidebar: LazySidebar,
  Header: LazyHeader,
  DashboardLayout: LazyDashboardLayout,
  
  // Common
  LoadingSpinner: LazyLoadingSpinner
}

// Preload critical components
export const preloadCriticalComponents = async () => {
  const critical = [
    () => import('./layout/Header'),
    () => import('./layout/Sidebar'),
    () => import('./dashboard/PerformanceDashboard')
  ]
  
  await Promise.all(critical.map(fn => fn().catch(console.error)))
}

// Preload route components based on route
export const preloadRouteComponents = async (route: string) => {
  const routeComponents: Record<string, Array<() => Promise<any>>> = {
    '/dashboard': [
      () => import('./dashboard/PerformanceDashboard'),
      () => import('./dashboard/AnalyticsChart')
    ],
    '/customers': [
      () => import('./form/CustomerForm'),
      () => import('./common/LoadingSpinner')
    ],
    '/support-tickets': [
      () => import('./form/SupportTicketForm'),
      () => import('./common/LoadingSpinner')
    ]
  }
  
  const components = routeComponents[route]
  if (components) {
    await Promise.all(components.map(fn => fn().catch(console.error)))
  }
}

// Export default
export default LazyComponents
