'use client'

import { useState } from 'react'
import { 
  Wallet, 
  Layers, 
  DollarSign, 
  Landmark, 
  Hash, 
  FileText, 
  Loader2, 
  Check, 
  X,
  ChevronDown
} from 'lucide-react'
import { createNewAccount, updateExistingAccount } from '@/lib/actions/account-actions'

interface AccountFormProps {
  account?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export default function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!account

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      
      const result = isEditing 
        ? await updateExistingAccount(account.id, formData)
        : await createNewAccount(formData)

      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to save account')
      }
    } catch (err) {
      console.error('Error saving account:', err)
      setError('Failed to save account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Account Name */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
          Account Name <span className="text-indigo-400">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
            <Wallet className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={account?.name || ''}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            placeholder="e.g. Primary Checking"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Account Type */}
        <div className="space-y-1.5">
          <label htmlFor="type" className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
            Type <span className="text-indigo-400">*</span>
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
            <select
              id="type"
              name="type"
              required
              defaultValue={account?.type || ''}
              className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
            >
              <option value="" className="text-slate-500">Select Type</option>
              <option value="SAVINGS">Savings</option>
              <option value="SALARY">Salary</option>
              <option value="CURRENT">Current/Checking</option>
              <option value="CASH">Physical Cash</option>
              <option value="INVESTMENT">Investment</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Opening Balance (Only for new accounts) */}
        {!isEditing && (
          <div className="space-y-1.5">
            <label htmlFor="openingBalance" className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
              Opening Balance
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                id="openingBalance"
                name="openingBalance"
                step="0.01"
                defaultValue="0"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Bank Name */}
        <div className="space-y-1.5">
          <label htmlFor="bankName" className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
            Bank / Institution
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
              <Landmark className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="bankName"
              name="bankName"
              defaultValue={account?.bankName || ''}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              placeholder="e.g. Chase"
            />
          </div>
        </div>

        {/* Account Number */}
        <div className="space-y-1.5">
          <label htmlFor="accountNumber" className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
            Last 4 Digits
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              maxLength={4}
              defaultValue={account?.accountNumber || ''}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              placeholder="1234"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
          Description
        </label>
        <div className="relative group">
          <div className="absolute top-3 left-3 flex items-start pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
            <FileText className="w-4 h-4" />
          </div>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={account?.description || ''}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
            placeholder="Notes regarding this account..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 text-sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {isLoading ? 'Saving...' : (isEditing ? 'Update Account' : 'Create Account')}
        </button>
      </div>
    </form>
  )
}