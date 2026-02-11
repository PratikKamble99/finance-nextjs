import { useState, useEffect, useCallback } from 'react'
import { getTransactions } from '@/lib/actions/transaction-actions'

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  currency: string
  description: string
  date: string
  merchant?: string
  paymentMode?: string
  category?: {
    name: string
    icon: string
  }
  account?: {
    name: string
  }
}

export function useTransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const loadTransactions = useCallback(async (page = 1) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getTransactions({
        page,
        limit: 10
      })

      if (result.success && result.data) {
        setTransactions(result.data.transactions || [])
        setTotalCount(result.data.totalCount || 0)
        setCurrentPage(page)
        setTotalPages(Math.ceil((result.data.totalCount || 0) / 10))
      } else {
        setError(result.error || 'Failed to load transactions')
        setTransactions([])
      }
    } catch (error) {
      console.error('Transaction list error:', error)
      setError('Failed to load transactions')
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load transactions once on mount
  useEffect(() => {
    loadTransactions(1)
  }, [loadTransactions])

  const refreshTransactions = useCallback(() => loadTransactions(currentPage), [loadTransactions, currentPage])

  return {
    transactions,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    loadTransactions,
    refreshTransactions
  }
}