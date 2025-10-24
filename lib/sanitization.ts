import { NextApiRequest, NextApiResponse } from 'next'
import { ZodSchema, ZodError } from 'zod'
import validator from 'validator'

export interface ValidationOptions {
  body?: ZodSchema
  query?: ZodSchema
  sanitize?: boolean
  xss?: boolean
  sql?: boolean
  maxBodySize?: number
}

export function validateAndSanitize(options: ValidationOptions = {}) {
  return function validationMiddleware(
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  ) {
    return async function (req: NextApiRequest, res: NextApiResponse) {
      try {
        // Check body size
        if (options.maxBodySize && req.body) {
          const bodySize = JSON.stringify(req.body).length
          if (bodySize > options.maxBodySize) {
            return res.status(413).json({
              success: false,
              message: 'Request payload too large',
              error: 'PAYLOAD_TOO_LARGE'
            })
          }
        }

        // Sanitize inputs
        if (options.sanitize !== false) {
          req.body = sanitizeObject(req.body, options)
          req.query = sanitizeObject(req.query, options)
        }

        // Validate request body
        if (options.body && req.body) {
          try {
            req.body = options.body.parse(req.body)
          } catch (error) {
            if (error instanceof ZodError) {
              return res.status(400).json({
                success: false,
                message: 'Invalid request body',
                errors: error.issues.map(err => ({
                  field: err.path.join('.'),
                  message: err.message,
                  code: err.code
                }))
              })
            }
            throw error
          }
        }

        // Validate query parameters
        if (options.query && req.query) {
          try {
            const validatedQuery = options.query.parse(req.query)
            req.query = validatedQuery as any
          } catch (error) {
            if (error instanceof ZodError) {
              return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: error.issues.map(err => ({
                  field: err.path.join('.'),
                  message: err.message,
                  code: err.code
                }))
              })
            }
            throw error
          }
        }

        return handler(req, res)
      } catch (error) {
        console.error('Validation middleware error:', error)
        return res.status(500).json({
          success: false,
          message: 'Internal server error during validation',
          error: 'VALIDATION_ERROR'
        })
      }
    }
  }
}

function sanitizeObject(obj: any, options: ValidationOptions): any {
  if (!obj || typeof obj !== 'object') {
    return sanitizeValue(obj, options)
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options))
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeValue(key, options)
    sanitized[sanitizedKey] = sanitizeObject(value, options)
  }

  return sanitized
}

function sanitizeValue(value: any, options: ValidationOptions): any {
  if (typeof value !== 'string') {
    return value
  }

  let sanitized = value

  // Basic XSS protection (without DOM purify for simplicity)
  if (options.xss !== false) {
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  // SQL injection protection
  if (options.sql !== false) {
    sanitized = validator.escape(sanitized)
  }

  // Additional string sanitization
  sanitized = sanitized.trim()
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
  // Limit string length (basic DoS protection)
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000)
  }

  return sanitized
}

// Common validation schemas for different endpoints
export const commonValidations = {
  // Pagination parameters
  pagination: {
    page: (min = 1, max = 1000) => 
      validator.isInt(String(min), { min, max }),
    limit: (min = 1, max = 100) => 
      validator.isInt(String(min), { min, max })
  },

  // ID validation
  id: {
    uuid: (value: string) => validator.isUUID(value),
    mongoId: (value: string) => validator.isMongoId(value),
    numeric: (value: string) => validator.isInt(value, { min: 1 })
  },

  // Common field validations
  fields: {
    email: (value: string) => validator.isEmail(value),
    phone: (value: string) => validator.isMobilePhone(value),
    date: (value: string) => validator.isISO8601(value),
    url: (value: string) => validator.isURL(value),
    alphanumeric: (value: string) => validator.isAlphanumeric(value),
    strongPassword: (value: string) => validator.isStrongPassword(value, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })
  }
}

// Security-focused input sanitizer
export function securitySanitize(input: any): any {
  return sanitizeObject(input, {
    xss: true,
    sql: true,
    sanitize: true,
    maxBodySize: 100000 // 100KB max
  })
}

// File upload validation
export interface FileValidationOptions {
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
  maxFiles?: number
}

export function validateFileUpload(
  files: any[],
  options: FileValidationOptions = {}
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'],
    maxFiles = 10
  } = options

  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`)
  }

  for (const file of files) {
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File ${file.name} exceeds maximum size of ${maxSize / (1024 * 1024)}MB`)
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`)
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed`)
    }

    // Check for dangerous file names
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push(`Invalid file name: ${file.name}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}