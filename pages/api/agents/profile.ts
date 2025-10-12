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
      console.log('Agents profile API called (GET)')
      console.log('Session user:', session.user)

      // Use agent ID directly from session like the working appointments API
      const agentId = (session.user as any).id
      
      if (!agentId) {
        console.log('Agents profile API: No agent ID in session')
        return res.status(404).json({ error: 'Agent not found' })
      }

      console.log('Agents profile API: Using agent ID from session:', agentId)

      // Get agent profile by ID
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          branches: true,
        }
      })

      console.log('Agents profile API: Agent found in database:', agent ? 'Yes' : 'No')

      if (!agent) {
        console.log('Agents profile API: Agent not found in database for ID:', agentId)
        return res.status(404).json({ error: 'Agent not found' })
      }

      // Remove sensitive data
      const { password, ...safeAgent } = agent
      
      console.log('Agents profile API: Returning agent profile')
      return res.status(200).json({ agent: safeAgent })
    }

    if (req.method === 'PUT') {
      console.log('Agents profile API called (PUT)')
      
      const agentId = (session.user as any).id
      if (!agentId) {
        return res.status(404).json({ error: 'Agent not found' })
      }

      const {
        contactPerson,
        phone,
        address,
        companyName
      } = req.body

      const agent = await prisma.agent.update({
        where: { id: agentId },
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