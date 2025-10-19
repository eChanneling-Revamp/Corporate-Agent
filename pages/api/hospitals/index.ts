import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { hospitalSchema, apiResponse, handleApiError } from '../../../lib/validation'
import { requireRole } from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return await getHospitals(req, res)
    case 'POST':
      return await createHospital(req, res)
    default:
      return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }
}

async function getHospitals(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      search,
      city,
      district,
      isActive = 'true',
      limit = '20',
      offset = '0'
    } = req.query

    const whereClause: any = {
      isActive: isActive === 'true'
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (city) {
      whereClause.city = { contains: city as string, mode: 'insensitive' }
    }

    if (district) {
      whereClause.district = { contains: district as string, mode: 'insensitive' }
    }

    const hospitals = await prisma.hospital.findMany({
      where: whereClause,
      include: {
        doctors: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            specialization: true,
            rating: true
          }
        },
        _count: {
          select: {
            doctors: { where: { isActive: true } },
            appointments: {
              where: {
                appointmentDate: { gte: new Date() },
                status: 'CONFIRMED'
              }
            }
          }
        }
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { name: 'asc' }
    })

    const total = await prisma.hospital.count({
      where: whereClause
    })

    res.status(200).json(apiResponse.paginated(
      hospitals,
      {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + parseInt(limit as string)
      }
    ))

  } catch (error) {
    return handleApiError(error, res)
  }
}

async function createHospital(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = hospitalSchema.parse(req.body)

    const hospital = await prisma.hospital.create({
      data: validatedData
    })

    res.status(201).json(apiResponse.success(hospital, 'Hospital created successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

// Apply role-based access control for POST requests
export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    return requireRole(['ADMIN', 'SUPERVISOR'])(handler)(req, res)
  }
  return handler(req, res)
}