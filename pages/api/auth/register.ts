import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'
import { registerSchema, apiResponse, handleApiError } from '../../../lib/validation'
import { generateTokens } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }

  try {
    // Validate request data
    const validatedData = registerSchema.parse(req.body)
    const { email, password, name, companyName, contactNumber } = validatedData

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { contactNumber }
        ]
      }
    })

    if (existingUser) {
      return res.status(409).json(apiResponse.error('User already exists with this email or phone number', 409))
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate registration number
    const registrationNumber = `CA${Date.now()}${Math.floor(Math.random() * 1000)}`

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        companyName,
        contactNumber,
        role: 'AGENT',
        isActive: true,
        isEmailVerified: false
      }
    })

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entityType: 'USER',
        entityId: user.id,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    })

    res.status(201).json(apiResponse.success({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        contactNumber: user.contactNumber,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    }, 'Registration successful'))

  } catch (error) {
    return handleApiError(error, res)
  }
}
