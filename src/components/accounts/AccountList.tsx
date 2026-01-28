'use client'

import { useState, useEffect } from 'react'
import { PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { Account, AccountType } from '@/types'
import LoadingSpinner from '../ui/LoadingSpinner'

interface AccountListProps {
  onEdit: (account: Account) => void
  onDelete: (accountId: string) => void
  refreshTrigger?: number
}

export default function AccountList({ onEdit, onDelete, refreshTrigger }: AccountListProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [refreshTrigger])

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data.data || [])
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case 'SAVINGS':
        return '🏦'
      case 'SALARY':
        return '💰'
      case 'CURRENT':
        return '🏢'
      case 'CASH':
        return '💵'
      default:
        return '🏦'
    }
  }

  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case 'SAVINGS':
        return 'bg-green-100 text-green-800'
      case 'SALARY':
        return 'bg-blue-100 text-blue-800'
      case 'CURRENT':
        return 'bg-purple-100 text-purple-800'
      case 'CASH':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBalanceColor = (balance: number, threshold: number) => {
    if (balance < 0) return 'text-red-600'
    if (threshold > 0 && balance <= threshold) return 'text-orange-600'
    return 'text-green-600'
  }

  const filteredAccounts = showInactive 
    ? accounts 
    : accounts.filter(account => account.isActive)

  const totalBalance = filteredAccounts.reduce((sum, account) => {
    // Convert to USD for total (simplified - in real app, use exchange rates)
    return sum + Number(account.currentBalance)
  }, 0)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-3xl">💰</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(totalBalance, 'USD')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-3xl">🏦</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Accounts</p>
              <p className="text-2xl font-bold text-gray-900">
                {accounts.filter(a => a.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-3xl">⚠️</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Balance Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {accounts.filter(a => 
                  a.isActive && 
                  a.lowBalanceThreshold && 
                  Number(a.currentBalance) <= Number(a.lowBalanceThreshold)
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show inactive accounts</span>
          </label>
        </div>
      </div>

      {/* Account List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🏦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {accounts.length === 0 ? 'No accounts yet' : 'No active accounts'}
            </h3>
            <p className="text-sm">
              {accounts.length === 0 
                ? 'Add your first account to start tracking balances'
                : 'All accounts are currently inactive'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Balance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getAccountTypeIcon(account.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{account.name}</div>
                          {account.accountNumber && (
                            <div className="text-sm text-gray-500">****{account.accountNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.type)}`}>
                        {account.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.bank || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className={`font-medium ${getBalanceColor(
                        Number(account.currentBalance), 
                        Number(account.lowBalanceThreshold)
                      )}`}>
                        {formatAmount(Number(account.currentBalance), account.currency)}
                      </div>
                      {account.lowBalanceThreshold && 
                       Number(account.currentBalance) <= Number(account.lowBalanceThreshold) && (
                        <div className="text-xs text-orange-600">Low balance</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        {account.isActive ? (
                          <EyeIcon className="h-5 w-5 text-green-500" title="Active" />
                        ) : (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" title="Inactive" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onEdit(account)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit account"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(account.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete account"
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

      {/* Low Balance Alerts */}
      {accounts.some(a => 
        a.isActive && 
        a.lowBalanceThreshold && 
        Number(a.currentBalance) <= Number(a.lowBalanceThreshold)
      ) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-orange-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Low Balance Alerts
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <ul className="list-disc list-inside space-y-1">
                  {accounts
                    .filter(a => 
                      a.isActive && 
                      a.lowBalanceThreshold && 
                      Number(a.currentBalance) <= Number(a.lowBalanceThreshold)
                    )
                    .map(account => (
                      <li key={account.id}>
                        <strong>{account.name}</strong>: {formatAmount(Number(account.currentBalance), account.currency)} 
                        (threshold: {formatAmount(Number(account.lowBalanceThreshold), account.currency)})
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}