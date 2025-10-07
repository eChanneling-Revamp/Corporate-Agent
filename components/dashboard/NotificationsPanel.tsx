import React from 'react'
import { Bell, Calendar, AlertTriangle, Info, ChevronRight } from 'lucide-react'

const NotificationsPanel = () => {
  // Sample notifications data
  const notifications = [
    {
      id: 1,
      type: 'appointment',
      title: 'ACB Appointments Pending',
      description: '14 ACB appointments require confirmation',
      time: '10 minutes ago',
      priority: 'high'
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment Failed',
      description: 'Payment for appointment APT-10237 has failed',
      time: '25 minutes ago',
      priority: 'high'
    },
    {
      id: 3,
      type: 'system',
      title: 'System Maintenance',
      description: 'System will be down for maintenance on Oct 20, 11:00 PM - 2:00 AM',
      time: '1 hour ago',
      priority: 'medium'
    },
    {
      id: 4,
      type: 'appointment',
      title: 'Bulk Booking Complete',
      description: 'Successfully booked 8 appointments for TechCorp employees',
      time: '3 hours ago',
      priority: 'medium'
    }
  ]

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar size={16} className="text-blue-500" />
      case 'payment':
        return <AlertTriangle size={16} className="text-red-500" />
      case 'system':
        return <Info size={16} className="text-amber-500" />
      default:
        return <Bell size={16} className="text-gray-500" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          System Notifications
        </h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          {notifications.length} New
        </span>
      </div>
      
      <div className="divide-y divide-gray-200">
        {notifications.map(notification => (
          <div key={notification.id} className="p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex">
              <div className={`p-2 rounded-full mr-3 ${
                notification.priority === 'high' ? 'bg-red-50' : 'bg-amber-50'
              }`}>
                {getNotificationIcon(notification.type, notification.priority)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium text-gray-800">
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {notification.time}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.description}
                </p>
                <div className="mt-2 flex justify-between items-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    notification.priority === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {notification.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center">
                    Take Action <ChevronRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View All Notifications
        </button>
      </div>
    </div>
  )
}

export default NotificationsPanel