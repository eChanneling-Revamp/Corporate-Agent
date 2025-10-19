import jwt from 'jsonwebtoken'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from './prisma'

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string
    email: string
    role: string
    name: string
  }
}

export const authenticateToken = async (req: NextApiRequest): Promise<any> => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    throw new Error('Access token required')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Temporary bypass for development - return mock user
    const mockUser = {
      id: decoded.userId || 'mock-user-id',
      email: decoded.email || 'admin@example.com',
      name: 'Mock User',
      role: decoded.role || 'ADMIN',
      isActive: true,
      isEmailVerified: true
    }

    return mockUser

    // TODO: Enable this once Prisma client is working properly
    // const user = await prisma.user.findUnique({
    //   where: { id: decoded.userId },
    //   select: {
    //     id: true,
    //     email: true,
    //     name: true,
    //     role: true,
    //     isActive: true,
    //     isEmailVerified: true
    //   }
    // })

    // if (!user || !user.isActive) {
    //   throw new Error('User not found or inactive')
    // }

    // return user
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    }
    throw error
  }
}

export const requireAuth = (handler: Function) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Development bypass - if no auth header is provided, use mock user
      if (process.env.NODE_ENV === 'development' && !req.headers.authorization) {
        const mockUser = {
          id: 'dev-user-id',
          email: 'dev@example.com',
          name: 'Development User',
          role: 'ADMIN'
        }
        ;(req as AuthenticatedRequest).user = mockUser
        return handler(req, res)
      }

      const user = await authenticateToken(req)
      ;(req as AuthenticatedRequest).user = user
      return handler(req, res)
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Authentication failed' 
      })
    }
  }
}

export const requireRole = (roles: string[]) => {
  return (handler: Function) => {
    return requireAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        })
      }
      return handler(req, res)
    })
  }
}

export const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  )

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  return { accessToken, refreshToken }
}