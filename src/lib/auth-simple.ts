// Super simple auth - just check if user is logged in

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  const userStr = localStorage.getItem('user')
  if (!userStr) return false
  
  try {
    const user = JSON.parse(userStr)
    // Basic validation - check if user object has required fields
    return !!(user && user.id && user.email)
  } catch {
    // If parsing fails, clear invalid data
    localStorage.removeItem('user')
    return false
  }
}

export function getUser() {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  
  try {
    const user = JSON.parse(userStr)
    // Validate user object
    if (user && user.id && user.email) {
      return user
    } else {
      // Clear invalid user data
      localStorage.removeItem('user')
      return null
    }
  } catch {
    // Clear corrupted data
    localStorage.removeItem('user')
    return null
  }
}

export function setUser(user: any) {
  if (typeof window === 'undefined') return
  // Validate user object before storing
  if (user && user.id && user.email) {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

export function clearUser() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('user')
}

export async function loginUser(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Login failed')
  }

  const data = await response.json()
  if (data.success && data.data) {
    const user = {
      id: data.data.user.id,
      email: data.data.user.email,
      name: data.data.user.name
    }
    setUser(user)
    return user
  }

  throw new Error('Invalid login response')
}

export async function logoutUser() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch (error) {
    console.warn('Logout API failed:', error)
  }
  clearUser()
}

// Check if authentication is valid by making a test API call
export async function validateAuth(): Promise<boolean> {
  if (!isLoggedIn()) {
    return false
  }

  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data) {
        // Update user data if needed
        const currentUser = getUser()
        const serverUser = {
          id: data.data.id,
          email: data.data.email,
          name: data.data.name
        }
        
        // Update local storage if server data is different
        if (!currentUser || JSON.stringify(currentUser) !== JSON.stringify(serverUser)) {
          setUser(serverUser)
        }
        
        return true
      }
    }
    
    // If API call fails, clear invalid auth
    clearUser()
    return false
  } catch (error) {
    console.warn('Auth validation failed:', error)
    // Return true on network errors to keep user logged in (optimistic).
    // The user will be logged out on the next successful server response if invalid.
    return true
  }
}