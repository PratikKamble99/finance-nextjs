'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Wallet, 
  Landmark, 
  Layers, 
  Loader2, 
  AlertCircle 
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AccountCard from '@/components/accounts/AccountCard'
import AccountForm from '@/components/accounts/AccountForm'
import { useAccounts } from '@/hooks/useAccounts'
import type { Account } from '@/types'

export default function AccountsPage() {
  const { accounts, isLoading, error, refetch } = useAccounts()
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const handleAddAccount = () => {
    setEditingAccount(null)
    setShowForm(true)
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingAccount(null)
    refetch()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingAccount(null)
  }

  const handleAccountDeleted = () => {
    refetch()
  }

  const calculateTotalBalance = () => {
    return accounts.reduce((total, account) => {
      const balance = typeof account.currentBalance === 'object' 
        ? Number(account.currentBalance) 
        : (account.currentBalance || 0)
      return total + balance
    }, 0)
  }

  const getAccountsByType = () => {
    const grouped = accounts.reduce((acc, account) => {
      const type = account.type || 'OTHER'
      if (!acc[type]) acc[type] = []
      acc[type].push(account)
      return acc
    }, {} as Record<string, Account[]>)
    
    return grouped
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <span className="text-slate-400 font-medium">Syncing accounts...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Accounts</h1>
            <p className="text-slate-400 text-sm">Manage your bank accounts, wallets, and cards.</p>
          </div>
          <button
            onClick={handleAddAccount}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            Add Account
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Form Container (Collapsible) */}
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-white mb-6">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h3>
            <AccountForm
              account={editingAccount}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </motion.div>
        )}

        {/* Main Content */}
        {accounts.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Balance */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Wallet className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Liquidity</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(calculateTotalBalance())}
                  </p>
                </div>
              </div>

              {/* Account Count */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Landmark className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Active Accounts</p>
                  <p className="text-2xl font-bold text-white">{accounts.length}</p>
                </div>
              </div>

              {/* Types Count */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Account Types</p>
                  <p className="text-2xl font-bold text-white">
                    {Object.keys(getAccountsByType()).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={handleEditAccount}
                  onDelete={handleAccountDeleted}
                />
              ))}
            </div>
          </>
        ) : (
          !showForm && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                <Landmark className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No accounts connected</h3>
              <p className="text-slate-400 max-w-sm mb-8">
                Connect your first bank account, wallet, or cash stash to start tracking your net worth.
              </p>
              <button
                onClick={handleAddAccount}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all"
              >
                Add Your First Account
              </button>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}