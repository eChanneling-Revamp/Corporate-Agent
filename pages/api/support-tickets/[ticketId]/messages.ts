import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { ticketMessageCreateSchema } from '../../../../lib/validationSchemas'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ticketId } = req.query
  
  if (!ticketId || typeof ticketId !== 'string') {
    return res.status(400).json({ error: 'Invalid ticket ID' })
  }
  
  try {
    switch (req.method) {
      case 'GET':
        return await getTicketMessages(ticketId, req, res)
      case 'POST':
        return await createTicketMessage(ticketId, req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Ticket Messages API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getTicketMessages(ticketId: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check if ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, title: true, status: true }
    })
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }
    
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const skip = (page - 1) * limit
    
    // Get messages with pagination
    const [messages, total] = await Promise.all([
      prisma.ticketMessage.findMany({
        where: { 
          ticketId: ticketId,
          isInternal: req.query.includeInternal === 'true' ? undefined : false
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit
      }),
      prisma.ticketMessage.count({ 
        where: { 
          ticketId: ticketId,
          isInternal: req.query.includeInternal === 'true' ? undefined : false
        }
      })
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1
    
    return res.status(200).json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      ticket: {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status
      }
    })
  } catch (error) {
    throw error
  }
}

async function createTicketMessage(ticketId: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate request body
    const data = ticketMessageCreateSchema.parse({ ...req.body, ticketId })
    
    // Check if ticket exists and is not closed
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { 
        id: true, 
        status: true, 
        customerId: true,
        assignedAgentId: true 
      }
    })
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }
    
    if (ticket.status === 'CLOSED') {
      return res.status(400).json({ error: 'Cannot add messages to closed tickets' })
    }
    
    // Create message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: data.ticketId,
        senderId: req.body.senderId || null,
        senderName: data.senderName,
        senderType: data.senderType,
        message: data.message,
        attachments: data.attachments || [],
        isInternal: data.isInternal
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    // Update ticket's last activity and status if needed
    const updateData: any = { updatedAt: new Date() }
    
    // Auto-update status based on sender type
    if (data.senderType === 'CUSTOMER' && ticket.status === 'WAITING_CUSTOMER') {
      updateData.status = 'IN_PROGRESS'
    } else if (data.senderType === 'AGENT' && ticket.status === 'OPEN') {
      updateData.status = 'IN_PROGRESS'
    } else if (data.senderType === 'AGENT' && ticket.status === 'IN_PROGRESS') {
      updateData.status = 'WAITING_CUSTOMER'
    }
    
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData
    })
    
    return res.status(201).json({
      message: 'Ticket message created successfully',
      ticketMessage: message
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    throw error
  }
}