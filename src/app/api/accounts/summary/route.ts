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

    const summary = await AccountService.getAccountSummary(user.userId)

    return NextResponse.json<ApiResponse<typeof summary>>({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get account summary error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch account summary'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const GET = apiRateLimit(withAuth(handleGET))