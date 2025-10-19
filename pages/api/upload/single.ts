import { NextApiRequest, NextApiResponse } from 'next'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads'
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const fileExtension = path.extname(file.originalname)
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`
    cb(null, fileName)
  }
})

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png,doc,docx')
    .split(',')
    .map(type => {
      switch (type.trim().toLowerCase()) {
        case 'pdf': return 'application/pdf'
        case 'jpg': case 'jpeg': return 'image/jpeg'
        case 'png': return 'image/png'
        case 'gif': return 'image/gif'
        case 'doc': return 'application/msword'
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        case 'txt': return 'text/plain'
        default: return type
      }
    })

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
  }
})

// Middleware wrapper to handle multer errors
export const uploadMiddleware = (fieldName: string, maxCount: number = 1) => {
  return (req: NextApiRequest, res: NextApiResponse, next: Function) => {
    const uploadHandler = maxCount === 1 
      ? upload.single(fieldName)
      : upload.array(fieldName, maxCount)

    uploadHandler(req as any, res as any, (error: any) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          switch (error.code) {
            case 'LIMIT_FILE_SIZE':
              return res.status(400).json(apiResponse.error('File too large', 400))
            case 'LIMIT_FILE_COUNT':
              return res.status(400).json(apiResponse.error('Too many files', 400))
            case 'LIMIT_UNEXPECTED_FILE':
              return res.status(400).json(apiResponse.error('Unexpected file field', 400))
            default:
              return res.status(400).json(apiResponse.error('File upload error', 400))
          }
        } else {
          return res.status(400).json(apiResponse.error(error.message, 400))
        }
      }
      next()
    })
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }

  try {
    const file = (req as any).file
    const files = (req as any).files

    if (!file && !files) {
      return res.status(400).json(apiResponse.error('No file uploaded', 400))
    }

    // Handle single file upload
    if (file) {
      const fileData = {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${file.filename}`
      }

      res.status(200).json(apiResponse.success(fileData, 'File uploaded successfully'))
      return
    }

    // Handle multiple files upload
    if (files && Array.isArray(files)) {
      const filesData = files.map((file: any) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${file.filename}`
      }))

      res.status(200).json(apiResponse.success(filesData, 'Files uploaded successfully'))
      return
    }

  } catch (error) {
    return handleApiError(error, res)
  }
}

// Apply authentication and upload middleware
const uploadSingle = uploadMiddleware('file', 1)
const authenticatedHandler = requireAuth(handler)

export default (req: NextApiRequest, res: NextApiResponse) => {
  uploadSingle(req, res, () => {
    authenticatedHandler(req, res)
  })
}

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}