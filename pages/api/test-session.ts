import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('🔍 Session Test: Current session data:', JSON.stringify(session.user, null, 2));

    return res.status(200).json({
      user: session.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Session test error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}