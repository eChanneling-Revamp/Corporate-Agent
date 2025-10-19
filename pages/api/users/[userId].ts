import { NextApiRequest, NextApiResponse } from 'next'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'AGENT']).optional(),
  companyName: z.string().optional(),
  contactNumber: z.string().optional(),
  isActive: z.boolean().optional()
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query

  if (typeof userId !== 'string') {
    return res.status(400).json(apiResponse.error('Invalid user ID', 400))
  }

  try {
    switch (req.method) {
      case 'GET':
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            companyName: true,
            contactNumber: true,
            isActive: true,
            isEmailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              appointments: true,
              tasks: true,
              notifications: true
            }
          }
        })

        if (!user) {
          return res.status(404).json(apiResponse.error('User not found', 404))
        }

        res.status(200).json(apiResponse.success(user, 'User retrieved successfully'))
        break

      case 'PUT':
        const updateData = userUpdateSchema.parse(req.body)

        // Check if email is being updated and if it already exists
        if (updateData.email) {
          const existingUser = await prisma.user.findFirst({
            where: {
              email: updateData.email,
              NOT: { id: userId }
            }
          })

          if (existingUser) {
            return res.status(400).json(apiResponse.error('Email already exists', 400))
          }
        }

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: updateData,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            companyName: true,
            contactNumber: true,
            isActive: true,
            isEmailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true
          }
        })

        res.status(200).json(apiResponse.success(updatedUser, 'User updated successfully'))
        break

      case 'DELETE':
        // Soft delete by setting isActive to false
        const deletedUser = await prisma.user.update({
          where: { id: userId },
          data: { isActive: false },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true
          }
        })

        res.status(200).json(apiResponse.success(deletedUser, 'User deactivated successfully'))
        break

      default:
        res.status(405).json(apiResponse.error('Method Not Allowed', 405))
    }

  } catch (error) {
    return handleApiError(error, res)
  }
}

export default requireAuth(handler)