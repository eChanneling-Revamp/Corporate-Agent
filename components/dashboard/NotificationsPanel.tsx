import React, { useEffect, useState } from 'react'
import { Bell, Calendar, AlertTriangle, Info, ChevronRight } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  priority: string
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications || [])
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        // Fallback to empty array if API fails
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} days ago`
  }

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_CANCELLED':
      case 'SESSION_UPDATED':
        return <Calendar size={16} className="text-blue-500" />
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        return <AlertTriangle size={16} className="text-red-500" />
      case 'SYSTEM_ALERT':
      case 'DOCTOR_UNAVAILABLE':
        return <Info size={16} className="text-amber-500" />
      default:
        return <Bell size={16} className="text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">System Notifications</h2>
        </div>
        <div className="p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
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
                notification.priority === 'HIGH' || notification.priority === 'URGENT' ? 'bg-red-50' : 'bg-amber-50'
              }`}>
                {getNotificationIcon(notification.type, notification.priority)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium text-gray-800">
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(notification.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                <div className="mt-2 flex justify-between items-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    notification.priority === 'HIGH' || notification.priority === 'URGENT'
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {notification.priority === 'HIGH' || notification.priority === 'URGENT' ? 'High Priority' : 'Normal Priority'}
                  </span>
                  {notification.actionUrl && (
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center">
                      Take Action <ChevronRight size={14} className="ml-1" />
                    </button>
                  )}
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