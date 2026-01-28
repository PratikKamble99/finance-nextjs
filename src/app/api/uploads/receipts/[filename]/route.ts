import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'

async function handleGET(
  request: AuthenticatedRequest, 
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { user } = request
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { filename } = await params
    const filepath = path.join(process.cwd(), 'uploads', 'receipts', filename)

    // Check if file exists
    if (!existsSync(filepath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Security check: ensure the file belongs to the authenticated user
    // The filename format is: userId_timestamp_random.ext
    const fileUserId = filename.split('_')[0]
    if (fileUserId !== user.userId) {
      return new NextResponse('Access denied', { status: 403 })
    }

    // Read and serve the file
    const fileBuffer = await readFile(filepath)
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase()
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    }
    
    const contentType = contentTypes[ext] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'Content-Disposition': `inline; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('File serving error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export const GET = withAuth(handleGET)