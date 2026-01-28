import { hashPassword, verifyPassword, generateTokens, verifyAccessToken } from '@/lib/auth'

describe('Authentication Functions', () => {
  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testpassword123'
      const hashedPassword = await hashPassword(password)
      
      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(0)
    })

    it('should verify passwords correctly', async () => {
      const password = 'testpassword123'
      const hashedPassword = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)
      
      const isInvalid = await verifyPassword('wrongpassword', hashedPassword)
      expect(isInvalid).toBe(false)
    })
  })

  describe('JWT Token Generation', () => {
    it('should generate access and refresh tokens', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com'
      }
      
      const { accessToken, refreshToken } = generateTokens(payload)
      
      expect(accessToken).toBeDefined()
      expect(refreshToken).toBeDefined()
      expect(typeof accessToken).toBe('string')
      expect(typeof refreshToken).toBe('string')
    })

    it('should verify access tokens correctly', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com'
      }
      
      const { accessToken } = generateTokens(payload)
      const verifiedPayload = verifyAccessToken(accessToken)
      
      expect(verifiedPayload).toBeDefined()
      expect(verifiedPayload?.userId).toBe(payload.userId)
      expect(verifiedPayload?.email).toBe(payload.email)
    })

    it('should return null for invalid tokens', () => {
      const invalidToken = 'invalid.token.here'
      const verifiedPayload = verifyAccessToken(invalidToken)
      
      expect(verifiedPayload).toBeNull()
    })
  })
})