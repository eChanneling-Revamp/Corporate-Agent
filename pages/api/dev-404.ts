// Development-specific API route to handle noisy 404s
import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Silently handle webpack hot-update and devtools requests
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`)
  
  if (
    pathname.includes('webpack.hot-update') ||
    pathname.includes('.well-known') ||
    pathname.includes('sockjs-node') ||
    pathname.includes('__nextjs')
  ) {
    return res.status(204).end() // No Content - silent success
  }
  
  // For other requests, return normal 404
  res.status(404).json({ message: 'Not found' })
}

export const config = {
  api: {
    bodyParser: false,
  },
}