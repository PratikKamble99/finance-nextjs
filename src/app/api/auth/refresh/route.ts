import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRefreshToken, generateTokens } from '@/lib/auth'
import { RefreshRequest, ApiResponse, AuthResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: RefreshRequest = await request.json()
    const { refreshToken } = body

    // Validate input
    if (!refreshToken) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid or expired refresh token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user.id,
      email: user.email
    })

    const authResponse: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      accessToken,
      refreshToken: newRefreshToken
    }

    // Create response with cookies
    const response = NextResponse.json<ApiResponse<AuthResponse>>({
      success: true,
      data: authResponse,
      timestamp: new Date().toISOString()
    })

    // Set HTTP-only cookies for server actions
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    })

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Token refresh error:', error)
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