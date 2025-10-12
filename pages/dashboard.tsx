import { useEffect } from 'react'
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
  const dispatch = useDispatch<any>()
  const { appointments } = useSelector((state: RootState) => state.appointments)
  const { user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    dispatch(fetchAppointments({}))
  }, [dispatch])

  // Calculate statistics
  const appointmentsList = appointments || []
  
  const todayAppointments = appointmentsList.filter(apt => {
    const today = new Date().toISOString().split('T')[0]
    return apt.date === today
  }).length

  const pendingConfirmations = appointmentsList.filter(apt => 
    apt.status === 'pending'
  ).length

  const thisMonthRevenue = appointmentsList
    .filter(apt => {
      const now = new Date()
      const aptDate = new Date(apt.date)
      return aptDate.getMonth() === now.getMonth() && 
             aptDate.getFullYear() === now.getFullYear() &&
             apt.paymentStatus === 'paid'
    })
    .reduce((sum, apt) => sum + apt.amount, 0)

  const activeSessions = 1 // This would come from session management

  const statistics = [
    {
      title: "Today's Appointments",
      value: todayAppointments.toString(),
      change: '+12%',
      isPositive: true,
      icon: <CalendarCheck size={20} className="text-blue-500" />,
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Confirmations',
      value: pendingConfirmations.toString(),
      change: '-3%',
      isPositive: false,
      icon: <AlertCircle size={20} className="text-amber-500" />,
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Total Revenue (This Month)',
      value: `Rs ${thisMonthRevenue.toLocaleString()}`,
      change: '+18%',
      isPositive: true,
      icon: <DollarSign size={20} className="text-green-500" />,
      bgColor: 'bg-green-50'
    },
    {
      title: 'Active Sessions',
      value: activeSessions.toString(),
      change: '0%',
      isPositive: true,
      icon: <Users size={20} className="text-purple-500" />,
      bgColor: 'bg-purple-50'
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