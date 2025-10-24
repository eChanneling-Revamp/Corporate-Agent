import { io, Socket } from 'socket.io-client'
import Cookies from 'js-cookie'
import { showToast } from '@/components/common/ToastProvider'

// Socket instance
let socket: Socket | null = null

// Connection configuration
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'wss://api.yourdomain.com' 
    : 'ws://localhost:3001')

// Socket events enum
export enum SocketEvents {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  RECONNECT = 'reconnect',
  RECONNECT_ERROR = 'reconnect_error',
  RECONNECT_ATTEMPT = 'reconnect_attempt',
  
  // Authentication events
  AUTHENTICATE = 'authenticate',
  AUTHENTICATION_ERROR = 'authentication_error',
  UNAUTHORIZED = 'unauthorized',
  
  // Appointment events
  APPOINTMENT_CREATED = 'appointment:created',
  APPOINTMENT_UPDATED = 'appointment:updated',
  APPOINTMENT_CANCELLED = 'appointment:cancelled',
  APPOINTMENT_CONFIRMED = 'appointment:confirmed',
  APPOINTMENT_REMINDER = 'appointment:reminder',
  
  // Doctor events
  DOCTOR_AVAILABILITY_CHANGED = 'doctor:availability_changed',
  DOCTOR_SCHEDULE_UPDATED = 'doctor:schedule_updated',
  
  // Time slot events
  TIMESLOT_BOOKED = 'timeslot:booked',
  TIMESLOT_RELEASED = 'timeslot:released',
  TIMESLOT_UPDATED = 'timeslot:updated',
  
  // Notification events
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_CLEAR = 'notification:clear',
  
  // Agent events
  AGENT_STATUS_CHANGED = 'agent:status_changed',
  AGENT_ASSIGNED = 'agent:assigned',
  AGENT_MESSAGE = 'agent:message',
  
  // System events
  SYSTEM_ALERT = 'system:alert',
  SYSTEM_MAINTENANCE = 'system:maintenance',
  
  // Real-time updates
  QUEUE_UPDATE = 'queue:update',
  STATS_UPDATE = 'stats:update',
  BOOKING_PROGRESS = 'booking:progress',
}

// Event handlers type
export type SocketEventHandlers = {
  [key in SocketEvents]?: (data: any) => void
}

// Socket client class
class SocketClient {
  private socket: Socket | null = null
  private eventHandlers: Map<string, Set<Function>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private isAuthenticated = false

  constructor() {
    // Check for window object (client-side only)
    if (typeof window !== 'undefined') {
      this.setupConnectionMonitoring()
    }
  }

  // Initialize socket connection
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    const token = Cookies.get('authToken')
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token
      },
      reconnection: true,
      reconnectionAttempts: 3, // Reduce from 5 to 3 attempts
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 10000, // Reduce timeout from 20s to 10s
    })

    this.setupDefaultEventHandlers()
    
    return this.socket
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isAuthenticated = false
    }
  }

  // Setup default event handlers
  private setupDefaultEventHandlers(): void {
    if (!this.socket) return

    // Connection events
    this.socket.on(SocketEvents.CONNECT, () => {
      console.log('Socket connected:', this.socket?.id)
      this.reconnectAttempts = 0
      this.authenticate()
    })

    this.socket.on(SocketEvents.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason)
      this.isAuthenticated = false
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        setTimeout(() => this.connect(), 1000)
      }
    })

    this.socket.on(SocketEvents.CONNECT_ERROR, (error) => {
      console.log('Socket connection error:', error.message || error)
      
      // Only show error after multiple failed attempts
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('Socket server unavailable. Real-time features disabled.')
        // Don't show toast - socket server is optional
      }
    })

    this.socket.on(SocketEvents.RECONNECT_ATTEMPT, (attemptNumber) => {
      this.reconnectAttempts = attemptNumber
      console.log(`Reconnection attempt ${attemptNumber}`)
    })

    this.socket.on(SocketEvents.RECONNECT, (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`)
      showToast.success('Connection restored')
      this.reconnectAttempts = 0
    })

    // Authentication events
    this.socket.on(SocketEvents.AUTHENTICATE, (data) => {
      console.log('Socket authenticated:', data)
      this.isAuthenticated = true
    })

    this.socket.on(SocketEvents.AUTHENTICATION_ERROR, (error) => {
      console.error('Socket authentication error:', error)
      this.isAuthenticated = false
      showToast.error('Authentication failed. Please login again.')
      
      // Redirect to login if authentication fails
      setTimeout(() => {
        window.location.href = '/auth/login'
      }, 2000)
    })

    this.socket.on(SocketEvents.UNAUTHORIZED, () => {
      console.error('Socket unauthorized')
      this.isAuthenticated = false
      this.disconnect()
    })
  }

  // Authenticate socket connection
  private authenticate(): void {
    const token = Cookies.get('authToken')
    
    if (token && this.socket) {
      this.socket.emit(SocketEvents.AUTHENTICATE, { token })
    }
  }

  // Setup connection monitoring
  private setupConnectionMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      showToast.online()
      if (!this.socket?.connected) {
        this.connect()
      }
    })

    window.addEventListener('offline', () => {
      showToast.offline()
    })

    // Monitor visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.socket?.connected) {
        this.connect()
      }
    })
  }

  // Subscribe to an event
  on(event: SocketEvents | string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    
    this.eventHandlers.get(event)?.add(handler)
    
    if (this.socket) {
      this.socket.on(event, handler as any)
    }
  }

  // Unsubscribe from an event
  off(event: SocketEvents | string, handler?: Function): void {
    if (handler) {
      this.eventHandlers.get(event)?.delete(handler)
      
      if (this.socket) {
        this.socket.off(event, handler as any)
      }
    } else {
      this.eventHandlers.delete(event)
      
      if (this.socket) {
        this.socket.off(event)
      }
    }
  }

  // Emit an event
  emit(event: string, data?: any, callback?: Function): void {
    if (this.socket?.connected) {
      if (callback) {
        this.socket.emit(event, data, callback)
      } else {
        this.socket.emit(event, data)
      }
    } else {
      console.warn(`Cannot emit ${event}: Socket not connected`)
    }
  }

  // Send a message and wait for response
  request(event: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout for event: ${event}`))
      }, 10000) // 10 second timeout

      this.socket.emit(event, data, (response: any) => {
        clearTimeout(timeout)
        
        if (response.error) {
          reject(response.error)
        } else {
          resolve(response)
        }
      })
    })
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Get authentication status
  isAuth(): boolean {
    return this.isAuthenticated
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id
  }

  // Re-register all event handlers (useful after reconnection)
  private reregisterHandlers(): void {
    if (!this.socket) return

    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach(handler => {
        this.socket?.on(event, handler as any)
      })
    })
  }
}

// Create singleton instance
const socketClient = new SocketClient()

// Export functions for easy usage
export const connectSocket = () => socketClient.connect()
export const disconnectSocket = () => socketClient.disconnect()
export const onSocketEvent = (event: SocketEvents | string, handler: Function) => socketClient.on(event, handler)
export const offSocketEvent = (event: SocketEvents | string, handler?: Function) => socketClient.off(event, handler)
export const emitSocketEvent = (event: string, data?: any, callback?: Function) => socketClient.emit(event, data, callback)
export const socketRequest = (event: string, data?: any) => socketClient.request(event, data)
export const isSocketConnected = () => socketClient.isConnected()
export const isSocketAuthenticated = () => socketClient.isAuth()
export const getSocketId = () => socketClient.getSocketId()

export default socketClient
