import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { uploadRateLimit } from '@/lib/rate-limit'
import { FileUploadService } from '@/lib/services/file-upload.service'
import { ApiResponse } from '@/types'

async function handlePOST(request: AuthenticatedRequest) {
  try {
    const { user } = request
    if (!user) {
      throw new Error('User not authenticated')
    }

    const formData = await request.formData()
    const file = formData.get('receipt') as File

    if (!file) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file provided'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Validate file
    const validation = FileUploadService.validateFile(file)
    if (!validation.isValid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error!
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Upload file
    const fileUrl = await FileUploadService.uploadReceipt(file, user.userId)

    return NextResponse.json<ApiResponse<{ url: string }>>({
      success: true,
      data: { url: fileUrl },
      timestamp: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Receipt upload error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error.message
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to upload receipt'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const POST = uploadRateLimit(withAuth(handlePOST))