'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser, logoutUser, isLoggedIn, getUser, validateAuth } from '@/lib/auth-simple'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check auth on mount and validate with server
  useEffect(() => {
    const initAuth = async () => {
      if (isLoggedIn()) {
        const localUser = getUser()
        setUser(localUser)
        
        // Validate auth with server in background
        try {
          const isValid = await validateAuth()
          if (!isValid) {
            // Auth is invalid, logout user
            setUser(null)
            // Only redirect if we're on a protected route
            if (window.location.pathname.startsWith('/dashboard')) {
              router.push('/auth/login')
            }
          } else {
            // Update user with latest data from server
            setUser(getUser())
          }
        } catch (error) {
          console.warn('Auth validation error:', error)
          // Keep user logged in on network errors
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [router])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const userData = await loginUser(email, password)
      setUser(userData)
    } catch (error) {
      setUser(null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await logoutUser()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsLoading(false)
      // Redirect to login after logout
      router.push('/auth/login')
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}