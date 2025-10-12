import { NextApiRequest, NextApiResponse } from 'next';
import { LRUCache } from 'lru-cache';

type Options = {
  interval: number;
  uniqueTokenPerInterval: number;
};

export default function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (req: NextApiRequest, res: NextApiResponse, limit: number, token: string) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0];
      if (tokenCount[0] === 0) {
        tokenCache.set(token, tokenCount);
      }
      tokenCount[0] += 1;

      const currentUsage = tokenCount[0];
      const isRateLimited = currentUsage >= limit;

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', isRateLimited ? 0 : limit - currentUsage);

      return isRateLimited;
    },
  };
}

// Create rate limiter instance
export const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per windowMs
});

// Helper function to get client IP
export function getClientIP(req: NextApiRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

// Apply rate limiting middleware
export function withRateLimit(limit: number = 100) {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const token = getClientIP(req);
      const isRateLimited = limiter.check(req, res, limit, token);

      if (isRateLimited) {
        return res.status(429).json({
          message: 'Too many requests, please try again later.',
        });
      }

      return handler(req, res);
    };
  };
}