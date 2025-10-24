import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bell,
  BellOff,
  X,
  Check,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Trash2,
  Archive,
  Settings,
  Volume2,
  VolumeX,
  Filter,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'appointment' | 'task' | 'message' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'critical' | 'high' | 'medium' | 'low'
  actionRequired: boolean
  source: string
  metadata?: {
    appointmentId?: string
    taskId?: string
    customerId?: string
    customerName?: string
    doctorName?: string
    amount?: number
    link?: string
  }
  actions?: Array<{
    label: string
    action: string
    style?: 'primary' | 'secondary' | 'danger'
  }>
}

interface RealTimeNotificationsProps {
  userId: string
  userRole: 'agent' | 'supervisor' | 'admin'
  wsUrl?: string
  onNotificationAction?: (notificationId: string, action: string) => void
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  userId,
  userRole,
  wsUrl = 'ws://localhost:3000',
  onNotificationAction
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [autoMarkRead, setAutoMarkRead] = useState(true)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3')
    audioRef.current.volume = 0.5
  }, [])

  // Mock initial notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: 'NOT001',
        type: 'appointment',
        title: 'New Appointment Booking',
        message: 'John Silva booked an appointment with Dr. Sarah Johnson for tomorrow at 10:00 AM',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'high',
        actionRequired: false,
        source: 'Booking System',
        metadata: {
          appointmentId: 'APT-2024-001',
          customerId: 'CUST001',
          customerName: 'John Silva',
          doctorName: 'Dr. Sarah Johnson'
        },
        actions: [
          { label: 'View Details', action: 'view', style: 'primary' },
          { label: 'Send Confirmation', action: 'confirm', style: 'secondary' }
        ]
      },
      {
        id: 'NOT002',
        type: 'warning',
        title: 'Payment Pending',
        message: 'Payment for appointment APT-2024-002 is pending for more than 24 hours',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        priority: 'critical',
        actionRequired: true,
        source: 'Payment System',
        metadata: {
          appointmentId: 'APT-2024-002',
          amount: 3500,
          customerId: 'CUST002',
          customerName: 'Mary Fernando'
        },
        actions: [
          { label: 'Process Payment', action: 'process', style: 'primary' },
          { label: 'Contact Customer', action: 'contact', style: 'secondary' }
        ]
      },
      {
        id: 'NOT003',
        type: 'task',
        title: 'Task Overdue',
        message: 'Follow-up task for customer complaint is overdue by 2 hours',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        priority: 'high',
        actionRequired: true,
        source: 'Task Manager',
        metadata: {
          taskId: 'TSK-2024-045',
          customerId: 'CUST003',
          customerName: 'David Perera'
        },
        actions: [
          { label: 'Complete Task', action: 'complete', style: 'primary' },
          { label: 'Reschedule', action: 'reschedule', style: 'secondary' }
        ]
      },
      {
        id: 'NOT004',
        type: 'success',
        title: 'Appointment Confirmed',
        message: 'Appointment APT-2024-003 has been successfully confirmed',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: true,
        priority: 'low',
        actionRequired: false,
        source: 'Booking System',
        metadata: {
          appointmentId: 'APT-2024-003'
        }
      },
      {
        id: 'NOT005',
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from Lisa Jayawardena regarding appointment rescheduling',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        read: false,
        priority: 'medium',
        actionRequired: true,
        source: 'Messaging System',
        metadata: {
          customerId: 'CUST004',
          customerName: 'Lisa Jayawardena'
        },
        actions: [
          { label: 'Reply', action: 'reply', style: 'primary' },
          { label: 'Mark as Read', action: 'markread', style: 'secondary' }
        ]
      }
    ]

    setNotifications(mockNotifications)
    updateUnreadCount(mockNotifications)
  }, [])

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionStatus('connecting')
    
    // Simulate WebSocket connection
    setTimeout(() => {
      setConnectionStatus('connected')
      toast.success('Real-time notifications connected')
      
      // Simulate receiving new notifications
      const interval = setInterval(() => {
        const randomNotification = generateRandomNotification()
        handleNewNotification(randomNotification)
      }, 30000) // New notification every 30 seconds

      return () => clearInterval(interval)
    }, 1000)

    // In production, use actual WebSocket:
    /*
    wsRef.current = new WebSocket(wsUrl)
    
    wsRef.current.onopen = () => {
      setConnectionStatus('connected')
      console.log('WebSocket connected')
    }
    
    wsRef.current.onmessage = (event) => {
      const notification = JSON.parse(event.data)
      handleNewNotification(notification)
    }
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('disconnected')
    }
    
    wsRef.current.onclose = () => {
      setConnectionStatus('disconnected')
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, 5000)
    }
    */
  }, [wsUrl])

  useEffect(() => {
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connectWebSocket])

  const generateRandomNotification = (): Notification => {
    const types = ['appointment', 'task', 'message', 'warning', 'success', 'info']
    const type = types[Math.floor(Math.random() * types.length)] as Notification['type']
    
    return {
      id: `NOT${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message: `This is a simulated real-time notification for ${type}`,
      timestamp: new Date(),
      read: false,
      priority: Math.random() > 0.5 ? 'high' : 'medium',
      actionRequired: Math.random() > 0.5,
      source: 'System',
      actions: Math.random() > 0.5 ? [
        { label: 'Action', action: 'action', style: 'primary' }
      ] : undefined
    }
  }

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev])
    updateUnreadCount([notification, ...notifications])
    
    // Play sound if enabled
    if (soundEnabled && !notification.read && audioRef.current) {
      audioRef.current.play().catch(e => console.error('Failed to play sound:', e))
    }
    
    // Show toast for critical notifications
    if (notification.priority === 'critical') {
      toast.error(notification.title, { duration: 5000 })
    } else if (notification.priority === 'high') {
      toast(notification.title, { icon: '🔔', duration: 4000 })
    }
  }

  const updateUnreadCount = (notifs: Notification[]) => {
    const unread = notifs.filter(n => !n.read).length
    setUnreadCount(unread)
    
    // Update browser tab title
    if (unread > 0) {
      document.title = `(${unread}) eChanneling Agent Dashboard`
    } else {
      document.title = 'eChanneling Agent Dashboard'
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
      updateUnreadCount(updated)
      return updated
    })
  }

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      updateUnreadCount(updated)
      return updated
    })
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId)
      updateUnreadCount(updated)
      return updated
    })
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const handleAction = (notification: Notification, action: string) => {
    if (onNotificationAction) {
      onNotificationAction(notification.id, action)
    }
    
    // Mark as read after action
    markAsRead(notification.id)
    
    // Close detail view
    setSelectedNotification(null)
    
    toast.success(`Action "${action}" performed`)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="h-5 w-5" />
      case 'task': return <CheckCircle className="h-5 w-5" />
      case 'message': return <MessageSquare className="h-5 w-5" />
      case 'warning': return <AlertCircle className="h-5 w-5" />
      case 'error': return <XCircle className="h-5 w-5" />
      case 'success': return <CheckCircle className="h-5 w-5" />
      default: return <Info className="h-5 w-5" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'bg-blue-100 text-blue-600'
      case 'task': return 'bg-purple-100 text-purple-600'
      case 'message': return 'bg-green-100 text-green-600'
      case 'warning': return 'bg-yellow-100 text-yellow-600'
      case 'error': return 'bg-red-100 text-red-600'
      case 'success': return 'bg-green-100 text-green-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.type === filter)

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Connection Status Indicator */}
        <div className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
          'bg-red-500'
        }`} />
      </div>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="fixed right-4 top-16 w-96 max-h-[80vh] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setAutoMarkRead(!autoMarkRead)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title={autoMarkRead ? 'Disable auto-read' : 'Enable auto-read'}
              >
                {autoMarkRead ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Connection Status Bar */}
          {connectionStatus !== 'connected' && (
            <div className={`px-4 py-2 text-sm flex items-center justify-between ${
              connectionStatus === 'connecting' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connecting' ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Connecting to real-time updates...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span>Connection lost. Retrying...</span>
                  </>
                )}
              </div>
              <button
                onClick={connectWebSocket}
                className="text-xs underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 p-2 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                filter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                filter === 'unread' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('appointment')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                filter === 'appointment' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Appointments
            </button>
            <button
              onClick={() => setFilter('task')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                filter === 'task' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setFilter('message')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                filter === 'message' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Messages
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (autoMarkRead) markAsRead(notification.id)
                      setSelectedNotification(notification)
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        getNotificationColor(notification.type)
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </span>
                              {notification.priority === 'critical' && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                  Critical
                                </span>
                              )}
                              {notification.actionRequired && (
                                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                                  Action Required
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <X className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                        
                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex items-center space-x-2 mt-3">
                            {notification.actions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAction(notification, action.action)
                                }}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                  action.style === 'primary'
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : action.style === 'danger'
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default RealTimeNotifications
