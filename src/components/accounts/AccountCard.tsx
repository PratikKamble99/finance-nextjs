'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  Briefcase, 
  CreditCard, 
  Banknote, 
  Landmark, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Loader2,
  Calendar,
  Building2,
  Hash
} from 'lucide-react'
import { deleteExistingAccount } from '@/lib/actions/account-actions'

interface AccountCardProps {
  account: any
  onEdit?: (account: any) => void
  onDelete?: () => void
}

export default function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Style helper based on account type
  const getAccountStyle = (type: string) => {
    switch (type) {
      case 'SAVINGS': 
        return { icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
      case 'SALARY': 
        return { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
      case 'CURRENT': 
        return { icon: CreditCard, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' }
      case 'CASH': 
        return { icon: Banknote, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
      default: 
        return { icon: Landmark, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
    }
  }

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'SAVINGS': return 'Savings'
      case 'SALARY': return 'Salary'
      case 'CURRENT': return 'Current'
      case 'CASH': return 'Cash'
      default: return 'General'
    }
  }

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(balance)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteExistingAccount(account.id)
      if (result.success) {
        onDelete?.()
      } else {
        console.error('Failed to delete account:', result.error)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const style = getAccountStyle(account.type)
  const Icon = style.icon

  return (
    <div className="group relative bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-300 rounded-2xl p-6 backdrop-blur-sm">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${style.bg} ${style.border} group-hover:scale-110 transition-transform`}>
            <Icon className={`w-6 h-6 ${style.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg leading-tight">{account.name}</h3>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {getAccountTypeLabel(account.type)}
            </span>
          </div>
        </div>

        {/* Action Menu Button */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            onBlur={() => setTimeout(() => setShowMenu(false), 200)}
            className="p-2 -mr-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="absolute right-0 mt-2 w-36 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden z-10"
              >
                <button 
                  onClick={() => onEdit?.(account)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-white tracking-tight">
          {formatBalance(account.currentBalance)}
        </div>
        <p className="text-xs text-slate-500 mt-1">Available Balance</p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-slate-800 pt-4">
        
        {/* Bank Name */}
        {account.bankName && (
          <div className="flex items-center gap-2 text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-xs truncate max-w-[100px]">{account.bankName}</span>
          </div>
        )}

        {/* Account Number */}
        {account.accountNumber && (
          <div className="flex items-center gap-2 text-slate-400">
            <Hash className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-xs font-mono">•••• {account.accountNumber.slice(-4)}</span>
          </div>
        )}

        {/* Created Date */}
        <div className="flex items-center gap-2 text-slate-400 col-span-2">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-xs">
            Added {new Date(account.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal (In-Place Overlay) */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm rounded-2xl z-20 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="p-3 bg-rose-500/10 rounded-full mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h4 className="text-white font-semibold mb-1">Delete Account?</h4>
            <p className="text-slate-400 text-xs mb-6">
              Permanently delete "{account.name}"?
            </p>
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-500 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}