import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, generateTokens } from '@/lib/auth'
import { authRateLimit } from '@/lib/rate-limit'
import { LoginRequest, ApiResponse, AuthResponse } from '@/types'
import { prisma } from '@/lib/db'

async function loginHandler(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
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
      refreshToken
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

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
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

export const POST = authRateLimit(loginHandler)