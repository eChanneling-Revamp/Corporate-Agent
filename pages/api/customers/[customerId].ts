import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { customerUpdateSchema } from '../../../lib/validationSchemas'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { customerId } = req.query
  
  if (!customerId || typeof customerId !== 'string') {
    return res.status(400).json({ error: 'Invalid customer ID' })
  }
  
  try {
    switch (req.method) {
      case 'GET':
        return await getCustomer(customerId, res)
      case 'PUT':
        return await updateCustomer(customerId, req, res)
      case 'DELETE':
        return await deleteCustomer(customerId, res)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Customer API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getCustomer(customerId: string, res: NextApiResponse) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
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
            ticketNumber: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        appointments: {
          select: {
            id: true,
            appointmentNumber: true,
            appointmentDate: true,
            appointmentTime: true,
            status: true,
            doctor: {
              select: {
                name: true,
                specialization: true
              }
            }
          },
          orderBy: {
            appointmentDate: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            appointments: true,
            supportTickets: true
          }
        }
      }
    })
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }
    
    // Calculate age if date of birth exists
    const age = customer.dateOfBirth 
      ? Math.floor((new Date().getTime() - new Date(customer.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null
    
    // Calculate open tickets
    const openTickets = customer.supportTickets.filter(ticket => 
      ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_AGENT'].includes(ticket.status)
    ).length
    
    return res.status(200).json({
      ...customer,
      age,
      totalAppointments: customer._count.appointments,
      totalTickets: customer._count.supportTickets,
      openTickets
    })
  } catch (error) {
    throw error
  }
}

async function updateCustomer(customerId: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate request body
    const data = customerUpdateSchema.parse({ ...req.body, id: customerId })
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId }
    })
    
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' })
    }
    
    // Check if email is being changed and already exists
    if (data.email && data.email !== existingCustomer.email) {
      const customerWithEmail = await prisma.customer.findUnique({
        where: { email: data.email }
      })
      
      if (customerWithEmail) {
        return res.status(400).json({ error: 'Customer with this email already exists' })
      }
    }
    
    // Prepare update data
    const updateData: any = { ...data }
    delete updateData.id
    
    // Handle date fields
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth)
    }
    
    if (data.insuranceValidUntil) {
      updateData.insuranceValidUntil = new Date(data.insuranceValidUntil)
    }
    
    // Update customer
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
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
    
    return res.status(200).json({
      message: 'Customer updated successfully',
      customer
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    throw error
  }
}

async function deleteCustomer(customerId: string, res: NextApiResponse) {
  try {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        _count: {
          select: {
            appointments: true,
            supportTickets: true
          }
        }
      }
    })
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }
    
    // Check if customer has related data
    if (customer._count.appointments > 0 || customer._count.supportTickets > 0) {
      // Soft delete by changing status
      await prisma.customer.update({
        where: { id: customerId },
        data: { 
          status: 'INACTIVE',
          email: `deleted_${customer.customerNumber}_${customer.email}` // Prevent email conflicts
        }
      })
      
      return res.status(200).json({
        message: 'Customer deactivated successfully (has related appointments/tickets)',
        soft_delete: true
      })
    } else {
      // Hard delete if no related data
      await prisma.customer.delete({
        where: { id: customerId }
      })
      
      return res.status(200).json({
        message: 'Customer deleted successfully',
        soft_delete: false
      })
    }
  } catch (error) {
    throw error
  }
}