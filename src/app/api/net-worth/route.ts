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

    const netWorthSnapshot = await NetWorthService.calculateCurrentNetWorth(user.userId)

    return NextResponse.json<ApiResponse<typeof netWorthSnapshot>>({
      success: true,
      data: netWorthSnapshot,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get net worth error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to calculate net worth'
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

    // Save a net worth snapshot
    const snapshot = await NetWorthService.saveNetWorthSnapshot(user.userId)

    return NextResponse.json<ApiResponse<typeof snapshot>>({
      success: true,
      data: snapshot,
      timestamp: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Save net worth snapshot error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save net worth snapshot'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const GET = apiRateLimit(withAuth(handleGET))
export const POST = apiRateLimit(withAuth(handlePOST))