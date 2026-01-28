'use client'

import { useState, useEffect } from 'react'
import { getAccounts } from '@/lib/actions/account-actions'
import type { Account } from '@/types'

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const result = await getAccounts()
      
      if (result.success && result.data) {
        setAccounts(result.data)
      } else {
        setError(result.error || 'Failed to load accounts')
      }
    } catch (err) {
      console.error('Error loading accounts:', err)
      setError('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  return {
    accounts,
    isLoading,
    error,
    refetch: loadAccounts
  }
}