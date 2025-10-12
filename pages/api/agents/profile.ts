import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      // Get agent profile by email
      const agent = await prisma.agent.findUnique({
        where: { email: session.user.email },
        include: {
          branches: true,
        }
      })

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' })
      }

      // Remove sensitive data
      const { password, ...safeAgent } = agent
      
      return res.status(200).json({ agent: safeAgent })
    }

    if (req.method === 'PUT') {
      const {
        contactPerson,
        phone,
        address,
        companyName
      } = req.body

      const agent = await prisma.agent.update({
        where: { email: session.user.email },
        data: {
          contactPerson,
          phone,
          address,
          companyName
        }
      })

      // Remove sensitive data
      const { password, ...safeAgent } = agent
      
      return res.status(200).json({ agent: safeAgent })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}