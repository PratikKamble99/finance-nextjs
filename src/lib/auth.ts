import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in production')
  }
  console.warn('WARNING: JWT secrets not set. Using insecure defaults for development only.')
}

const RESOLVED_JWT_SECRET = JWT_SECRET || 'dev-only-jwt-secret-do-not-use-in-prod'
const RESOLVED_JWT_REFRESH_SECRET = JWT_REFRESH_SECRET || 'dev-only-refresh-secret-do-not-use-in-prod'

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const generateTokens = (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  const accessToken = jwt.sign(payload, RESOLVED_JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign(payload, RESOLVED_JWT_REFRESH_SECRET, { expiresIn: '7d' })
  
  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, RESOLVED_JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, RESOLVED_JWT_REFRESH_SECRET) as JWTPayload
  } catch {
    return null
  }
}