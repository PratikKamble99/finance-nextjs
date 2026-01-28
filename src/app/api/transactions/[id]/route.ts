import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { apiRateLimit } from '@/lib/rate-limit'
import { TransactionService } from '@/lib/services/transaction.service'
import { ApiResponse } from '@/types'
import { Transaction } from '../../../../../prisma/generated/prisma/client'

async function handleGET(request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { id } = await params
    const transaction = await TransactionService.findById(id)
    
    if (!transaction) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Transaction not found'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    // Check if user owns this transaction
    if (transaction.userId !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 })
    }

    return NextResponse.json<ApiResponse<Transaction>>({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get transaction error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch transaction'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function handlePUT(request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { id } = await params
    // Check if transaction exists and user owns it
    const existingTransaction = await TransactionService.findById(id)
    if (!existingTransaction) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Transaction not found'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    if (existingTransaction.userId !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 })
    }

    const body = await request.json()
    const transaction = await TransactionService.update(id, body)

    if (!transaction) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Transaction not found after update'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse<typeof transaction>>({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Update transaction error:', error)
    
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
        message: 'Failed to update transaction'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function handleDELETE(request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { id } = await params
    // Check if transaction exists and user owns it
    const existingTransaction = await TransactionService.findById(id)
    if (!existingTransaction) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Transaction not found'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    if (existingTransaction.userId !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 })
    }

    await TransactionService.delete(id)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Transaction deleted successfully' },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Delete transaction error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete transaction'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const GET = apiRateLimit(withAuth(handleGET))
export const PUT = apiRateLimit(withAuth(handlePUT))
export const DELETE = apiRateLimit(withAuth(handleDELETE))