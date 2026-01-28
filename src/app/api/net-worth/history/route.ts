import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { apiRateLimit } from '@/lib/rate-limit'
import { NetWorthService } from '@/lib/services/net-worth.service'
import { ApiResponse } from '@/types'

async function handleGET(request: AuthenticatedRequest) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') as 'monthly' | 'quarterly' | 'yearly' || 'monthly'
    const limit = parseInt(searchParams.get('limit') || '12')

    if (!['monthly', 'quarterly', 'yearly'].includes(period)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Period must be monthly, quarterly, or yearly'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    if (limit < 1 || limit > 60) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Limit must be between 1 and 60'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const history = await NetWorthService.getNetWorthHistory(user.userId, period, limit)

    return NextResponse.json<ApiResponse<typeof history>>({
      success: true,
      data: history,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get net worth history error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch net worth history'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const GET = apiRateLimit(withAuth(handleGET))