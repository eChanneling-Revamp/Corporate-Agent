import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { customerCreateSchema, customerSearchSchema } from '../../../lib/validationSchemas'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getCustomers(req, res)
      case 'POST':
        return await createCustomer(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Customer API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getCustomers(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate query parameters
    const query = customerSearchSchema.parse(req.query)
    
    // Build where clause
    const where: any = {}
    
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { customerNumber: { contains: query.search, mode: 'insensitive' } }
      ]
    }
    
    if (query.status) {
      where.status = query.status
    }
    
    if (query.gender) {
      where.gender = query.gender
    }
    
    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' }
    }
    
    if (query.state) {
      where.state = { contains: query.state, mode: 'insensitive' }
    }
    
    if (query.assignedAgentId) {
      where.assignedAgentId = query.assignedAgentId
    }
    
    if (query.communicationMethod) {
      where.communicationMethod = query.communicationMethod
    }
    
    if (query.tags && query.tags.length > 0) {
      where.tags = { hasEvery: query.tags }
    }
    
    // Handle age range filter
    if (query.ageRange) {
      const now = new Date()
      let minDate: Date | undefined
      let maxDate: Date | undefined
      
      switch (query.ageRange) {
        case '18-30':
          minDate = new Date(now.getFullYear() - 30, now.getMonth(), now.getDate())
          maxDate = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate())
          break
        case '31-45':
          minDate = new Date(now.getFullYear() - 45, now.getMonth(), now.getDate())
          maxDate = new Date(now.getFullYear() - 31, now.getMonth(), now.getDate())
          break
        case '46-60':
          minDate = new Date(now.getFullYear() - 60, now.getMonth(), now.getDate())
          maxDate = new Date(now.getFullYear() - 46, now.getMonth(), now.getDate())
          break
        case '60+':
          maxDate = new Date(now.getFullYear() - 60, now.getMonth(), now.getDate())
          break
      }
      
      if (minDate || maxDate) {
        where.dateOfBirth = {}
        if (minDate) where.dateOfBirth.gte = minDate
        if (maxDate) where.dateOfBirth.lte = maxDate
      }
    }
    
    // Calculate pagination
    const skip = (query.page - 1) * query.limit
    
    // Build order by
    const orderBy: any = {}
    if (query.sortBy === 'name') {
      orderBy.firstName = query.sortOrder
    } else {
      orderBy[query.sortBy] = query.sortOrder
    }
    
    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        include: {
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
          supportTickets: {
            select: {
              id: true,
              status: true
            }
          },
          _count: {
            select: {
              appointments: true,
              supportTickets: true
            }
          }
        }
      }),
      prisma.customer.count({ where })
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / query.limit)
    const hasNextPage = query.page < totalPages
    const hasPreviousPage = query.page > 1
    
    return res.status(200).json({
      customers: customers.map(customer => ({
        ...customer,
        age: customer.dateOfBirth 
          ? Math.floor((new Date().getTime() - new Date(customer.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null,
        totalAppointments: customer._count.appointments,
        openTickets: customer.supportTickets.filter(ticket => 
          ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_AGENT'].includes(ticket.status)
        ).length
      })),
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

async function createCustomer(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate request body
    const data = customerCreateSchema.parse(req.body)
    
    // Check if customer with email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: data.email }
    })
    
    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this email already exists' })
    }
    
    // Generate unique customer number
    const customerCount = await prisma.customer.count()
    const customerNumber = `CUST-${new Date().getFullYear()}-${String(customerCount + 1).padStart(6, '0')}`
    
    // Create customer
    const customer = await prisma.customer.create({
      data: {
        ...data,
        customerNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        insuranceValidUntil: data.insuranceValidUntil ? new Date(data.insuranceValidUntil) : null
      },
      include: {
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
    
    return res.status(201).json({
      message: 'Customer created successfully',
      customer
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    throw error
  }
}
