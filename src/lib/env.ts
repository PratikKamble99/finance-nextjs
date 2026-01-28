// Environment variable loader and validator for Next.js
// Next.js automatically loads .env files, so we don't need dotenv

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NEXTAUTH_SECRET'
]

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars)
  console.error('Please check your .env file and ensure all required variables are set')
}

// Export environment variables with defaults
export const env = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'fallback-nextauth-secret-change-in-production',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  CRON_SECRET_TOKEN: process.env.CRON_SECRET_TOKEN || 'fallback-cron-token-change-in-production',
  NODE_ENV: process.env.NODE_ENV || 'development'
}

// Validate critical environment variables
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required but not set in environment variables')
}

export default env