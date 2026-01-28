'use client'

import { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Transaction, TransactionType } from '@/types'
import LoadingSpinner from '../ui/LoadingSpinner'

interface TransactionListProps {
  onEdit: (transaction: Transaction) => void
  onDelete: (transactionId: string) => void
  refreshTrigger?: number
}

interface FilterState {
  search: string
  type: TransactionType | 'ALL'
  category: string
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
}

export default function TransactionList({ onEdit, onDelete, refreshTrigger }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'ALL',
    category: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  })

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.data?.transactions || [])
      } else {
        console.error('Failed to load transactions:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      } else {
        console.error('Failed to load categories:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }, [])

  useEffect(() => {
    loadTransactions()
    loadCategories()
  }, [loadTransactions, loadCategories, refreshTrigger])

  useEffect(() => {
    applyFilters()
  }, [transactions, filters])

  const applyFilters = useCallback(() => {
    let filtered = [...transactions]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(transaction =>
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.merchant?.toLowerCase().includes(searchLower)
      )
    }

    // Type filter
    if (filters.type !== 'ALL') {
      filtered = filtered.filter(transaction => transaction.type === filters.type)
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(transaction => transaction.categoryId === filters.category)
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.date) >= new Date(filters.dateFrom)
      )
    }
    if (filters.dateTo) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.date) <= new Date(filters.dateTo)
      )
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(transaction => 
        Number(transaction.amount) >= Number(filters.minAmount)
      )
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(transaction => 
        Number(transaction.amount) <= Number(filters.maxAmount)
      )
    }

    setFilteredTransactions(filtered)
  }, [transactions, filters])

  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'ALL',
      category: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'INCOME':
        return 'text-green-600 bg-green-50'
      case 'EXPENSE':
        return 'text-red-600 bg-red-50'
      case 'TRANSFER':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? `${category.icon} ${category.name}` : 'Uncategorized'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as TransactionType | 'ALL' }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-3 lg:col-span-1">
                <button
                  onClick={clearFilters}
                  className="w-full mt-6 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
            </h3>
            <p className="text-sm">
              {transactions.length === 0 
                ? 'Start tracking your finances by adding your first transaction'
                : 'Try adjusting your search criteria or clearing filters'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date.toString())}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        {transaction.merchant && (
                          <div className="text-gray-500 text-xs">{transaction.merchant}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCategoryName(transaction.categoryId || '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={transaction.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}>
                        {transaction.type === 'EXPENSE' ? '-' : '+'}
                        {formatAmount(Number(transaction.amount), transaction.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onEdit(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(
                  filteredTransactions
                    .filter(t => t.type === 'INCOME')
                    .reduce((sum, t) => sum + Number(t.amount), 0),
                  'USD'
                )}
              </div>
              <div className="text-sm text-gray-500">Total Income</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {formatAmount(
                  filteredTransactions
                    .filter(t => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + Number(t.amount), 0),
                  'USD'
                )}
              </div>
              <div className="text-sm text-gray-500">Total Expenses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatAmount(
                  filteredTransactions
                    .filter(t => t.type === 'INCOME')
                    .reduce((sum, t) => sum + Number(t.amount), 0) -
                  filteredTransactions
                    .filter(t => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + Number(t.amount), 0),
                  'USD'
                )}
              </div>
              <div className="text-sm text-gray-500">Net Amount</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}