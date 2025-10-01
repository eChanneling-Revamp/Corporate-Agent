import React from 'react';
import StatisticsCard from '../components/dashboard/StatisticsCard';
import QuickActionsPanel from '../components/dashboard/QuickActionsPanel';
import RecentAppointmentsTable from '../components/dashboard/RecentAppointmentsTable';
import NotificationsPanel from '../components/dashboard/NotificationsPanel';
import { CalendarCheck, AlertCircle, DollarSign, Users } from 'lucide-react';
const Dashboard = () => {
  // Sample statistics data
  const statistics = [{
    title: "Today's Appointments",
    value: '28',
    change: '+12%',
    isPositive: true,
    icon: <CalendarCheck size={20} className="text-blue-500" />,
    bgColor: 'bg-blue-50'
  }, {
    title: 'Pending Confirmations',
    value: '14',
    change: '-3%',
    isPositive: false,
    icon: <AlertCircle size={20} className="text-amber-500" />,
    bgColor: 'bg-amber-50'
  }, {
    title: 'Total Revenue (This Month)',
    value: '₹ 145,285',
    change: '+18%',
    isPositive: true,
    icon: <DollarSign size={20} className="text-green-500" />,
    bgColor: 'bg-green-50'
  }, {
    title: 'Active Sessions',
    value: '5',
    change: '0%',
    isPositive: true,
    icon: <Users size={20} className="text-purple-500" />,
    bgColor: 'bg-purple-50'
  }];
  return <div className="space-y-6">
      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statistics.map((stat, index) => <StatisticsCard key={index} {...stat} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-1">
          <QuickActionsPanel />
        </div>
        {/* System Notifications */}
        <div className="lg:col-span-2">
          <NotificationsPanel />
        </div>
      </div>
      {/* Recent Appointments Table */}
      <div>
        <RecentAppointmentsTable />
      </div>
    </div>;
};
export default Dashboard;