import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, JWTPayload } from './auth'
import { ApiResponse } from '@/types'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

// Overloaded function signatures for withAuth
export function withAuth<T extends any[]>(
  handler: (req: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
): (request: NextRequest, ...args: T) => Promise<NextResponse>

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse>

export function withAuth(handler: any) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: 'Authorization header is required'
          },
          timestamp: new Date().toISOString()
        }, { status: 401 })
      }

      const token = authHeader.substring(7) // Remove 'Bearer ' prefix
      const payload = verifyAccessToken(token)

      if (!payload) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: 'Invalid or expired token'
          },
          timestamp: new Date().toISOString()
        }, { status: 401 })
      }

      // Add user to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = payload

      return handler(authenticatedRequest, ...args)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Authentication error'
        },
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  }
}