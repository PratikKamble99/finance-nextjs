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

    const milestones = await NetWorthService.getNetWorthMilestones(user.userId)

    return NextResponse.json<ApiResponse<typeof milestones>>({
      success: true,
      data: milestones,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get net worth milestones error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch net worth milestones'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const GET = apiRateLimit(withAuth(handleGET))