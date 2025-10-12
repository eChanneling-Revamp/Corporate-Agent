import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useDispatch, useSelector } from 'react-redux'
import Head from 'next/head'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import StatisticsCard from '../components/dashboard/StatisticsCard'
import QuickActionsPanel from '../components/dashboard/QuickActionsPanel'
import RecentAppointmentsTable from '../components/dashboard/RecentAppointmentsTable'
import NotificationsPanel from '../components/dashboard/NotificationsPanel'
import { CalendarCheck, AlertCircle, DollarSign, Users } from 'lucide-react'
import { fetchAppointments } from '../store/slices/appointmentSlice'
import { RootState } from '../store/store'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const dispatch = useDispatch<any>()
  const { appointments } = useSelector((state: RootState) => state.appointments)
  const [dashboardStats, setDashboardStats] = useState<any>({})
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    
    dispatch(fetchAppointments({}))
    
    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const stats = await response.json()
          setDashboardStats(stats)
          console.log('Dashboard stats loaded successfully:', stats)
        } else {
          console.error('Dashboard stats API error:', response.status, response.statusText)
          // Use fallback empty stats if API fails
          setDashboardStats({})
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        // Use fallback empty stats if fetch fails
        setDashboardStats({})
      } finally {
        setStatsLoading(false)
      }
    }
    
    fetchStats()
  }, [dispatch, session])

  // Use real statistics from API or fallback to calculated values
  const todayAppointments = dashboardStats.todayAppointments || 0
  const pendingConfirmations = dashboardStats.pendingConfirmations || 0
  const thisMonthRevenue = dashboardStats.monthlyRevenue || 0
  const activeSessions = dashboardStats.activeSessions || 0

  const statistics = [
    {
      title: "Today's Appointments",
      value: todayAppointments.toString(),
      change: '+12%', // Could be calculated from historical data
      isPositive: true,
      icon: <CalendarCheck size={20} className="text-blue-500" />,
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Confirmations',
      value: pendingConfirmations.toString(),
      change: '-3%', // Could be calculated from historical data
      isPositive: false,
      icon: <AlertCircle size={20} className="text-amber-500" />,
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Total Revenue (This Month)',
      value: `Rs ${thisMonthRevenue.toLocaleString()}`,
      change: dashboardStats.revenueChange || '+0%',
      isPositive: dashboardStats.revenueChange ? dashboardStats.revenueChange.startsWith('+') : true,
      icon: <DollarSign size={20} className="text-green-500" />,
      bgColor: 'bg-green-50'
    },
    {
      title: 'Active Sessions',
      value: activeSessions.toString(),
      change: '0%', // Could be calculated from session management
      isPositive: true,
      icon: <Users size={20} className="text-purple-500" />,
      bgColor: 'bg-purple-50'
    }
  ]

  // Handle loading and authentication states
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen">Please login to access dashboard</div>
  }

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
            <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {session.user?.name || 'Agent'}!</h1>
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

          {/* Recent Appointments Table */}
          <div className="w-full">
            <RecentAppointmentsTable />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}