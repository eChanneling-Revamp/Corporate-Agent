import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSelector } from 'react-redux'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { 
  Activity,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  Target,
  DollarSign,
  Phone,
  MessageSquare,
  Mail,
  CheckCircle,
  AlertCircle,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  RefreshCw,
  Download,
  Filter,
  Grid3x3,
  List,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Bell
} from 'lucide-react'
import { RootState } from '../store/store'
import DashboardLayout from '../components/layout/DashboardLayout'
import StatisticsCard from '../components/dashboard/StatisticsCard'
import AnalyticsChart from '../components/dashboard/AnalyticsChart'
import PerformanceMetrics from '../components/dashboard/PerformanceMetrics'
import QuickActionsPanel from '../components/dashboard/QuickActionsPanel'
import toast from 'react-hot-toast'

// Dynamic imports for performance optimization
const TaskManagement = dynamic(() => import('../components/dashboard/TaskManagement'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
  ssr: false
})

const CustomerInteractionHistory = dynamic(() => import('../components/dashboard/CustomerInteractionHistory'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
  ssr: false
})

const RealTimeNotifications = dynamic(() => import('../components/dashboard/RealTimeNotifications'), {
  loading: () => <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />,
  ssr: false
})

interface DashboardMetrics {
  totalAppointments: number
  completedTasks: number
  customerSatisfaction: number
  averageResponseTime: string
  revenue: number
  pendingActions: number
  activeChats: number
  missedCalls: number
}

interface AgentPerformance {
  efficiency: number
  accuracy: number
  customerRating: number
  tasksCompleted: number
  appointmentsHandled: number
  averageHandlingTime: string
  firstCallResolution: number
  escalationRate: number
}

const AgentDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [compactView, setCompactView] = useState(false)
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('today')
  const [showTasks, setShowTasks] = useState(true)
  const [showInteractions, setShowInteractions] = useState(true)
  const [showAnalytics, setShowAnalytics] = useState(true)
  
  // Dashboard metrics
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAppointments: 24,
    completedTasks: 18,
    customerSatisfaction: 4.7,
    averageResponseTime: '2m 15s',
    revenue: 168500,
    pendingActions: 6,
    activeChats: 3,
    missedCalls: 2
  })

  // Agent performance metrics
  const [performance, setPerformance] = useState<AgentPerformance>({
    efficiency: 92,
    accuracy: 98,
    customerRating: 4.8,
    tasksCompleted: 45,
    appointmentsHandled: 32,
    averageHandlingTime: '4m 30s',
    firstCallResolution: 87,
    escalationRate: 13
  })

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time metric updates
      setMetrics(prev => ({
        ...prev,
        activeChats: Math.max(0, prev.activeChats + (Math.random() > 0.5 ? 1 : -1)),
        pendingActions: Math.max(0, prev.pendingActions + (Math.random() > 0.7 ? 1 : -1))
      }))
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // Performance data for charts
  const performanceData = useMemo(() => {
    const hourlyData = []
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
      hourlyData.push({
        name: hour.getHours() + ':00',
        appointments: Math.floor(Math.random() * 10) + 5,
        tasks: Math.floor(Math.random() * 8) + 3,
        interactions: Math.floor(Math.random() * 15) + 8,
        revenue: Math.floor(Math.random() * 20000) + 10000
      })
    }
    return hourlyData
  }, [dateRange])

  // KPI Cards Data
  const kpiCards = [
    {
      title: "Today's Appointments",
      value: metrics.totalAppointments.toString(),
      change: '+12%',
      isPositive: true,
      icon: <Calendar size={20} className="text-blue-500" />,
      bgColor: 'bg-blue-50',
      trend: 'up' as const,
      subtitle: 'Scheduled today',
      onClick: () => toast('Opening appointments view...')
    },
    {
      title: 'Tasks Completed',
      value: `${metrics.completedTasks}/24`,
      change: '+8%',
      isPositive: true,
      icon: <CheckCircle size={20} className="text-green-500" />,
      bgColor: 'bg-green-50',
      trend: 'up' as const,
      subtitle: '75% completion rate',
      onClick: () => setShowTasks(true)
    },
    {
      title: 'Customer Rating',
      value: metrics.customerSatisfaction.toFixed(1),
      change: '+0.3',
      isPositive: true,
      icon: <Award size={20} className="text-yellow-500" />,
      bgColor: 'bg-yellow-50',
      trend: 'up' as const,
      subtitle: 'Last 30 days',
      onClick: () => toast('Opening feedback details...')
    },
    {
      title: 'Response Time',
      value: metrics.averageResponseTime,
      change: '-15s',
      isPositive: true,
      icon: <Clock size={20} className="text-purple-500" />,
      bgColor: 'bg-purple-50',
      trend: 'down' as const,
      subtitle: 'Average today',
      onClick: () => toast('Opening response metrics...')
    }
  ]

  // Quick stats for sidebar
  const quickStats = [
    { label: 'Active Chats', value: metrics.activeChats, icon: <MessageSquare className="h-4 w-4" />, color: 'text-green-600' },
    { label: 'Pending Actions', value: metrics.pendingActions, icon: <AlertCircle className="h-4 w-4" />, color: 'text-orange-600' },
    { label: 'Missed Calls', value: metrics.missedCalls, icon: <Phone className="h-4 w-4" />, color: 'text-red-600' },
    { label: 'Emails', value: 5, icon: <Mail className="h-4 w-4" />, color: 'text-blue-600' }
  ]

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Update metrics with new random values
    setMetrics(prev => ({
      ...prev,
      totalAppointments: Math.floor(Math.random() * 10) + 20,
      completedTasks: Math.floor(Math.random() * 10) + 15,
      customerSatisfaction: (Math.random() * 0.5 + 4.5),
      revenue: Math.floor(Math.random() * 50000) + 150000
    }))
    
    toast.success('Dashboard refreshed successfully')
    setRefreshing(false)
  }, [])

  // Export dashboard data
  const handleExport = useCallback(() => {
    const data = {
      metrics,
      performance,
      exportDate: new Date().toISOString(),
      agent: user?.email
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    toast.success('Dashboard data exported')
  }, [metrics, performance, user])

  // Toggle fullscreen for widgets
  const toggleFullscreen = useCallback((widgetId: string) => {
    setFullscreenWidget(fullscreenWidget === widgetId ? null : widgetId)
  }, [fullscreenWidget])

  // Performance indicator component
  const PerformanceIndicator: React.FC<{ label: string; value: number; suffix?: string }> = ({ label, value, suffix = '%' }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-24 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              value >= 90 ? 'bg-green-500' : value >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, value)}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {value}{suffix}
        </span>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <Head>
        <title>Agent Dashboard - eChanneling</title>
        <meta name="description" content="Agent Dashboard for eChanneling Corporate Portal" />
      </Head>

      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Agent Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Welcome back, {user?.name || 'Agent'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Date Range Selector */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>

                {/* Action Buttons */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  title="Refresh Dashboard"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={handleExport}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Export Dashboard"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setCompactView(!compactView)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title={compactView ? 'Expand View' : 'Compact View'}
                >
                  {compactView ? <Maximize2 className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
                </button>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title={darkMode ? 'Light Mode' : 'Dark Mode'}
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Notifications */}
                <div className="relative">
                  <RealTimeNotifications
                    userId={user?.id || 'agent-001'}
                    userRole={user?.role || 'agent'}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="flex flex-wrap items-center gap-4 mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {quickStats.map((stat, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`${stat.color}`}>{stat.icon}</div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
              
              <div className="ml-auto">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">System Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="xl:col-span-2 space-y-6">
              {/* KPI Cards */}
              <div className={`grid ${compactView ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-4`}>
                {kpiCards.map((card, index) => (
                  <StatisticsCard key={index} {...card} />
                ))}
              </div>

              {/* Performance Chart */}
              {showAnalytics && (
                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${
                  fullscreenWidget === 'analytics' ? 'fixed inset-4 z-50' : ''
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Real-Time Performance
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFullscreen('analytics')}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {fullscreenWidget === 'analytics' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <AnalyticsChart
                    data={performanceData}
                    title=""
                    subtitle="Hourly breakdown of activities"
                  />
                </div>
              )}

              {/* Task Management */}
              {showTasks && (
                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${
                  fullscreenWidget === 'tasks' ? 'fixed inset-4 z-50 overflow-y-auto' : ''
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Task Management
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFullscreen('tasks')}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {fullscreenWidget === 'tasks' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <TaskManagement
                    userId={user?.id || 'agent-001'}
                    userRole={user?.role || 'agent'}
                  />
                </div>
              )}

              {/* Customer Interactions */}
              {showInteractions && (
                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${
                  fullscreenWidget === 'interactions' ? 'fixed inset-4 z-50 overflow-y-auto' : ''
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Interactions
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFullscreen('interactions')}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {fullscreenWidget === 'interactions' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <CustomerInteractionHistory
                    agentId={user?.id || 'agent-001'}
                    userRole={user?.role || 'agent'}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Agent Performance Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Your Performance
                </h3>
                <div className="space-y-3">
                  <PerformanceIndicator label="Efficiency" value={performance.efficiency} />
                  <PerformanceIndicator label="Accuracy" value={performance.accuracy} />
                  <PerformanceIndicator label="FCR Rate" value={performance.firstCallResolution} />
                  <PerformanceIndicator label="Customer Rating" value={performance.customerRating * 20} />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {performance.tasksCompleted}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tasks Today</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {performance.appointmentsHandled}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Appointments</p>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  View Detailed Report
                </button>
              </div>

              {/* Quick Actions */}
              <QuickActionsPanel />

              {/* Performance Metrics */}
              <PerformanceMetrics />

              {/* Help & Support */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between group">
                    <div className="flex items-center space-x-2">
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Help Center</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between group">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Settings</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between group">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Documentation</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between group">
                    <div className="flex items-center space-x-2">
                      <LogOut className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Sign Out</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AgentDashboard
