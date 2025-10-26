import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { supportTicketUpdateSchema } from '../../../lib/validationSchemas'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ticketId } = req.query
  
  if (!ticketId || typeof ticketId !== 'string') {
    return res.status(400).json({ error: 'Invalid ticket ID' })
  }
  
  try {
    switch (req.method) {
      case 'GET':
        return await getSupportTicket(ticketId, res)
      case 'PUT':
        return await updateSupportTicket(ticketId, req, res)
      case 'DELETE':
        return await deleteSupportTicket(ticketId, res)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Support Ticket API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getSupportTicket(ticketId: string, res: NextApiResponse) {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true
          }
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })
    
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' })
    }
    
    // Calculate additional metrics
    const isOverdue = ticket.estimatedResolutionAt && new Date() > new Date(ticket.estimatedResolutionAt)
    const responseTime = ticket.messages.length > 1 
      ? new Date(ticket.messages[1].createdAt).getTime() - new Date(ticket.createdAt).getTime()
      : null
    
    return res.status(200).json({
      ...ticket,
      isOverdue,
      responseTime: responseTime ? Math.round(responseTime / (1000 * 60)) : null, // in minutes
      totalMessages: ticket.messages.length
    })
  } catch (error) {
    throw error
  }
}

async function updateSupportTicket(ticketId: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate request body
    const data = supportTicketUpdateSchema.parse({ ...req.body, id: ticketId })
    
    // Check if ticket exists
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    })
    
    if (!existingTicket) {
      return res.status(404).json({ error: 'Support ticket not found' })
    }
    
    // Prepare update data
    const updateData: any = { ...data }
    delete updateData.id
    
    // Handle date fields
    if (data.estimatedResolutionAt) {
      updateData.estimatedResolutionAt = new Date(data.estimatedResolutionAt)
    }
    
    // Set resolution/close timestamps based on status
    if (data.status === 'RESOLVED' && existingTicket.status !== 'RESOLVED') {
      updateData.actualResolutionAt = new Date()
    }
    
    if (data.status === 'CLOSED' && existingTicket.status !== 'CLOSED') {
      updateData.closedAt = new Date()
      if (!existingTicket.actualResolutionAt) {
        updateData.actualResolutionAt = new Date()
      }
    }
    
    // Update ticket
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    // Create system message for status changes
    if (data.status && data.status !== existingTicket.status) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticketId,
          senderName: 'System',
          senderType: 'SYSTEM',
          message: `Ticket status changed from ${existingTicket.status} to ${data.status}`,
          isInternal: false
        }
      })
    }
    
    // Create system message for assignment changes
    if (data.assignedAgentId !== undefined && data.assignedAgentId !== existingTicket.assignedAgentId) {
      const agentName = ticket.assignedAgent?.name || 'Unassigned'
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticketId,
          senderName: 'System',
          senderType: 'SYSTEM',
          message: `Ticket assigned to ${agentName}`,
          isInternal: false
        }
      })
    }
    
    return res.status(200).json({
      message: 'Support ticket updated successfully',
      ticket
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    throw error
  }
}

async function deleteSupportTicket(ticketId: string, res: NextApiResponse) {
  try {
    // Check if ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      }
    })
    
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' })
    }
    
    // Check if ticket can be deleted (only if status is CANCELLED or no messages)
    const canDelete = ticket.status === 'CANCELLED' || ticket._count.messages <= 1
    
    if (!canDelete) {
      return res.status(400).json({ 
        error: 'Cannot delete ticket with messages. Please cancel the ticket instead.',
        suggestion: 'Use status update to CANCELLED'
      })
    }
    
    // Delete all related messages first
    await prisma.ticketMessage.deleteMany({
      where: { ticketId: ticketId }
    })
    
    // Delete the ticket
    await prisma.supportTicket.delete({
      where: { id: ticketId }
    })
    
    return res.status(200).json({
      message: 'Support ticket deleted successfully'
    })
  } catch (error) {
    throw error
  }
}