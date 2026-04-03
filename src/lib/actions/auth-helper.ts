'use server'

import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/auth'

export async function getUserFromToken(): Promise<{ userId: string; email: string } | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    if (!accessToken) {
      return null
    }

    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return null
    }

    return { userId: payload.userId, email: payload.email }
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}
