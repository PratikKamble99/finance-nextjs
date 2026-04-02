import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { authRateLimit } from '@/lib/rate-limit'
import { ApiResponse } from '@/types'
import crypto from 'crypto'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

// POST /api/auth/reset-password — request a password reset email
async function requestResetHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' },
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { message: 'If an account with that email exists, a reset link has been sent.' },
        timestamp: new Date().toISOString(),
      })
    }

    // Delete any existing reset tokens for this user before issuing a new one
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    })

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`

    await sendPasswordResetEmail(user.email, resetLink)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'If an account with that email exists, a reset link has been sent.' },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

// PUT /api/auth/reset-password — verify token and set new password
async function resetPasswordHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Token and new password are required' },
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters long' },
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      // Clean up expired token if it exists
      if (resetRecord) {
        await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } })
      }
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'This reset link is invalid or has expired.' },
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    const passwordHash = await hashPassword(newPassword)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({ where: { id: resetRecord.id } }),
    ])

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Password has been reset successfully.' },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

export const POST = authRateLimit(requestResetHandler)
export const PUT = authRateLimit(resetPasswordHandler)
