import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'

export interface SocketWithUser extends SocketIOServer {
  userId?: string
  userRole?: string
}

// Extend NextApiResponse to include socket
export interface NextApiResponseWithSocket extends NextApiResponse {
  socket: {
    server: HTTPServer & {
      io?: SocketIOServer
    }
  }
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('Socket.IO already initialized')
    res.end()
    return
  }

  console.log('Initializing Socket.IO server...')

  const io = new SocketIOServer(res.socket.server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]
      
      if (!token) {
        return next(new Error('No token provided'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true, isActive: true }
      })

      if (!user || !user.isActive) {
        return next(new Error('Invalid user or inactive account'))
      }

      ;(socket as any).userId = user.id
      ;(socket as any).userRole = user.role
      ;(socket as any).userEmail = user.email

      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    const userId = (socket as any).userId
    const userRole = (socket as any).userRole
    
    console.log(`User ${userId} (${userRole}) connected via Socket.IO`)

    // Join user-specific room
    socket.join(`user:${userId}`)

    // Join role-specific room
    socket.join(`role:${userRole}`)

    // Join global notifications room
    socket.join('notifications')

    // Handle joining specific rooms
    socket.on('join_room', (room: string) => {
      if (isValidRoom(room, userRole)) {
        socket.join(room)
        socket.emit('room_joined', { room })
      } else {
        socket.emit('error', { message: 'Unauthorized to join this room' })
      }
    })

    // Handle leaving rooms
    socket.on('leave_room', (room: string) => {
      socket.leave(room)
      socket.emit('room_left', { room })
    })

    // Handle appointment status updates
    socket.on('appointment_update', async (data: { appointmentId: string, status: string, notes?: string }) => {
      try {
        // Verify user has permission to update this appointment
        const appointment = await prisma.appointment.findUnique({
          where: { id: data.appointmentId },
          include: { 
            doctor: { select: { name: true } },
            bookedBy: { select: { id: true } }
          }
        })

        if (!appointment) {
          socket.emit('error', { message: 'Appointment not found' })
          return
        }

        // Check permissions
        if (userRole !== 'ADMIN' && appointment.bookedBy?.id !== userId) {
          socket.emit('error', { message: 'Unauthorized to update this appointment' })
          return
        }

        // Update appointment
        const updatedAppointment = await prisma.appointment.update({
          where: { id: data.appointmentId },
          data: { 
            status: data.status as any,
            notes: data.notes 
          },
          include: {
            doctor: { select: { name: true, specialization: true } },
            hospital: { select: { name: true } }
          }
        })

        // Broadcast to relevant users
        io.to(`user:${appointment.bookedBy?.id}`).emit('appointment_updated', {
          appointment: updatedAppointment,
          updatedBy: userId
        })

        // Broadcast to admin/supervisor rooms
        io.to('role:ADMIN').to('role:SUPERVISOR').emit('appointment_status_changed', {
          appointmentId: data.appointmentId,
          oldStatus: appointment.status,
          newStatus: data.status,
          updatedBy: userId
        })

        socket.emit('update_success', { appointmentId: data.appointmentId })

      } catch (error) {
        console.error('Error updating appointment:', error)
        socket.emit('error', { message: 'Failed to update appointment' })
      }
    })

    // Handle real-time chat/communication
    socket.on('send_message', async (data: { to: string, message: string, type: 'patient' | 'doctor' | 'admin' }) => {
      try {
        // Save message to database (you'd need a messages table)
        // const message = await prisma.message.create({ ... })

        // Emit to recipient
        io.to(`user:${data.to}`).emit('new_message', {
          from: userId,
          message: data.message,
          type: data.type,
          timestamp: new Date().toISOString()
        })

        socket.emit('message_sent', { success: true })

      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle real-time notifications
    socket.on('mark_notification_read', async (notificationId: string) => {
      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true, readAt: new Date() }
        })

        socket.emit('notification_marked_read', { notificationId })

      } catch (error) {
        socket.emit('error', { message: 'Failed to mark notification as read' })
      }
    })

    // Handle dashboard data requests
    socket.on('subscribe_dashboard', () => {
      socket.join('dashboard_updates')
      socket.emit('dashboard_subscribed')
    })

    socket.on('unsubscribe_dashboard', () => {
      socket.leave('dashboard_updates')
      socket.emit('dashboard_unsubscribed')
    })

    // Handle typing indicators
    socket.on('typing_start', (data: { room: string }) => {
      socket.to(data.room).emit('user_typing', { userId, userEmail: (socket as any).userEmail })
    })

    socket.on('typing_stop', (data: { room: string }) => {
      socket.to(data.room).emit('user_stopped_typing', { userId })
    })

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User ${userId} disconnected: ${reason}`)
    })
  })

  // Store io instance
  res.socket.server.io = io

  console.log('Socket.IO server initialized successfully')
  res.end()
}

// Helper function to validate room access
function isValidRoom(room: string, userRole: string): boolean {
  // Allow access based on room naming convention and user role
  if (room.startsWith('user:') || room.startsWith('appointment:')) {
    return true
  }
  
  if (room.startsWith('admin:') && ['ADMIN', 'SUPERVISOR'].includes(userRole)) {
    return true
  }
  
  if (room === 'notifications' || room === 'dashboard_updates') {
    return true
  }
  
  return false
}

export default SocketHandler

// Export helper functions for use in other API routes
export const emitToUser = (io: SocketIOServer, userId: string, event: string, data: any) => {
  io.to(`user:${userId}`).emit(event, data)
}

export const emitToRole = (io: SocketIOServer, role: string, event: string, data: any) => {
  io.to(`role:${role}`).emit(event, data)
}

export const emitToAll = (io: SocketIOServer, event: string, data: any) => {
  io.emit(event, data)
}

export const broadcastDashboardUpdate = (io: SocketIOServer, data: any) => {
  io.to('dashboard_updates').emit('dashboard_update', data)
}