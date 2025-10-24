import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'
import { loginSchema, apiResponse, handleApiError } from '../../../lib/validation'
import { generateTokens } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }

  try {
    // Validate request data
    const validatedData = loginSchema.parse(req.body)
    const { email, password } = validatedData

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return res.status(401).json(apiResponse.error('Invalid credentials', 401))
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json(apiResponse.error('Account is deactivated', 401))
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json(apiResponse.error('Invalid credentials', 401))
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLoginAt: new Date()
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    })

    res.status(200).json(apiResponse.success({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        contactNumber: user.contactNumber,
        isActive: user.isActive
      }
    }, 'Login successful'))

  } catch (error) {
    return handleApiError(error, res)
  }
}