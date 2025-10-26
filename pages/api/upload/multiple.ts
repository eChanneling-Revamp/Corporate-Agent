import { NextApiRequest, NextApiResponse } from 'next'
import { uploadMiddleware } from './single'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }

  try {
    const files = (req as any).files

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json(apiResponse.error('No files uploaded', 400))
    }

    const filesData = files.map((file: any) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/${file.filename}`
    }))

    res.status(200).json(apiResponse.success(filesData, `${files.length} files uploaded successfully`))

  } catch (error) {
    return handleApiError(error, res)
  }
}

// Apply authentication and upload middleware for multiple files
const uploadMultiple = uploadMiddleware('files', 10) // Max 10 files
const authenticatedHandler = requireAuth(handler)

export default (req: NextApiRequest, res: NextApiResponse) => {
  uploadMultiple(req, res, () => {
    authenticatedHandler(req, res)
  })
}

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}
