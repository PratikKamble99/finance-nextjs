import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { apiRateLimit } from '@/lib/rate-limit'
import { AccountService } from '@/lib/services/account.service'
import { ApiResponse } from '@/types'

async function handleGET(request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { id } = await params
    const account = await AccountService.findById(id)
    
    if (!account) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Account not found'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    // Check if user owns this account
    if (account.userId !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 })
    }

    return NextResponse.json<ApiResponse<typeof account>>({
      success: true,
      data: account,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get account error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch account'
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
    // Check if account exists and user owns it
    const existingAccount = await AccountService.findById(id)
    if (!existingAccount) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Account not found'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    if (existingAccount.userId !== user.userId) {
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
    const account = await AccountService.update(id, body)

    return NextResponse.json<ApiResponse<typeof account>>({
      success: true,
      data: account,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Update account error:', error)
    
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
        message: 'Failed to update account'
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
    // Check if account exists and user owns it
    const existingAccount = await AccountService.findById(id)
    if (!existingAccount) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Account not found'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    if (existingAccount.userId !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 })
    }

    await AccountService.delete(id)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Account deactivated successfully' },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete account'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const GET = apiRateLimit(withAuth(handleGET))
export const PUT = apiRateLimit(withAuth(handlePUT))
export const DELETE = apiRateLimit(withAuth(handleDELETE))