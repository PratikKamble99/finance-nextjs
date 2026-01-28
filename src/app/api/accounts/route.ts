import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { apiRateLimit } from '@/lib/rate-limit'
import { AccountService } from '@/lib/services/account.service'
import { ApiResponse } from '@/types'

async function handleGET(request: AuthenticatedRequest) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const accounts = await AccountService.findByUserId(user.userId, includeInactive)

    return NextResponse.json<ApiResponse<typeof accounts>>({
      success: true,
      data: accounts,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get accounts error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch accounts'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function handlePOST(request: AuthenticatedRequest) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const body = await request.json()

    const account = await AccountService.create(user.userId, body)

    return NextResponse.json<ApiResponse<typeof account>>({
      success: true,
      data: account,
      timestamp: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Create account error:', error)
    
    if (error instanceof Error && error.message.includes('Validation error')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create account'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const GET = apiRateLimit(withAuth(handleGET))
export const POST = apiRateLimit(withAuth(handlePOST))