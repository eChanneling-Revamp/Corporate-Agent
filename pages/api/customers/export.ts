import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { customerSearchSchema } from '../../../lib/validationSchemas'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    return await exportCustomers(req, res)
  } catch (error) {
    console.error('Customer export API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function exportCustomers(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate query parameters
    const query = customerSearchSchema.parse(req.body.filters || {})
    
    // Build where clause (same as in index.ts)
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
    
    if (query.status) where.status = query.status
    if (query.gender) where.gender = query.gender
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' }
    if (query.state) where.state = { contains: query.state, mode: 'insensitive' }
    if (query.assignedAgentId) where.assignedAgentId = query.assignedAgentId
    if (query.communicationMethod) where.communicationMethod = query.communicationMethod
    if (query.tags && query.tags.length > 0) where.tags = { hasEvery: query.tags }
    
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
    
    // Get all matching customers (no pagination for export)
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
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
        _count: {
          select: {
            appointments: true,
            supportTickets: true
          }
        }
      }
    })
    
    // Format data for export
    const exportData = customers.map(customer => ({
      'Customer Number': customer.customerNumber,
      'First Name': customer.firstName,
      'Last Name': customer.lastName,
      'Email': customer.email,
      'Phone': customer.phone,
      'Date of Birth': customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : '',
      'Age': customer.dateOfBirth 
        ? Math.floor((new Date().getTime() - new Date(customer.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : '',
      'Gender': customer.gender || '',
      'Street': customer.street || '',
      'City': customer.city || '',
      'State': customer.state || '',
      'ZIP Code': customer.zipCode || '',
      'Country': customer.country,
      'Emergency Contact Name': customer.emergencyContactName || '',
      'Emergency Contact Relationship': customer.emergencyContactRelationship || '',
      'Emergency Contact Phone': customer.emergencyContactPhone || '',
      'Blood Type': customer.bloodType || '',
      'Allergies': Array.isArray(customer.allergies) ? customer.allergies.join(', ') : '',
      'Chronic Conditions': Array.isArray(customer.chronicConditions) ? customer.chronicConditions.join(', ') : '',
      'Current Medications': Array.isArray(customer.currentMedications) ? customer.currentMedications.join(', ') : '',
      'Insurance Provider': customer.insuranceProvider || '',
      'Insurance Policy Number': customer.insurancePolicyNumber || '',
      'Insurance Group Number': customer.insuranceGroupNumber || '',
      'Insurance Valid Until': customer.insuranceValidUntil ? new Date(customer.insuranceValidUntil).toLocaleDateString() : '',
      'Preferred Language': customer.preferredLanguage,
      'Communication Method': customer.communicationMethod,
      'Appointment Reminders': customer.appointmentReminders ? 'Yes' : 'No',
      'Newsletter Subscription': customer.newsletterSubscription ? 'Yes' : 'No',
      'Tags': Array.isArray(customer.tags) ? customer.tags.join(', ') : '',
      'Status': customer.status,
      'Total Appointments': customer._count.appointments,
      'Last Appointment': customer.lastAppointmentAt ? new Date(customer.lastAppointmentAt).toLocaleDateString() : '',
      'Next Appointment': customer.nextAppointmentAt ? new Date(customer.nextAppointmentAt).toLocaleDateString() : '',
      'Customer Value': customer.customerValue.toString(),
      'Satisfaction Rating': customer.satisfaction?.toString() || '',
      'Assigned Agent': customer.assignedAgent?.name || '',
      'Created By': customer.createdBy?.name || '',
      'Created At': new Date(customer.createdAt).toLocaleDateString(),
      'Updated At': new Date(customer.updatedAt).toLocaleDateString()
    }))
    
    // Return the export data
    return res.status(200).json({
      data: exportData,
      count: exportData.length,
      timestamp: new Date().toISOString(),
      filename: `customers_export_${new Date().toISOString().split('T')[0]}.csv`
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    throw error
  }
}
