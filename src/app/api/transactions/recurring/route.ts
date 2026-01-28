import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { apiRateLimit } from '@/lib/rate-limit'
import { RecurringTransactionService } from '@/lib/services/recurring-transaction.service'
import { ApiResponse } from '@/types'

async function handleGET(request: AuthenticatedRequest) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const recurringTransactions = await RecurringTransactionService.getRecurringTransactions(user.userId)

    return NextResponse.json<ApiResponse<typeof recurringTransactions>>({
      success: true,
      data: recurringTransactions,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get recurring transactions error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch recurring transactions'
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
    const { transactionData, recurringPattern } = body

    // Validate required fields
    if (!transactionData || !recurringPattern) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Transaction data and recurring pattern are required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Validate recurring pattern
    const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly']
    if (!validFrequencies.includes(recurringPattern.frequency)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid frequency. Must be daily, weekly, monthly, or yearly'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    if (!recurringPattern.interval || recurringPattern.interval < 1) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Interval must be a positive number'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const transaction = await RecurringTransactionService.createRecurringTransaction(
      user.userId,
      transactionData,
      recurringPattern
    )

    return NextResponse.json<ApiResponse<typeof transaction>>({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Create recurring transaction error:', error)
    
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
        message: 'Failed to create recurring transaction'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const GET = apiRateLimit(withAuth(handleGET))
export const POST = apiRateLimit(withAuth(handlePOST))