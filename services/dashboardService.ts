import apiClient from './authService'

export interface DashboardStats {
  totalAppointments: number
  todayAppointments: number
  pendingAppointments: number
  completedAppointments: number
  totalRevenue: number
  todayRevenue: number
  activePatients: number
  totalDoctors: number
  activeDoctors: number
  totalHospitals: number
  averageRating: number
  conversionRate: number
  previousPeriodComparison: {
    appointments: number
    revenue: number
    patients: number
  }
}

export interface RecentActivity {
  id: string
  type: 'APPOINTMENT_BOOKED' | 'APPOINTMENT_CANCELLED' | 'PAYMENT_RECEIVED' | 'DOCTOR_ADDED' | 'HOSPITAL_ADDED'
  title: string
  description: string
  timestamp: string
  entityId?: string
  userId?: string
  metadata?: any
}

export interface PerformanceMetrics {
  appointmentTrends: Array<{
    date: string
    appointments: number
    revenue: number
  }>
  popularSpecializations: Array<{
    specialization: string
    count: number
    percentage: number
  }>
  topDoctors: Array<{
    id: string
    name: string
    specialization: string
    appointmentCount: number
    rating: number
    revenue: number
  }>
  topHospitals: Array<{
    id: string
    name: string
    city: string
    appointmentCount: number
    doctorCount: number
    revenue: number
  }>
  hourlyDistribution: Array<{
    hour: number
    appointmentCount: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
}

export interface TaskSummary {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
  highPriority: number
  recentTasks: Array<{
    id: string
    title: string
    priority: string
    status: string
    dueDate: string
    assignedTo: string
  }>
}

export interface NotificationSummary {
  total: number
  unread: number
  recent: Array<{
    id: string
    title: string
    message: string
    type: string
    isRead: boolean
    createdAt: string
  }>
}

export const dashboardAPI = {
  // Get overall dashboard statistics
  getDashboardStats: async (period: 'today' | 'week' | 'month' | 'year' = 'today') => {
    const response = await apiClient.get(`/dashboard/stats?period=${period}`)
    return response.data as { success: boolean; data: DashboardStats }
  },

  // Get recent activities
  getRecentActivities: async (limit: number = 10) => {
    const response = await apiClient.get(`/dashboard/activities?limit=${limit}`)
    return response.data as { success: boolean; data: RecentActivity[] }
  },

  // Get performance metrics
  getPerformanceMetrics: async (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams()
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)
    
    const response = await apiClient.get(`/dashboard/performance?${params.toString()}`)
    return response.data as { success: boolean; data: PerformanceMetrics }
  },

  // Get task summary
  getTaskSummary: async () => {
    const response = await apiClient.get('/dashboard/tasks')
    return response.data as { success: boolean; data: TaskSummary }
  },

  // Get notification summary
  getNotificationSummary: async () => {
    const response = await apiClient.get('/dashboard/notifications')
    return response.data as { success: boolean; data: NotificationSummary }
  },

  // Get appointment analytics
  getAppointmentAnalytics: async (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
    const response = await apiClient.get(`/dashboard/appointments/analytics?period=${period}`)
    return response.data
  },

  // Get revenue analytics
  getRevenueAnalytics: async (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
    const response = await apiClient.get(`/dashboard/revenue/analytics?period=${period}`)
    return response.data
  },

  // Get real-time metrics (updated every minute)
  getRealTimeMetrics: async () => {
    const response = await apiClient.get('/dashboard/realtime')
    return response.data
  },

  // Get agent performance metrics
  getAgentPerformance: async (agentId?: string, period: 'week' | 'month' | 'quarter' = 'month') => {
    const params = new URLSearchParams()
    params.append('period', period)
    if (agentId) params.append('agentId', agentId)
    
    const response = await apiClient.get(`/dashboard/agent-performance?${params.toString()}`)
    return response.data
  },

  // Get customer satisfaction metrics
  getCustomerSatisfaction: async (period: 'week' | 'month' | 'quarter' = 'month') => {
    const response = await apiClient.get(`/dashboard/customer-satisfaction?period=${period}`)
    return response.data
  },

  // Get operational efficiency metrics
  getOperationalEfficiency: async (period: 'week' | 'month' | 'quarter' = 'month') => {
    const response = await apiClient.get(`/dashboard/operational-efficiency?period=${period}`)
    return response.data
  },

  // Export dashboard report
  exportDashboardReport: async (
    type: 'summary' | 'detailed' | 'performance' = 'summary',
    format: 'pdf' | 'excel' | 'csv' = 'pdf',
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ) => {
    const response = await apiClient.get(`/dashboard/export?type=${type}&format=${format}&period=${period}`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Get alerts and warnings
  getAlerts: async (severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    const response = await apiClient.get(`/dashboard/alerts?severity=${severity}`)
    return response.data
  },

  // Mark alert as read
  markAlertAsRead: async (alertId: string) => {
    const response = await apiClient.patch(`/dashboard/alerts/${alertId}/read`)
    return response.data
  },

  // Get system health status
  getSystemHealth: async () => {
    const response = await apiClient.get('/dashboard/health')
    return response.data
  },

  // Get upcoming events/appointments for quick view
  getUpcomingEvents: async (hours: number = 24) => {
    const response = await apiClient.get(`/dashboard/upcoming?hours=${hours}`)
    return response.data
  },

  // Get weekly/monthly summaries
  getPeriodSummary: async (period: 'week' | 'month', offset: number = 0) => {
    const response = await apiClient.get(`/dashboard/summary/${period}?offset=${offset}`)
    return response.data
  }
}

export default dashboardAPI