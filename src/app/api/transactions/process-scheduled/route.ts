import { NextRequest, NextResponse } from 'next/server'
import { RecurringTransactionService } from '@/lib/services/recurring-transaction.service'
import { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (in production, you'd use proper authentication)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid cron secret'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    await RecurringTransactionService.processScheduledTransactions()

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Scheduled transactions processed successfully' },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Process scheduled transactions error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process scheduled transactions'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}