import React, { useState, useEffect, useRef } from 'react'
import { 
  Bell, 
  X, 
  Check, 
  Calendar, 
  User, 
  AlertCircle,
  Info,
  Clock,
  ChevronRight,
  Trash2,
  CheckCheck
} from 'lucide-react'
import { useNotifications, useSocket } from '../../hooks/useSocket'
import { format, formatDistanceToNow } from 'date-fns'
import { showToast } from './ToastProvider'

interface Notification {
  id: string
  type: 'appointment' | 'doctor' | 'system' | 'alert' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any
  actionUrl?: string
  priority?: 'low' | 'medium' | 'high'
}

const RealtimeNotifications: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications()
  const { isConnected } = useSocket()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Play notification sound for high priority notifications
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3')
      audio.volume = 0.5
      audio.play()
    } catch (error) {
      console.error('Error playing notification sound:', error)
    }
  }

  // Handle new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0]
      
      // Show toast for new notifications
      if (!latestNotification.read) {
        showToast.info(latestNotification.title)
        
        // Play sound for high priority notifications
        if (latestNotification.priority === 'high') {
          playNotificationSound()
        }
      }
    }
  }, [notifications])

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-5 w-5" />
      case 'doctor':
        return <User className="h-5 w-5" />
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'system':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  // Get notification color based on priority
  const getNotificationColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') {
      return !notif.read
    }
    return true
  })

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
    
    setIsOpen(false)
  }

  // Mark all as read
  const markAllAsRead = () => {
    notifications
      .filter(n => !n.read)
      .forEach(n => markAsRead(n.id))
    
    showToast.success('All notifications marked as read')
  }

  // Clear all notifications
  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      clearAll()
      showToast.success('All notifications cleared')
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Connection Status Indicator */}
        <span 
          className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div className="mt-3 flex space-x-1">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-3 py-1 text-sm font-medium rounded-md ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 px-3 py-1 text-sm font-medium rounded-md ${
                  filter === 'unread'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  {filter === 'unread' 
                    ? 'No unread notifications' 
                    : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    } ${getNotificationColor(notification.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-gray-900 ${
                          !notification.read ? 'font-semibold' : ''
                        }`}>
                          {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true
                          })}
                        </div>
                      </div>
                      
                      {notification.actionUrl && (
                        <ChevronRight className="flex-shrink-0 h-4 w-4 text-gray-400" />
                      )}
                      
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="mr-1 h-4 w-4" />
                  Mark all as read
                </button>
                
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RealtimeNotifications

// Notification Item Component for external use
export const NotificationItem: React.FC<{
  notification: Notification
  onRead?: (id: string) => void
  onClick?: (notification: Notification) => void
}> = ({ notification, onRead, onClick }) => {
  const handleClick = () => {
    if (!notification.read && onRead) {
      onRead(notification.id)
    }
    if (onClick) {
      onClick(notification)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        !notification.read 
          ? 'border-blue-200 bg-blue-50' 
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {notification.type === 'appointment' && <Calendar className="h-5 w-5 text-blue-500" />}
          {notification.type === 'alert' && <AlertCircle className="h-5 w-5 text-red-500" />}
          {notification.type === 'info' && <Info className="h-5 w-5 text-gray-500" />}
        </div>
        
        <div className="flex-1">
          <h4 className={`text-sm font-medium text-gray-900 ${
            !notification.read ? 'font-semibold' : ''
          }`}>
            {notification.title}
          </h4>
          <p className="mt-1 text-sm text-gray-600">
            {notification.message}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {format(new Date(notification.timestamp), 'PPp')}
          </p>
        </div>
        
        {!notification.read && (
          <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
        )}
      </div>
    </div>
  )
}
