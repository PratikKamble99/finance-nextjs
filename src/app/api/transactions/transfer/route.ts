import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { apiRateLimit } from '@/lib/rate-limit'
import { TransactionService } from '@/lib/services/transaction.service'
import { ApiResponse } from '@/types'

async function handlePOST(request: AuthenticatedRequest) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const body = await request.json()
    const { fromAccountId, toAccountId, amount, description } = body

    // Validate required fields
    if (!fromAccountId || !toAccountId || !amount) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'From account, to account, and amount are required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot transfer to the same account'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Amount must be positive'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const result = await TransactionService.createTransfer(
      user.userId,
      fromAccountId,
      toAccountId,
      amount,
      description
    )

    return NextResponse.json<ApiResponse<typeof result>>({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Create transfer error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create transfer'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const POST = apiRateLimit(withAuth(handlePOST))