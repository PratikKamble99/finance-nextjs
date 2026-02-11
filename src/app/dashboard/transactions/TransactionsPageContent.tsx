'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  X, 
  Check, 
  Calendar, 
  CreditCard, 
  Smartphone, 
  Landmark, 
  Banknote, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Tag,
  Store,
  Wallet,
  Edit3,
  Trash2,
  MoreHorizontal
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useSimpleTransactionForm } from '@/hooks/useSimpleTransactionForm'
import { useTransactionList } from '@/hooks/useTransactionList'
import { createTransaction, updateTransaction, deleteTransaction } from '@/lib/actions/transaction-actions'

type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'
type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK'

export default function TransactionsPageContent() {
  const searchParams = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  
  // Auto-open logic
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowForm(true)
    }
  }, [searchParams])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown) {
        const target = event.target as HTMLElement
        // Don't close if clicking inside the dropdown or on the dropdown button
        if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-button')) {
          setShowDropdown(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])
  
  const {
    accounts,
    categories,
    isLoadingAccounts,
    isLoadingCategories,
    error: formError,
    loadCategories
  } = useSimpleTransactionForm()

  const {
    transactions,
    isLoading: isLoadingTransactions,
    error: transactionError,
    totalCount,
    currentPage,
    totalPages,
    loadTransactions
  } = useTransactionList()

  const [formData, setFormData] = useState({
    type: 'EXPENSE' as TransactionType,
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
    accountId: '',
    paymentMode: 'CARD' as PaymentMode,
    merchant: '',
    tags: [] as string[],
    isRecurring: false
  })

  // Reset form when editing transaction changes
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: editingTransaction.amount.toString(),
        currency: editingTransaction.currency,
        date: new Date(editingTransaction.date).toISOString().split('T')[0],
        description: editingTransaction.description || '',
        categoryId: editingTransaction.categoryId || '',
        accountId: editingTransaction.accountId || '',
        paymentMode: editingTransaction.paymentMode || 'CARD',
        merchant: editingTransaction.merchant || '',
        tags: editingTransaction.tags?.map((t: any) => t.tag?.name || t.name || t) || [],
        isRecurring: editingTransaction.isRecurring || false
      })
    } else {
      setFormData({
        type: 'EXPENSE',
        amount: '',
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        description: '',
        categoryId: '',
        accountId: '',
        paymentMode: 'CARD',
        merchant: '',
        tags: [],
        isRecurring: false
      })
    }
  }, [editingTransaction])

  useEffect(() => {
    if (formData.type !== 'TRANSFER') {
      loadCategories(formData.type)
    }
  }, [formData.type, loadCategories])

  // UI Helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPaymentModeIcon = (mode?: string) => {
    switch (mode) {
      case 'CASH': return <Banknote className="w-4 h-4" />
      case 'CARD': return <CreditCard className="w-4 h-4" />
      case 'UPI': return <Smartphone className="w-4 h-4" />
      case 'BANK': return <Landmark className="w-4 h-4" />
      default: return <CreditCard className="w-4 h-4" />
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.amount || !formData.description) {
      setSubmitMessage({ type: 'error', text: 'Please fill in amount and description' })
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitMessage(null)

      const formDataToSubmit = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'tags') formDataToSubmit.append(key, JSON.stringify(value))
        else if (key === 'date') formDataToSubmit.append(key, new Date(value as string).toISOString())
        else formDataToSubmit.append(key, String(value))
      })

      let result
      if (editingTransaction) {
        result = await updateTransaction(editingTransaction.id, formDataToSubmit)
      } else {
        result = await createTransaction(formDataToSubmit)
      }
      
      if (result.success) {
        setSubmitMessage({ 
          type: 'success', 
          text: editingTransaction ? 'Transaction updated successfully!' : 'Transaction created successfully!' 
        })
        setFormData({
          type: 'EXPENSE',
          amount: '',
          currency: 'USD',
          date: new Date().toISOString().split('T')[0],
          description: '',
          categoryId: '',
          accountId: '',
          paymentMode: 'CARD',
          merchant: '',
          tags: [],
          isRecurring: false
        })
        setEditingTransaction(null)
        loadTransactions(currentPage)
        setTimeout(() => {
          setShowForm(false)
          setSubmitMessage(null)
        }, 1500)
      } else {
        setSubmitMessage({ type: 'error', text: result.error || 'Failed to save transaction' })
      }
    } catch (error) {
      console.error('Error submitting:', error)
      setSubmitMessage({ type: 'error', text: 'Failed to save transaction.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  console.log(showForm)

  const handleEdit = (transaction: any) => {
    if (showForm) {
      setShowForm(false)
      setTimeout(() => {
        setEditingTransaction(transaction)
        setShowForm(true)
        setShowDropdown(null)
        setSubmitMessage(null)
      }, 50)
    } else {
      setEditingTransaction(transaction)
      setShowForm(true)
      setShowDropdown(null)
      setSubmitMessage(null)
    }
  }

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      const result = await deleteTransaction(transactionId)
      if (result.success) {
        setSubmitMessage({ type: 'success', text: 'Transaction deleted successfully!' })
        loadTransactions(currentPage)
        setTimeout(() => setSubmitMessage(null), 3000)
      } else {
        setSubmitMessage({ type: 'error', text: result.error || 'Failed to delete transaction' })
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      setSubmitMessage({ type: 'error', text: 'Failed to delete transaction.' })
    }
    setShowDropdown(null)
  }

  const handleCancelEdit = () => {
    setEditingTransaction(null)
    setShowForm(false)
    setSubmitMessage(null)
  }


  console.log(showDropdown)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Transactions</h1>
            <p className="text-slate-400 text-sm">Monitor your cash flow and expenses.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button
              onClick={() => {
                if (showForm) {
                  // Close the form
                  setShowForm(false)
                  setEditingTransaction(null)
                  setSubmitMessage(null)
                } else {
                  // Open form in add mode
                  setEditingTransaction(null)
                  setShowForm(true)
                  setSubmitMessage(null)
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all text-sm font-semibold"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Close' : 'New Entry'}
            </button>
          </div>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {submitMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                submitMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {submitMessage.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              <span className="text-sm font-medium">{submitMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm mb-8">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  {editingTransaction ? (
                    <>
                      <Edit3 className="w-5 h-5 text-indigo-400" />
                      Edit Transaction
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-indigo-400" />
                      Add Transaction
                    </>
                  )}
                </h3>
                
                {editingTransaction && (
                  <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <p className="text-sm text-indigo-300">
                      Editing: <span className="font-medium">{editingTransaction.description}</span>
                      {' '}({formatCurrency(editingTransaction.amount)})
                    </p>
                  </div>
                )}
                
                {isLoadingAccounts && (
                  <div className="mb-4 flex items-center gap-2 text-indigo-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing account data...
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Type Selector */}
                  <div className="grid grid-cols-3 gap-3">
                    {(['INCOME', 'EXPENSE', 'TRANSFER'] as TransactionType[]).map((type) => (
                      <label key={type} className="relative cursor-pointer group">
                        <input
                          type="radio"
                          name="type"
                          value={type}
                          checked={formData.type === type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as TransactionType, categoryId: '' }))}
                          className="sr-only"
                        />
                        <div className={`
                          flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                          ${formData.type === type 
                            ? type === 'INCOME' 
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]' 
                              : type === 'EXPENSE'
                              ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]'
                              : 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                          }
                        `}>
                          {type === 'INCOME' && <ArrowUpRight className="w-5 h-5 mb-1" />}
                          {type === 'EXPENSE' && <ArrowDownRight className="w-5 h-5 mb-1" />}
                          {type === 'TRANSFER' && <ArrowRightLeft className="w-5 h-5 mb-1" />}
                          <span className="text-xs font-bold tracking-wider">{type}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Amount */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Amount</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          $
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                          className="block w-full pl-7 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Date</label>
                      <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium text-slate-400 ml-1">Description</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        placeholder="What was this for?"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Category</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <Tag className="w-4 h-4" />
                        </div>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                          disabled={isLoadingCategories}
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                        >
                          <option value="" className="text-slate-500">
                            {isLoadingCategories ? 'Loading...' : 'Select Category'}
                          </option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                         <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                         </div>
                      </div>
                    </div>

                    {/* Account */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Account</label>
                       <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <select
                          value={formData.accountId}
                          onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                        >
                          <option value="">Select Account</option>
                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                        </div>
                      </div>
                    </div>

                    {/* Merchant (Optional) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Merchant (Optional)</label>
                      <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <Store className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={formData.merchant}
                          onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                          placeholder="e.g. Starbucks"
                        />
                      </div>
                    </div>
                     {/* Payment Mode */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Payment Mode</label>
                      <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                           {getPaymentModeIcon(formData.paymentMode)}
                        </div>
                        <select
                          value={formData.paymentMode}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value as PaymentMode }))}
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                        >
                          <option value="CASH">Cash</option>
                          <option value="CARD">Card</option>
                          <option value="UPI">UPI / Digital</option>
                          <option value="BANK">Bank Transfer</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={editingTransaction ? handleCancelEdit : () => setShowForm(false)}
                      className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isLoadingAccounts}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 text-sm"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {isSubmitting ? 'Saving...' : editingTransaction ? 'Update Transaction' : 'Save Transaction'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction List Container */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm flex flex-col min-h-[500px]">
          
          {/* List Header */}
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-white">Recent Activity</h3>
            <span className="text-xs text-slate-500 bg-slate-950 border border-slate-800 px-2 py-1 rounded-md">
              {totalCount} Entries
            </span>
          </div>

          {/* List Content */}
          <div className="flex-1 p-2">
            {isLoadingTransactions ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p>Loading records...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <Banknote className="w-8 h-8 opacity-50" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-slate-300">No transactions yet</p>
                  <p className="text-sm">Record your first income or expense above.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.map((t) => (
                  <div key={t.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700/50">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Icon */}
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center border shrink-0
                        ${t.type === 'INCOME' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : ''}
                        ${t.type === 'EXPENSE' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : ''}
                        ${t.type === 'TRANSFER' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : ''}
                      `}>
                         {t.type === 'INCOME' && <ArrowUpRight className="w-5 h-5" />}
                         {t.type === 'EXPENSE' && <ArrowDownRight className="w-5 h-5" />}
                         {t.type === 'TRANSFER' && <ArrowRightLeft className="w-5 h-5" />}
                      </div>
                      
                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-200 truncate">{t.description}</p>
                          {t.merchant && (
                            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                              {t.merchant}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          {t.category && <span>{t.category.name}</span>}
                          <span>•</span>
                          <span>{formatDate(t.date)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline flex items-center gap-1">
                            {getPaymentModeIcon(t.paymentMode)} {t.paymentMode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount and Actions */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`block font-semibold ${
                          t.type === 'INCOME' ? 'text-emerald-400' : 
                          t.type === 'EXPENSE' ? 'text-slate-200' : 'text-blue-400'
                        }`}>
                          {t.type === 'EXPENSE' ? '-' : '+'}
                          {formatCurrency(t.amount)}
                        </span>
                        {t.account && (
                          <span className="text-xs text-slate-500">{t.account.name}</span>
                        )}
                      </div>

                      {/* Actions Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === t.id ? null : t.id)}
                          className="dropdown-button opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {showDropdown === t.id && (
                          <div className="dropdown-menu absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
                              onClick={() => handleEdit(t)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors rounded-t-lg"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-b-lg"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => loadTransactions(currentPage - 1)}
                disabled={currentPage <= 1 || isLoadingTransactions}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent text-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              
              <span className="text-sm text-slate-500">
                Page <span className="text-slate-200 font-medium">{currentPage}</span> of {totalPages}
              </span>

              <button
                onClick={() => loadTransactions(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoadingTransactions}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent text-sm transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}