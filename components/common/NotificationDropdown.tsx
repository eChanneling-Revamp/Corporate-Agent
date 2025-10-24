import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  X,
  Check,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Trash2,
  Archive,
  MessageSquare
} from 'lucide-react'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'appointment' | 'payment' | 'message' | 'system'
  title: string
  message: string
  timestamp: Date | string
  read: boolean
  metadata?: {
    appointmentId?: string
    patientName?: string
    doctorName?: string
    amount?: number
    link?: string
  }
}

interface NotificationDropdownProps {
  notifications: Notification[]
  onClose: () => void
  onMarkAsRead: (id: string) => void
  onClearAll: () => void
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onClearAll
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} className="text-green-500" />
      case 'error':
        return <XCircle size={18} className="text-red-500" />
      case 'warning':
        return <AlertCircle size={18} className="text-yellow-500" />
      case 'appointment':
        return <Calendar size={18} className="text-blue-500" />
      case 'payment':
        return <DollarSign size={18} className="text-green-500" />
      case 'message':
        return <MessageSquare size={18} className="text-purple-500" />
      case 'system':
        return <Bell size={18} className="text-gray-500" />
      default:
        return <Info size={18} className="text-blue-500" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (notification.metadata?.link) {
      window.location.href = notification.metadata.link
      onClose()
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <button
                onClick={onClearAll}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                title="Clear all"
              >
                <Archive size={16} />
              </button>
              <button
                onClick={() => {
                  notifications.forEach(n => {
                    if (!n.read) onMarkAsRead(n.id)
                  })
                }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                title="Mark all as read"
              >
                <Check size={16} />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">You'll see new notifications here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 pt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-gray-900`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.metadata && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        {notification.metadata.patientName && (
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {notification.metadata.patientName}
                          </span>
                        )}
                        {notification.metadata.doctorName && (
                          <span>Dr. {notification.metadata.doctorName}</span>
                        )}
                        {notification.metadata.amount && (
                          <span className="flex items-center gap-0.5">
                            <DollarSign size={12} />
                            {notification.metadata.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDistanceToNow(
                        typeof notification.timestamp === 'string' 
                          ? new Date(notification.timestamp) 
                          : notification.timestamp,
                        { addSuffix: true }
                      )}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 10 && (
        <div className="px-4 py-2 border-t border-gray-200">
          <a
            href="/notifications"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View all notifications →
          </a>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
