import { useState, useEffect, useCallback } from 'react'
import { getAccountsForForm, getCategoriesForForm } from '@/lib/actions/dashboard-actions'

interface Account {
  id: string
  name: string
  type: string
}

interface Category {
  id: string
  name: string
  icon: string
}

interface UseSimpleTransactionFormReturn {
  accounts: Account[]
  categories: Category[]
  isLoadingAccounts: boolean
  isLoadingCategories: boolean
  error: string | null
  loadCategories: (type: 'INCOME' | 'EXPENSE') => void
}

export function useSimpleTransactionForm(): UseSimpleTransactionFormReturn {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load accounts once on mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoadingAccounts(true)
        const result = await getAccountsForForm()
        
        if (result.success && result.data) {
          setAccounts(result.data)
        } else {
          setError(result.error || 'Failed to load accounts')
        }
      } catch (error) {
        console.error('Error loading accounts:', error)
        setError('Failed to load accounts')
      } finally {
        setIsLoadingAccounts(false)
      }
    }

    loadAccounts()
  }, [])

  const loadCategories = useCallback(async (type: 'INCOME' | 'EXPENSE') => {
    try {
      setIsLoadingCategories(true)
      setError(null)
      
      const result = await getCategoriesForForm(type)
      
      if (result.success && result.data) {
        setCategories(result.data)
      } else {
        setError(result.error || 'Failed to load categories')
        setCategories([])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      setError('Failed to load categories')
      setCategories([])
    } finally {
      setIsLoadingCategories(false)
    }
  }, [])

  return {
    accounts,
    categories,
    isLoadingAccounts,
    isLoadingCategories,
    error,
    loadCategories
  }
}