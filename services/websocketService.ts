import { io, Socket } from 'socket.io-client'
import Cookies from 'js-cookie'

class WebSocketService {
  private socket: Socket | null = null
  private url: string
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5

  constructor() {
    this.url = 'http://localhost:5000'
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.socket) {
        resolve()
        return
      }

      const token = Cookies.get('authToken')
      if (!token) {
        reject(new Error('No authentication token available'))
        return
      }

      this.socket = io(this.url, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      })

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server')
        this.isConnected = true
        this.reconnectAttempts = 0
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        this.isConnected = false
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          setTimeout(() => {
            this.connect()
          }, 2000 * this.reconnectAttempts)
        } else {
          reject(error)
        }
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason)
        this.isConnected = false
        
        // Auto-reconnect unless disconnected by client
        if (reason === 'io server disconnect') {
          this.connect()
        }
      })

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error)
      })

      // Handle authentication errors
      this.socket.on('connect_error', (error) => {
        if (error.message === 'Authentication error' || 
            error.message === 'Authentication failed') {
          // Token might be expired, try to refresh
          this.handleAuthError()
        }
      })
    })
  }

  private async handleAuthError() {
    try {
      // Try to refresh the token
      const refreshToken = Cookies.get('refreshToken')
      if (refreshToken) {
        // You would call your refresh token API here
        // For now, redirect to login
        window.location.href = '/auth/login'
      }
    } catch (error) {
      window.location.href = '/auth/login'
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.socket !== null
  }

  // Appointment-related methods
  public updateAppointment(appointmentId: string, status: string, notes?: string): void {
    if (this.socket) {
      this.socket.emit('appointment:update', { appointmentId, status, notes })
    }
  }

  public onAppointmentUpdated(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('appointment:updated', callback)
    }
  }

  public onAppointmentStatusChanged(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('appointment:status_changed', callback)
    }
  }

  // Notification methods
  public markNotificationAsRead(notificationId: string): void {
    if (this.socket) {
      this.socket.emit('notification:mark_read', notificationId)
    }
  }

  public onNotificationMarkedRead(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('notification:marked_read', callback)
    }
  }

  // Dashboard methods
  public subscribeToDashboard(): void {
    if (this.socket) {
      this.socket.emit('dashboard:subscribe')
    }
  }

  public unsubscribeFromDashboard(): void {
    if (this.socket) {
      this.socket.emit('dashboard:unsubscribe')
    }
  }

  public onDashboardUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('dashboard:update', callback)
    }
  }

  // Error handling
  public onError(callback: (error: any) => void): void {
    if (this.socket) {
      this.socket.on('error', callback)
    }
  }

  // General event listeners
  public on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  public off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback)
      } else {
        this.socket.off(event)
      }
    }
  }

  public emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data)
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService()
export default webSocketService