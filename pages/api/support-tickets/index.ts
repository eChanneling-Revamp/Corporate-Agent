import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { supportTicketCreateSchema, supportTicketSearchSchema } from '../../../lib/validationSchemas'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getSupportTickets(req, res)
      case 'POST':
        return await createSupportTicket(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Support Tickets API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getSupportTickets(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate query parameters
    const query = supportTicketSearchSchema.parse(req.query)
    
    // Build where clause
    const where: any = {}
    
    if (query.search) {
      where.OR = [
        { ticketNumber: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { customerEmail: { contains: query.search, mode: 'insensitive' } }
      ]
    }
    
    if (query.status) {
      where.status = query.status
    }
    
    if (query.priority) {
      where.priority = query.priority
    }
    
    if (query.category) {
      where.category = query.category
    }
    
    if (query.assignedAgentId) {
      where.assignedAgentId = query.assignedAgentId
    }
    
    if (query.customerId) {
      where.customerId = query.customerId
    }
    
    if (query.tags && query.tags.length > 0) {
      where.tags = { hasEvery: query.tags }
    }
    
    if (query.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: new Date(query.createdAfter) }
    }
    
    if (query.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: new Date(query.createdBefore) }
    }
    
    // Calculate pagination
    const skip = (query.page - 1) * query.limit
    
    // Build order by
    const orderBy: any = {}
    orderBy[query.sortBy] = query.sortOrder
    
    // Get tickets with pagination
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
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
          },
          messages: {
            select: {
              id: true,
              senderType: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          _count: {
            select: {
              messages: true
            }
          }
        }
      }),
      prisma.supportTicket.count({ where })
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / query.limit)
    const hasNextPage = query.page < totalPages
    const hasPreviousPage = query.page > 1
    
    // Format tickets with additional computed fields
    const formattedTickets = tickets.map(ticket => ({
      ...ticket,
      lastMessageAt: ticket.messages[0]?.createdAt || ticket.createdAt,
      totalMessages: ticket._count.messages,
      isOverdue: ticket.estimatedResolutionAt && new Date() > new Date(ticket.estimatedResolutionAt)
    }))
    
    return res.status(200).json({
      tickets: formattedTickets,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    throw error
  }
}

async function createSupportTicket(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate request body
    const data = supportTicketCreateSchema.parse(req.body)
    
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
      select: { id: true, firstName: true, lastName: true, email: true }
    })
    
    if (!customer) {
      return res.status(400).json({ error: 'Customer not found' })
    }
    
    // Generate unique ticket number
    const ticketCount = await prisma.supportTicket.count()
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(ticketCount + 1).padStart(6, '0')}`
    
    // Create support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        ...data,
        ticketNumber,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        estimatedResolutionAt: data.estimatedResolutionAt ? new Date(data.estimatedResolutionAt) : null
      },
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
    
    // Create initial system message
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderName: 'System',
        senderType: 'SYSTEM',
        message: `Ticket created: ${data.description}`,
        isInternal: false
      }
    })
    
    return res.status(201).json({
      message: 'Support ticket created successfully',
      ticket
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    throw error
  }
}
