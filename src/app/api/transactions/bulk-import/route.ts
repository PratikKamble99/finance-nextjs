import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { uploadRateLimit } from '@/lib/rate-limit'
import { CSVImportService } from '@/lib/services/csv-import.service'
import { AccountService } from '@/lib/services/account.service'
import { ApiResponse } from '@/types'

async function handlePOST(request: AuthenticatedRequest) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const formData = await request.formData()
    const file = formData.get('csvFile') as File
    const accountId = formData.get('accountId') as string
    const currency = formData.get('currency') as string || 'USD'

    if (!file) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'CSV file is required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    if (!accountId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Account ID is required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Only CSV files are allowed'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File size must be less than 5MB'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Verify account belongs to user
    const account = await AccountService.findById(accountId)
    if (!account || account.userId !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Account not found or access denied'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    // Read and parse CSV file
    const csvContent = await file.text()
    const transactions = await CSVImportService.parseCSV(csvContent)

    if (transactions.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No valid transactions found in CSV file'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Import transactions
    const importResult = await CSVImportService.importTransactions(
      user.userId,
      accountId,
      transactions,
      currency
    )

    return NextResponse.json<ApiResponse<typeof importResult>>({
      success: true,
      data: importResult,
      timestamp: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('CSV import error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message: error.message
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to import CSV file'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function handleGET(request: AuthenticatedRequest) {
  try {
    // Return sample CSV format
    const sampleCSV = CSVImportService.generateSampleCSV()
    
    return new NextResponse(sampleCSV, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="sample-transactions.csv"'
      }
    })
  } catch (error) {
    console.error('Generate sample CSV error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate sample CSV'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const POST = uploadRateLimit(withAuth(handlePOST))
export const GET = withAuth(handleGET)