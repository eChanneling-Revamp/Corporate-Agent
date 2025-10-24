import { NextApiRequest, NextApiResponse } from 'next'

export interface SecurityOptions {
  // Content Security Policy options
  csp?: {
    defaultSrc?: string[]
    scriptSrc?: string[]
    styleSrc?: string[]
    imgSrc?: string[]
    connectSrc?: string[]
    fontSrc?: string[]
    objectSrc?: string[]
    mediaSrc?: string[]
    frameSrc?: string[]
  }
  
  // CORS options
  cors?: {
    origin?: string | string[] | boolean
    methods?: string[]
    allowedHeaders?: string[]
    credentials?: boolean
    maxAge?: number
  }
  
  // Additional security options
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string
  contentTypeOptions?: boolean
  referrerPolicy?: string
  permissionsPolicy?: string
  hsts?: {
    maxAge: number
    includeSubDomains?: boolean
    preload?: boolean
  }
}

const defaultSecurityOptions: SecurityOptions = {
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'", "https://api.stripe.com", "wss:", "ws:"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'", "https://js.stripe.com"]
  },
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://yourdomain.com']
      : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}

export function securityHeaders(options: SecurityOptions = {}) {
  const config = { ...defaultSecurityOptions, ...options }
  
  return function securityMiddleware(
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  ) {
    return async function (req: NextApiRequest, res: NextApiResponse) {
      // Set security headers
      setSecurityHeaders(res, config)
      
      // Handle CORS preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(200).end()
      }
      
      // Handle CORS
      if (config.cors) {
        handleCors(req, res, config.cors)
      }
      
      return handler(req, res)
    }
  }
}

function setSecurityHeaders(res: NextApiResponse, config: SecurityOptions) {
  // Content Security Policy
  if (config.csp) {
    const cspDirectives = Object.entries(config.csp)
      .map(([directive, sources]) => {
        const kebabDirective = directive.replace(/([A-Z])/g, '-$1').toLowerCase()
        return `${kebabDirective} ${sources.join(' ')}`
      })
      .join('; ')
    
    res.setHeader('Content-Security-Policy', cspDirectives)
  }
  
  // X-Frame-Options
  if (config.frameOptions) {
    res.setHeader('X-Frame-Options', config.frameOptions)
  }
  
  // X-Content-Type-Options
  if (config.contentTypeOptions) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
  }
  
  // Referrer Policy
  if (config.referrerPolicy) {
    res.setHeader('Referrer-Policy', config.referrerPolicy)
  }
  
  // Permissions Policy
  if (config.permissionsPolicy) {
    res.setHeader('Permissions-Policy', config.permissionsPolicy)
  }
  
  // HTTP Strict Transport Security (only in production with HTTPS)
  if (config.hsts && process.env.NODE_ENV === 'production') {
    let hstsValue = `max-age=${config.hsts.maxAge}`
    if (config.hsts.includeSubDomains) {
      hstsValue += '; includeSubDomains'
    }
    if (config.hsts.preload) {
      hstsValue += '; preload'
    }
    res.setHeader('Strict-Transport-Security', hstsValue)
  }
  
  // Additional security headers
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  res.setHeader('X-Download-Options', 'noopen')
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
  res.setHeader('X-XSS-Protection', '1; mode=block')
}

function handleCors(req: NextApiRequest, res: NextApiResponse, corsOptions: NonNullable<SecurityOptions['cors']>) {
  const origin = req.headers.origin
  
  // Handle origin
  if (corsOptions.origin !== undefined) {
    if (corsOptions.origin === true) {
      res.setHeader('Access-Control-Allow-Origin', '*')
    } else if (corsOptions.origin === false) {
      // No CORS allowed
      return
    } else if (typeof corsOptions.origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', corsOptions.origin)
    } else if (Array.isArray(corsOptions.origin)) {
      if (origin && corsOptions.origin.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin)
      }
    }
  }
  
  // Handle methods
  if (corsOptions.methods) {
    res.setHeader('Access-Control-Allow-Methods', corsOptions.methods.join(', '))
  }
  
  // Handle allowed headers
  if (corsOptions.allowedHeaders) {
    res.setHeader('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '))
  }
  
  // Handle credentials
  if (corsOptions.credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  
  // Handle max age
  if (corsOptions.maxAge) {
    res.setHeader('Access-Control-Max-Age', corsOptions.maxAge.toString())
  }
}

// Predefined security configurations
export const securityConfigs = {
  // Strict security for authentication endpoints
  auth: securityHeaders({
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"]
    },
    cors: {
      origin: process.env.NODE_ENV === 'production' ? [process.env.FRONTEND_URL || 'https://yourdomain.com'] : true,
      methods: ['POST'],
      allowedHeaders: ['Content-Type'],
      credentials: true
    }
  }),

  // Payment security configuration
  payment: securityHeaders({
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'self'", "https://js.stripe.com"]
    }
  }),

  // API endpoints security
  api: securityHeaders({
    cors: {
      origin: process.env.NODE_ENV === 'production' ? [process.env.FRONTEND_URL || 'https://yourdomain.com'] : true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }
  }),

  // Default security configuration
  default: securityHeaders()
}