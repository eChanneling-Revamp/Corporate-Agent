import { useEffect, useState, useCallback, useRef } from 'react'
import { 
  connectSocket, 
  disconnectSocket, 
  onSocketEvent, 
  offSocketEvent, 
  emitSocketEvent,
  socketRequest,
  isSocketConnected,
  isSocketAuthenticated,
  SocketEvents 
} from '@/lib/socketClient'

interface UseSocketOptions {
  autoConnect?: boolean
  events?: {
    [key: string]: (data: any) => void
  }
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, events = {} } = options
  const [isConnected, setIsConnected] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const eventHandlersRef = useRef<Map<string, Function>>(new Map())

  // Connection management
  useEffect(() => {
    if (autoConnect) {
      connectSocket()
    }

    const checkConnection = setInterval(() => {
      setIsConnected(isSocketConnected())
      setIsAuthenticated(isSocketAuthenticated())
    }, 1000)

    return () => {
      clearInterval(checkConnection)
      if (autoConnect) {
        // Don't disconnect on unmount to maintain persistent connection
        // disconnectSocket()
      }
    }
  }, [autoConnect])

  // Event handlers management
  useEffect(() => {
    // Clean up previous handlers
    eventHandlersRef.current.forEach((handler, event) => {
      offSocketEvent(event, handler)
    })
    eventHandlersRef.current.clear()

    // Register new handlers
    Object.entries(events).forEach(([event, handler]) => {
      onSocketEvent(event, handler)
      eventHandlersRef.current.set(event, handler)
    })

    // Cleanup
    return () => {
      eventHandlersRef.current.forEach((handler, event) => {
        offSocketEvent(event, handler)
      })
    }
  }, [events])

  // Emit event
  const emit = useCallback((event: string, data?: any, callback?: Function) => {
    emitSocketEvent(event, data, callback)
  }, [])

  // Request with response
  const request = useCallback((event: string, data?: any): Promise<any> => {
    return socketRequest(event, data)
  }, [])

  // Subscribe to event
  const on = useCallback((event: SocketEvents | string, handler: Function) => {
    onSocketEvent(event, handler)
    
    // Return cleanup function
    return () => {
      offSocketEvent(event, handler)
    }
  }, [])

  // Unsubscribe from event
  const off = useCallback((event: SocketEvents | string, handler?: Function) => {
    offSocketEvent(event, handler)
  }, [])

  return {
    isConnected,
    isAuthenticated,
    emit,
    request,
    on,
    off,
    connect: connectSocket,
    disconnect: disconnectSocket
  }
}

// Hook for specific socket events
export const useSocketEvent = (
  event: SocketEvents | string, 
  handler: (data: any) => void,
  deps: any[] = []
) => {
  const handlerRef = useRef(handler)
  
  // Update handler ref when it changes
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const eventHandler = (data: any) => {
      handlerRef.current(data)
    }

    onSocketEvent(event, eventHandler)

    return () => {
      offSocketEvent(event, eventHandler)
    }
  }, deps)
}

// Hook for appointment updates
export const useAppointmentUpdates = (appointmentId?: string) => {
  const [updates, setUpdates] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState<any>(null)

  useSocketEvent(SocketEvents.APPOINTMENT_UPDATED, (data) => {
    if (!appointmentId || data.appointmentId === appointmentId) {
      setLastUpdate(data)
      setUpdates(prev => [...prev, data])
    }
  }, [appointmentId])

  useSocketEvent(SocketEvents.APPOINTMENT_CANCELLED, (data) => {
    if (!appointmentId || data.appointmentId === appointmentId) {
      setLastUpdate({ ...data, type: 'cancelled' })
      setUpdates(prev => [...prev, { ...data, type: 'cancelled' }])
    }
  }, [appointmentId])

  useSocketEvent(SocketEvents.APPOINTMENT_CONFIRMED, (data) => {
    if (!appointmentId || data.appointmentId === appointmentId) {
      setLastUpdate({ ...data, type: 'confirmed' })
      setUpdates(prev => [...prev, { ...data, type: 'confirmed' }])
    }
  }, [appointmentId])

  return { updates, lastUpdate }
}

// Hook for real-time notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useSocketEvent(SocketEvents.NOTIFICATION_NEW, (notification) => {
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)
  })

  useSocketEvent(SocketEvents.NOTIFICATION_READ, (data) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === data.notificationId 
          ? { ...notif, read: true } 
          : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  })

  useSocketEvent(SocketEvents.NOTIFICATION_CLEAR, () => {
    setNotifications([])
    setUnreadCount(0)
  })

  const markAsRead = useCallback((notificationId: string) => {
    emitSocketEvent(SocketEvents.NOTIFICATION_READ, { notificationId })
  }, [])

  const clearAll = useCallback(() => {
    emitSocketEvent(SocketEvents.NOTIFICATION_CLEAR)
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll
  }
}

// Hook for queue updates
export const useQueueUpdates = (queueId?: string) => {
  const [queueData, setQueueData] = useState<any>(null)
  const [position, setPosition] = useState<number | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)

  useSocketEvent(SocketEvents.QUEUE_UPDATE, (data) => {
    if (!queueId || data.queueId === queueId) {
      setQueueData(data)
      setPosition(data.position)
      setEstimatedTime(data.estimatedTime)
    }
  }, [queueId])

  return { queueData, position, estimatedTime }
}

// Hook for real-time stats
export const useRealtimeStats = () => {
  const [stats, setStats] = useState<any>(null)

  useSocketEvent(SocketEvents.STATS_UPDATE, (data) => {
    setStats(data)
  })

  return stats
}

// Hook for agent status
export const useAgentStatus = (agentId?: string) => {
  const [status, setStatus] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(false)

  useSocketEvent(SocketEvents.AGENT_STATUS_CHANGED, (data) => {
    if (!agentId || data.agentId === agentId) {
      setStatus(data.status)
      setIsOnline(data.status === 'ACTIVE')
    }
  }, [agentId])

  const updateStatus = useCallback((newStatus: string) => {
    emitSocketEvent('agent:update_status', { status: newStatus })
  }, [])

  return { status, isOnline, updateStatus }
}

// Hook for doctor availability
export const useDoctorAvailability = (doctorId?: string) => {
  const [availability, setAvailability] = useState<any>(null)
  const [isAvailable, setIsAvailable] = useState(false)

  useSocketEvent(SocketEvents.DOCTOR_AVAILABILITY_CHANGED, (data) => {
    if (!doctorId || data.doctorId === doctorId) {
      setAvailability(data)
      setIsAvailable(data.isAvailable)
    }
  }, [doctorId])

  return { availability, isAvailable }
}

// Hook for timeslot updates
export const useTimeslotUpdates = (doctorId?: string, date?: string) => {
  const [timeslots, setTimeslots] = useState<any[]>([])
  const [updatedSlots, setUpdatedSlots] = useState<Set<string>>(new Set())

  useSocketEvent(SocketEvents.TIMESLOT_BOOKED, (data) => {
    if ((!doctorId || data.doctorId === doctorId) && (!date || data.date === date)) {
      setTimeslots(prev => 
        prev.map(slot => 
          slot.id === data.slotId 
            ? { ...slot, isBooked: true } 
            : slot
        )
      )
      setUpdatedSlots(prev => new Set(prev).add(data.slotId))
    }
  }, [doctorId, date])

  useSocketEvent(SocketEvents.TIMESLOT_RELEASED, (data) => {
    if ((!doctorId || data.doctorId === doctorId) && (!date || data.date === date)) {
      setTimeslots(prev => 
        prev.map(slot => 
          slot.id === data.slotId 
            ? { ...slot, isBooked: false } 
            : slot
        )
      )
      setUpdatedSlots(prev => new Set(prev).add(data.slotId))
    }
  }, [doctorId, date])

  return { timeslots, updatedSlots, setTimeslots }
}
