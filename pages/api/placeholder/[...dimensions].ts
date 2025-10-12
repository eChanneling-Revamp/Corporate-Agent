import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { dimensions } = req.query;
  
  // Parse dimensions (e.g., "150/150" or "200/300")
  let width = 150;
  let height = 150;
  
  if (dimensions && Array.isArray(dimensions)) {
    const [w, h] = dimensions;
    width = parseInt(w) || 150;
    height = parseInt(h) || width; // Use width as height if height not provided
  }
  
  // Generate a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#666" text-anchor="middle" dominant-baseline="middle">
        ${width}×${height}
      </text>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(svg);
}