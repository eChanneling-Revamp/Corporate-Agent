import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    version: '1.0.0'
  }

  res.status(200).json(healthData)
}
