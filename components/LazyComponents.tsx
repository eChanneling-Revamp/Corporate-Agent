import { lazyLoad, lazyLoadWithRetry } from '../utils/lazyLoader'

// Dashboard Components - Load with retry for critical components
export const LazyDashboard = lazyLoadWithRetry(
  () => import('./dashboard/MainDashboard'),
  { loading: 'spinner', loadingText: 'Loading dashboard...', retries: 3 }
)

export const LazyMetricsCard = lazyLoad(
  () => import('./dashboard/MetricsCard'),
  { loading: 'card' }
)

export const LazyAnalyticsChart = lazyLoad(
  () => import('./dashboard/AnalyticsChart'),
  { loading: 'card', ssr: false } // Charts should not SSR
)

export const LazyRecentActivity = lazyLoad(
  () => import('./dashboard/RecentActivity'),
  { loading: 'table' }
)

export const LazyTaskManagement = lazyLoad(
  () => import('./dashboard/TaskManagement'),
  { loading: 'card' }
)

// Appointment Components
export const LazyAppointmentBooking = lazyLoad(
  () => import('./booking/AppointmentBookingForm'),
  { loading: 'spinner', loadingText: 'Loading booking form...' }
)

export const LazyDoctorCard = lazyLoad(
  () => import('./doctor/DoctorCard'),
  { loading: 'card' }
)

export const LazyDoctorSearch = lazyLoad(
  () => import('./doctor/DoctorSearch'),
  { loading: 'spinner' }
)

export const LazyTimeSlotPicker = lazyLoad(
  () => import('./booking/TimeSlotPicker'),
  { loading: 'card' }
)

// Report Components
export const LazyReportGenerator = lazyLoad(
  () => import('./reports/ReportGenerator'),
  { loading: 'spinner', loadingText: 'Loading report generator...', ssr: false }
)

export const LazyReportViewer = lazyLoad(
  () => import('./reports/ReportViewer'),
  { loading: 'spinner', ssr: false }
)

// Auth Components
export const LazyLoginForm = lazyLoadWithRetry(
  () => import('./auth/EnhancedLogin'),
  { loading: 'spinner', retries: 5 } // Critical component
)

export const LazyRegisterForm = lazyLoad(
  () => import('./auth/RegisterForm'),
  { loading: 'spinner' }
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

export const LazyFooter = lazyLoad(
  () => import('./layout/Footer'),
  { loading: 'none', ssr: true }
)

// Heavy Components - Load only when needed
export const LazyDataTable = lazyLoad(
  () => import('./common/DataTable'),
  { 
    loading: 'table',
    ssr: false,
    loadingDelay: 500 // Wait before showing loader
  }
)

export const LazyRichTextEditor = lazyLoad(
  () => import('./common/RichTextEditor'),
  { 
    loading: 'spinner',
    loadingText: 'Loading editor...',
    ssr: false 
  }
)

export const LazyCalendar = lazyLoad(
  () => import('./common/Calendar'),
  { 
    loading: 'card',
    ssr: false 
  }
)

export const LazyVideoPlayer = lazyLoad(
  () => import('./common/VideoPlayer'),
  { 
    loading: 'spinner',
    ssr: false,
    suspense: true 
  }
)

// Modal Components - Load on demand
export const LazyConfirmationModal = lazyLoad(
  () => import('./modals/ConfirmationModal'),
  { loading: 'none' }
)

export const LazyImageGalleryModal = lazyLoad(
  () => import('./modals/ImageGalleryModal'),
  { loading: 'spinner', ssr: false }
)

export const LazyPaymentModal = lazyLoadWithRetry(
  () => import('./modals/PaymentModal'),
  { loading: 'spinner', retries: 3 }
)

// Export all lazy components as a registry
export const LazyComponents = {
  // Dashboard
  Dashboard: LazyDashboard,
  MetricsCard: LazyMetricsCard,
  AnalyticsChart: LazyAnalyticsChart,
  RecentActivity: LazyRecentActivity,
  TaskManagement: LazyTaskManagement,
  
  // Appointments
  AppointmentBooking: LazyAppointmentBooking,
  DoctorCard: LazyDoctorCard,
  DoctorSearch: LazyDoctorSearch,
  TimeSlotPicker: LazyTimeSlotPicker,
  
  // Reports
  ReportGenerator: LazyReportGenerator,
  ReportViewer: LazyReportViewer,
  
  // Auth
  LoginForm: LazyLoginForm,
  RegisterForm: LazyRegisterForm,
  
  // Layout
  Sidebar: LazySidebar,
  Header: LazyHeader,
  Footer: LazyFooter,
  
  // Common
  DataTable: LazyDataTable,
  RichTextEditor: LazyRichTextEditor,
  Calendar: LazyCalendar,
  VideoPlayer: LazyVideoPlayer,
  
  // Modals
  ConfirmationModal: LazyConfirmationModal,
  ImageGalleryModal: LazyImageGalleryModal,
  PaymentModal: LazyPaymentModal
}

// Preload critical components
export const preloadCriticalComponents = async () => {
  const critical = [
    () => import('./dashboard/MainDashboard'),
    () => import('./auth/EnhancedLogin'),
    () => import('./layout/Header'),
    () => import('./layout/Sidebar')
  ]
  
  await Promise.all(critical.map(fn => fn().catch(console.error)))
}

// Preload route components based on route
export const preloadRouteComponents = async (route: string) => {
  const routeComponents: Record<string, Array<() => Promise<any>>> = {
    '/dashboard': [
      () => import('./dashboard/MainDashboard'),
      () => import('./dashboard/MetricsCard'),
      () => import('./dashboard/AnalyticsChart')
    ],
    '/appointments': [
      () => import('./booking/AppointmentBookingForm'),
      () => import('./doctor/DoctorSearch'),
      () => import('./booking/TimeSlotPicker')
    ],
    '/reports': [
      () => import('./reports/ReportGenerator'),
      () => import('./reports/ReportViewer')
    ]
  }
  
  const components = routeComponents[route]
  if (components) {
    await Promise.all(components.map(fn => fn().catch(console.error)))
  }
}

// Export default
export default LazyComponents
