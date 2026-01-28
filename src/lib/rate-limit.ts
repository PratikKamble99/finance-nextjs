import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/types'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string // Custom key generator
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function rateLimit(config: RateLimitConfig) {
  return <T extends any[]>(handler: (req: NextRequest, ...args: T) => Promise<NextResponse>) => {
    return async (request: NextRequest, ...args: T) => {
      const now = Date.now()
      const key = config.keyGenerator ? config.keyGenerator(request) : getDefaultKey(request)
      
      let entry = rateLimitStore.get(key)
      
      if (!entry || now > entry.resetTime) {
        // Create new entry or reset expired entry
        entry = {
          count: 1,
          resetTime: now + config.windowMs
        }
        rateLimitStore.set(key, entry)
        return handler(request, ...args)
      }
      
      if (entry.count >= config.maxRequests) {
        // Rate limit exceeded
        const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000)
        
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Try again in ${resetTimeSeconds} seconds.`,
            details: {
              retryAfter: resetTimeSeconds,
              limit: config.maxRequests,
              windowMs: config.windowMs
            }
          },
          timestamp: new Date().toISOString()
        }, { 
          status: 429,
          headers: {
            'Retry-After': resetTimeSeconds.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString()
          }
        })
      }
      
      // Increment counter
      entry.count++
      rateLimitStore.set(key, entry)
      
      // Add rate limit headers to response
      const response = await handler(request, ...args)
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', (config.maxRequests - entry.count).toString())
      response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())
      
      return response
    }
  }
}

function getDefaultKey(request: NextRequest): string {
  // Use IP address as default key
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `rate_limit:${ip}`
}

// Predefined rate limit configurations
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyGenerator: (request) => {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    return `auth_rate_limit:${ip}`
  }
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
})

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 uploads per minute
})