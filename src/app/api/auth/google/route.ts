import { NextRequest, NextResponse } from 'next/server'
import { generateTokens } from '@/lib/auth'
import { ApiResponse, AuthResponse } from '@/types'
import { prisma } from '@/lib/db'

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/google/callback`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, state } = body

    if (!code) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Authorization code is required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'EXTERNAL_SERVICE_ERROR',
          message: 'Failed to exchange authorization code'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'EXTERNAL_SERVICE_ERROR',
          message: 'Failed to fetch user information'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const googleUser = await userResponse.json()

    // Check if user exists or create new user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email }
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          // No password hash for OAuth users
        }
      })
    } else if (!user.googleId) {
      // Link existing user with Google account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.id }
      })
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

    return NextResponse.json<ApiResponse<AuthResponse>>({
      success: true,
      data: authResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Google OAuth error:', error)
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

// GET endpoint to initiate Google OAuth flow
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const returnUrl = searchParams.get('returnUrl') || '/dashboard'

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID!)
    googleAuthUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('state', returnUrl)

    return NextResponse.json<ApiResponse<{ authUrl: string }>>({
      success: true,
      data: { authUrl: googleAuthUrl.toString() },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Google OAuth initiation error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to initiate Google OAuth'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}