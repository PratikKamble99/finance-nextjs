import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { ApiResponse } from '@/types'
import { prisma } from '@/lib/db'

async function getUserHandler(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      token = request.cookies.get('accessToken')?.value
    }

    if (!token) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Access token is required'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // Verify token
    const payload = verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const GET = getUserHandler