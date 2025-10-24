import { NextApiRequest, NextApiResponse } from 'next'
import { LRUCache } from 'lru-cache'

// Rate limiting configuration
const rateLimitConfig = {
  // Different limits for different types of requests
  default: { requests: 100, window: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  auth: { requests: 5, window: 15 * 60 * 1000 }, // 5 auth attempts per 15 minutes
  payment: { requests: 10, window: 60 * 60 * 1000 }, // 10 payments per hour
  booking: { requests: 20, window: 60 * 60 * 1000 } // 20 bookings per hour
}

// In-memory cache for rate limiting (use Redis in production)
const cache = new LRUCache<string, { count: number; resetTime: number }>({
  max: 5000,
  ttl: 15 * 60 * 1000 // 15 minutes
})

export interface RateLimitOptions {
  type?: keyof typeof rateLimitConfig
  identifier?: (req: NextApiRequest) => string
  skip?: (req: NextApiRequest) => boolean
}

export function rateLimit(options: RateLimitOptions = {}) {
  return function rateLimitMiddleware(
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  ) {
    return async function (req: NextApiRequest, res: NextApiResponse) {
      // Skip rate limiting if specified
      if (options.skip && options.skip(req)) {
        return handler(req, res)
      }

      // Get rate limit configuration
      const config = rateLimitConfig[options.type || 'default']
      
      // Generate identifier for the client
      const identifier = options.identifier 
        ? options.identifier(req)
        : getClientIdentifier(req)

      const key = `ratelimit:${identifier}:${options.type || 'default'}`
      
      // Get current rate limit data
      const now = Date.now()
      const current = cache.get(key)
      
      if (!current || now > current.resetTime) {
        // Initialize or reset rate limit
        cache.set(key, {
          count: 1,
          resetTime: now + config.window
        })
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', config.requests)
        res.setHeader('X-RateLimit-Remaining', config.requests - 1)
        res.setHeader('X-RateLimit-Reset', new Date(now + config.window).toISOString())
        
        return handler(req, res)
      }

      if (current.count >= config.requests) {
        // Rate limit exceeded
        res.setHeader('X-RateLimit-Limit', config.requests)
        res.setHeader('X-RateLimit-Remaining', 0)
        res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString())
        res.setHeader('Retry-After', Math.ceil((current.resetTime - now) / 1000))
        
        return res.status(429).json({
          success: false,
          message: 'Too many requests',
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        })
      }

      // Increment counter
      cache.set(key, {
        count: current.count + 1,
        resetTime: current.resetTime
      })
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.requests)
      res.setHeader('X-RateLimit-Remaining', config.requests - current.count - 1)
      res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString())
      
      return handler(req, res)
    }
  }
}

function getClientIdentifier(req: NextApiRequest): string {
  // Try to get IP from various headers (considering proxies)
  const forwarded = req.headers['x-forwarded-for']
  const real = req.headers['x-real-ip']
  const cf = req.headers['cf-connecting-ip']
  
  let ip: string
  
  if (forwarded) {
    ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim()
  } else if (real) {
    ip = Array.isArray(real) ? real[0] : real
  } else if (cf) {
    ip = Array.isArray(cf) ? cf[0] : cf
  } else {
    ip = req.socket.remoteAddress || 'unknown'
  }

  // Include user agent for additional uniqueness
  const userAgent = req.headers['user-agent'] || 'unknown'
  const userAgentHash = Buffer.from(userAgent).toString('base64').substring(0, 10)
  
  return `${ip}:${userAgentHash}`
}

// Predefined rate limiters for common use cases
export const rateLimiters = {
  // Authentication endpoints
  auth: rateLimit({
    type: 'auth',
    identifier: (req) => {
      // Use email from request body for auth endpoints
      const email = req.body?.email
      return email ? `auth:${email}` : getClientIdentifier(req)
    }
  }),

  // Payment processing
  payment: rateLimit({
    type: 'payment',
    identifier: (req) => {
      // Stricter rate limiting for payments
      return getClientIdentifier(req)
    }
  }),

  // Appointment booking
  booking: rateLimit({
    type: 'booking',
    skip: (req) => {
      // Skip rate limiting for GET requests (viewing appointments)
      return req.method === 'GET'
    }
  }),

  // Default rate limiting
  default: rateLimit(),

  // Strict rate limiting for sensitive operations
  strict: rateLimit({
    type: 'auth', // Uses the most restrictive configuration
    identifier: (req) => getClientIdentifier(req)
  })
}