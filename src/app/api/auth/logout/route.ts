import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/types'

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: new Date().toISOString()
    })

    // Clear HTTP-only cookies
    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
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