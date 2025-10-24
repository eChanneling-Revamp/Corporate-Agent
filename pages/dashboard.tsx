import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Head from 'next/head'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import StatisticsCard from '../components/dashboard/StatisticsCard'
import QuickActionsPanel from '../components/dashboard/QuickActionsPanel'
import RecentAppointmentsTable from '../components/dashboard/RecentAppointmentsTable'
import NotificationsPanel from '../components/dashboard/NotificationsPanel'
import AnalyticsChart from '../components/dashboard/AnalyticsChart'
import PerformanceMetrics from '../components/dashboard/PerformanceMetrics'
import { CalendarCheck, AlertCircle, DollarSign, Users, TrendingUp, Activity } from 'lucide-react'
import { fetchAppointments } from '../store/slices/appointmentSlice'
import { RootState } from '../store/store'

export default function Dashboard() {
  const dispatch = useDispatch<any>()
  const { appointments } = useSelector((state: RootState) => state.appointments)
  const { user } = useSelector((state: RootState) => state.auth)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        console.log('Fetching appointments...')
        const result = await dispatch(fetchAppointments({}))
        console.log('Fetch result:', result)
      } catch (error) {
        console.error('Error fetching appointments:', error)
      }
      setLoading(false)
    }
    loadData()
  }, [dispatch])

  // Debug logging
  useEffect(() => {
    console.log('Appointments from Redux:', appointments)
    console.log('Is appointments an array?', Array.isArray(appointments))
  }, [appointments])

  // Calculate statistics with defensive programming
  const appointmentsArray = Array.isArray(appointments) ? appointments : []
  
  const todayAppointments = appointmentsArray.filter(apt => {
    const today = new Date().toISOString().split('T')[0]
    return apt.date === today || apt.appointmentDate === today
  }).length

  const pendingConfirmations = appointmentsArray.filter(apt => 
    apt.status === 'pending' || apt.status === 'PENDING'
  ).length

  const thisMonthRevenue = appointmentsArray
    .filter(apt => {
      const now = new Date()
      const aptDate = new Date(apt.date || apt.appointmentDate)
      return aptDate.getMonth() === now.getMonth() && 
             aptDate.getFullYear() === now.getFullYear() &&
             (apt.paymentStatus === 'paid' || apt.paymentStatus === 'COMPLETED')
    })
    .reduce((sum, apt) => sum + (apt.amount || apt.totalAmount || apt.consultationFee || 0), 0)

  const activeSessions = 1 // This would come from session management

  // Mock analytics data for charts
  const analyticsData = [
    { name: 'Mon', appointments: 12, revenue: 42000 },
    { name: 'Tue', appointments: 19, revenue: 66500 },
    { name: 'Wed', appointments: 15, revenue: 52500 },
    { name: 'Thu', appointments: 22, revenue: 77000 },
    { name: 'Fri', appointments: 18, revenue: 63000 },
    { name: 'Sat', appointments: 25, revenue: 87500 },
    { name: 'Sun', appointments: 10, revenue: 35000 }
  ]

  const statistics = [
    {
      title: "Today's Appointments",
      value: todayAppointments.toString(),
      change: '+12%',
      isPositive: true,
      icon: <CalendarCheck size={20} className="text-blue-500" />,
      bgColor: 'bg-blue-50',
      trend: 'up' as const,
      loading: loading,
      subtitle: 'Scheduled for today'
    },
    {
      title: 'Pending Confirmations',
      value: pendingConfirmations.toString(),
      change: '-3%',
      isPositive: true,
      icon: <AlertCircle size={20} className="text-amber-500" />,
      bgColor: 'bg-amber-50',
      trend: 'down' as const,
      loading: loading,
      subtitle: 'Awaiting confirmation'
    },
    {
      title: 'Total Revenue (This Month)',
      value: `Rs ${thisMonthRevenue.toLocaleString()}`,
      change: '+18%',
      isPositive: true,
      icon: <DollarSign size={20} className="text-green-500" />,
      bgColor: 'bg-green-50',
      trend: 'up' as const,
      loading: loading,
      subtitle: 'Monthly earnings'
    },
    {
      title: 'Active Sessions',
      value: activeSessions.toString(),
      change: '0%',
      isPositive: true,
      icon: <Users size={20} className="text-purple-500" />,
      bgColor: 'bg-purple-50',
      trend: 'neutral' as const,
      loading: loading,
      subtitle: 'Current active users'
    }
  ]

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard - eChanneling Corporate Agent</title>
        <meta name="description" content="Corporate Agent Dashboard for eChanneling" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 sm:p-6 text-white">
            <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="mt-1 text-blue-100 text-sm sm:text-base">
              Here's what's happening with your appointments today.
            </p>
          </div>

          {/* Statistics Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statistics.map((stat, index) => (
              <StatisticsCard key={index} {...stat} />
            ))}
          </div>

          {/* Analytics Chart */}
          <div className="w-full">
            <AnalyticsChart 
              data={analyticsData}
              title="Weekly Performance Overview"
              subtitle="Appointments and revenue trends for the current week"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Quick Actions Panel */}
            <div className="xl:col-span-1">
              <QuickActionsPanel />
            </div>

            {/* System Notifications */}
            <div className="xl:col-span-2">
              <NotificationsPanel />
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="w-full">
            <PerformanceMetrics />
          </div>

          {/* Recent Appointments Table */}
          <div className="w-full">
            <RecentAppointmentsTable />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}