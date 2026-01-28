/**
 * Authentication integration tests
 * Tests the complete authentication flow with simple auth functions
 */

import { loginUser, logoutUser, isLoggedIn, getUser, setUser, clearUser } from '@/lib/auth-simple'
import { generateTokens, verifyAccessToken } from '@/lib/auth'

// Mock fetch for testing
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock as any

describe('Simple Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('User Storage', () => {
    it('should store user correctly', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }

      setUser(user)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(user))
    })

    it('should retrieve user correctly', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(user))

      const retrievedUser = getUser()

      expect(retrievedUser).toEqual(user)
    })

    it('should clear user correctly', () => {
      clearUser()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
    })

    it('should check login status', () => {
      // Test with no user
      localStorageMock.getItem.mockReturnValue(null)
      expect(isLoggedIn()).toBe(false)

      // Test with user
      localStorageMock.getItem.mockReturnValue('{"id":"test"}')
      expect(isLoggedIn()).toBe(true)
    })
  })

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User'
            }
          }
        })
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const user = await loginUser('test@example.com', 'password')

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' })
      })

      expect(user).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(user))
    })

    it('should handle login errors', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({
          error: {
            message: 'Invalid credentials'
          }
        })
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      await expect(loginUser('test@example.com', 'wrong-password'))
        .rejects.toThrow('Invalid credentials')
    })

    it('should handle logout', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true })
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      await logoutUser()

      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST'
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
    })
  })

  describe('Token Management', () => {
    it('should generate and verify tokens', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com'
      }

      const { accessToken, refreshToken } = generateTokens(payload)

      expect(accessToken).toBeDefined()
      expect(refreshToken).toBeDefined()

      const verifiedPayload = verifyAccessToken(accessToken)
      expect(verifiedPayload).toMatchObject(payload)
    })

    it('should handle invalid tokens', () => {
      const invalidToken = 'invalid.token.here'
      const verifiedPayload = verifyAccessToken(invalidToken)
      expect(verifiedPayload).toBeNull()
    })
  })
})