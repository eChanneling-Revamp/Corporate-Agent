import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { supportTicketSearchSchema } from '../../../lib/validationSchemas'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    return await exportSupportTickets(req, res)
  } catch (error) {
    console.error('Support Tickets export API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function exportSupportTickets(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate query parameters
    const query = supportTicketSearchSchema.parse(req.body.filters || {})
    
    // Build where clause (same as in index.ts)
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
    
    if (query.status) where.status = query.status
    if (query.priority) where.priority = query.priority
    if (query.category) where.category = query.category
    if (query.assignedAgentId) where.assignedAgentId = query.assignedAgentId
    if (query.customerId) where.customerId = query.customerId
    if (query.tags && query.tags.length > 0) where.tags = { hasEvery: query.tags }
    
    if (query.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: new Date(query.createdAfter) }
    }
    
    if (query.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: new Date(query.createdBefore) }
    }
    
    // Get all matching tickets (no pagination for export)
    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
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
        _count: {
          select: {
            messages: true
          }
        }
      }
    })
    
    // Format data for export
    const exportData = tickets.map(ticket => {
      const resolutionTime = ticket.actualResolutionAt && ticket.createdAt
        ? Math.round((new Date(ticket.actualResolutionAt).getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60)) // in hours
        : null
      
      const isOverdue = ticket.estimatedResolutionAt && new Date() > new Date(ticket.estimatedResolutionAt)
      
      return {
        'Ticket Number': ticket.ticketNumber,
        'Customer Number': ticket.customer?.customerNumber || '',
        'Customer Name': ticket.customerName,
        'Customer Email': ticket.customerEmail,
        'Customer Phone': ticket.customer?.phone || '',
        'Title': ticket.title,
        'Description': ticket.description,
        'Category': ticket.category,
        'Priority': ticket.priority,
        'Status': ticket.status,
        'Assigned Agent': ticket.assignedAgent?.name || 'Unassigned',
        'Agent Email': ticket.assignedAgent?.email || '',
        'Tags': Array.isArray(ticket.tags) ? ticket.tags.join(', ') : '',
        'Total Messages': ticket._count.messages,
        'Estimated Resolution': ticket.estimatedResolutionAt ? new Date(ticket.estimatedResolutionAt).toLocaleString() : '',
        'Actual Resolution': ticket.actualResolutionAt ? new Date(ticket.actualResolutionAt).toLocaleString() : '',
        'Resolution Time (Hours)': resolutionTime || '',
        'Is Overdue': isOverdue ? 'Yes' : 'No',
        'Satisfaction Rating': ticket.satisfactionRating?.toString() || '',
        'Resolution Notes': ticket.resolutionNotes || '',
        'Created By': ticket.createdBy?.name || '',
        'Created At': new Date(ticket.createdAt).toLocaleString(),
        'Updated At': new Date(ticket.updatedAt).toLocaleString(),
        'Closed At': ticket.closedAt ? new Date(ticket.closedAt).toLocaleString() : ''
      }
    })
    
    // Calculate summary statistics
    const stats = {
      total: tickets.length,
      byStatus: {
        OPEN: tickets.filter(t => t.status === 'OPEN').length,
        IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        WAITING_CUSTOMER: tickets.filter(t => t.status === 'WAITING_CUSTOMER').length,
        WAITING_AGENT: tickets.filter(t => t.status === 'WAITING_AGENT').length,
        RESOLVED: tickets.filter(t => t.status === 'RESOLVED').length,
        CLOSED: tickets.filter(t => t.status === 'CLOSED').length,
        CANCELLED: tickets.filter(t => t.status === 'CANCELLED').length
      },
      byPriority: {
        LOW: tickets.filter(t => t.priority === 'LOW').length,
        MEDIUM: tickets.filter(t => t.priority === 'MEDIUM').length,
        HIGH: tickets.filter(t => t.priority === 'HIGH').length,
        URGENT: tickets.filter(t => t.priority === 'URGENT').length,
        CRITICAL: tickets.filter(t => t.priority === 'CRITICAL').length
      },
      byCategory: {
        TECHNICAL: tickets.filter(t => t.category === 'TECHNICAL').length,
        BILLING: tickets.filter(t => t.category === 'BILLING').length,
        APPOINTMENT: tickets.filter(t => t.category === 'APPOINTMENT').length,
        COMPLAINT: tickets.filter(t => t.category === 'COMPLAINT').length,
        GENERAL: tickets.filter(t => t.category === 'GENERAL').length,
        EMERGENCY: tickets.filter(t => t.category === 'EMERGENCY').length,
        FEEDBACK: tickets.filter(t => t.category === 'FEEDBACK').length
      }
    }
    
    // Return the export data
    return res.status(200).json({
      data: exportData,
      stats,
      count: exportData.length,
      timestamp: new Date().toISOString(),
      filename: `support_tickets_export_${new Date().toISOString().split('T')[0]}.csv`
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    throw error
  }
}
