import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') || '/dashboard'
    const error = searchParams.get('error')

    if (error) {
      // Redirect to login with error
      return NextResponse.redirect(new URL(`/auth/login?error=${error}`, request.url))
    }

    if (!code) {
      // Redirect to login with error
      return NextResponse.redirect(new URL('/auth/login?error=missing_code', request.url))
    }

    // Exchange code for tokens by calling our own API
    const tokenResponse = await fetch(new URL('/api/auth/google', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url))
    }

    const authData = await tokenResponse.json()

    if (!authData.success) {
      return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url))
    }

    // Create response with redirect
    const response = NextResponse.redirect(new URL(state, request.url))
    
    // Set tokens as HTTP-only cookies
    response.cookies.set('accessToken', authData.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    })

    response.cookies.set('refreshToken', authData.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url))
  }
}