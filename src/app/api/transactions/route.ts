import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { apiRateLimit } from '@/lib/rate-limit'
import { TransactionService } from '@/lib/services/transaction.service'
import { CreateTransactionRequest, ApiResponse } from '@/types'

async function handleGET(request: AuthenticatedRequest) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const category = searchParams.get('category') || undefined
    const type = searchParams.get('type') as any || undefined
    const accountId = searchParams.get('accountId') || undefined

    const result = await TransactionService.findByUserId(user.userId, {
      page,
      limit,
      startDate,
      endDate,
      category,
      type,
      accountId
    })

    return NextResponse.json<ApiResponse<typeof result>>({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch transactions'
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

    const body: CreateTransactionRequest = await request.json()

    const transaction = await TransactionService.create(user.userId, body)

    if (!transaction) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create transaction'
        },
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<typeof transaction>>({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Create transaction error:', error)
    
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
        message: 'Failed to create transaction'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const GET = apiRateLimit(withAuth(handleGET))
export const POST = apiRateLimit(withAuth(handlePOST))