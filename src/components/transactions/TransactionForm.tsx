'use client'

import { useState, useEffect } from 'react'
import { TransactionType, PaymentMode, CreateTransactionRequest } from '@/types'
import ReceiptUpload from './ReceiptUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, DollarSign, Calendar, FileText, Tag, CreditCard, Store } from 'lucide-react'
import { useSimpleTransactionForm } from '@/hooks/useSimpleTransactionForm'
import { createTransaction } from '@/lib/actions/transaction-actions'

interface TransactionFormProps {
  onSubmit: (success: boolean, message?: string) => void
  onCancel: () => void
  initialData?: Partial<CreateTransactionRequest>
  isLoading?: boolean
}

export default function TransactionForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  isLoading: externalLoading = false 
}: TransactionFormProps) {
  const {
    categories,
    accounts,
    isLoadingAccounts,
    isLoadingCategories,
    error: formError,
    loadCategories
  } = useSimpleTransactionForm()

  const [formData, setFormData] = useState<CreateTransactionRequest>({
    type: 'EXPENSE',
    amount: 0,
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
    tags: [],
    accountId: '',
    paymentMode: 'CARD',
    merchant: '',
    receiptUrl: '',
    isRecurring: false,
    ...initialData
  })

  const [newTag, setNewTag] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load categories when transaction type changes
  useEffect(() => {
    if (formData.type === 'INCOME' || formData.type === 'EXPENSE') {
      loadCategories(formData.type)
    }
  }, [formData.type, loadCategories])

  // Set form error from hook
  useEffect(() => {
    if (formError) {
      setErrors(prev => ({ ...prev, general: formError }))
    }
  }, [formError])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required'
    }

    // Validate date is not in the future (optional business rule)
    const selectedDate = new Date(formData.date)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    
    if (selectedDate > today) {
      newErrors.date = 'Transaction date cannot be in the future'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({})
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      // Create FormData for server action
      const formDataToSubmit = new FormData()
      formDataToSubmit.append('type', formData.type)
      formDataToSubmit.append('amount', formData.amount.toString())
      formDataToSubmit.append('currency', formData.currency)
      formDataToSubmit.append('date', new Date(formData.date).toISOString())
      formDataToSubmit.append('description', formData.description || '')
      
      if (formData.categoryId) {
        formDataToSubmit.append('categoryId', formData.categoryId)
      }
      if (formData.accountId) {
        formDataToSubmit.append('accountId', formData.accountId)
      }
      if (formData.paymentMode) {
        formDataToSubmit.append('paymentMode', formData.paymentMode)
      }
      if (formData.merchant) {
        formDataToSubmit.append('merchant', formData.merchant)
      }
      if (formData.receiptUrl) {
        formDataToSubmit.append('receiptUrl', formData.receiptUrl)
      }
      
      formDataToSubmit.append('tags', JSON.stringify(formData.tags || []))
      formDataToSubmit.append('isRecurring', (formData.isRecurring || false).toString())

      // TODO: Handle receipt upload
      // For now, we'll skip receipt upload functionality

      const result = await createTransaction(formDataToSubmit)
      
      if (result.success) {
        onSubmit(true, 'Transaction created successfully!')
      } else {
        onSubmit(false, result.error || 'Failed to create transaction')
      }
    } catch (error) {
      console.error('Error submitting transaction:', error)
      onSubmit(false, error instanceof Error ? error.message : 'Failed to save transaction. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({ ...prev, type, categoryId: '' })) // Clear category when type changes
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  if (isLoadingAccounts) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading form data...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error Message */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-800">{errors.general}</div>
        </div>
      )}

      {/* Transaction Type */}
      <div className="space-y-3">
        <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
          Transaction Type *
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {(['INCOME', 'EXPENSE', 'TRANSFER'] as TransactionType[]).map((type) => (
            <label key={type} className="relative">
              <input
                type="radio"
                name="type"
                value={type}
                checked={formData.type === type}
                onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
                className="sr-only"
              />
              <div className={`
                flex items-center justify-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-all
                ${formData.type === type 
                  ? type === 'INCOME' 
                    ? 'border-green-500 bg-green-100 text-green-800 shadow-sm' 
                    : type === 'EXPENSE'
                    ? 'border-red-500 bg-red-100 text-red-800 shadow-sm'
                    : 'border-blue-500 bg-blue-100 text-blue-800 shadow-sm'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }
              `}>
                <span className="font-medium text-sm">
                  {type === 'INCOME' && '💰'} 
                  {type === 'EXPENSE' && '💸'} 
                  {type === 'TRANSFER' && '🔄'} 
                  {' '}
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Amount and Currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="amount" className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <DollarSign className="h-4 w-4" />
            Amount *
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">$</span>
            </div>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              className={`pl-7 bg-white border-gray-300 ${errors.amount ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
          </div>
          {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency" className="text-gray-900 dark:text-gray-100">Currency</Label>
          <Select value={formData.currency} onValueChange={(value: string) => setFormData(prev => ({ ...prev, currency: value }))}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="INR">INR (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date" className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Calendar className="h-4 w-4" />
          Date *
        </Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          className={`bg-white border-gray-300 ${errors.date ? 'border-red-500' : ''}`}
        />
        {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <FileText className="h-4 w-4" />
          Description *
        </Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className={`bg-white border-gray-300 ${errors.description ? 'border-red-500' : ''}`}
          placeholder="Enter transaction description"
        />
        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* Category and Account */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-gray-900 dark:text-gray-100">Category</Label>
          <Select 
            value={formData.categoryId} 
            onValueChange={(value: string) => setFormData(prev => ({ ...prev, categoryId: value }))}
            disabled={isLoadingCategories}
          >
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select category"} />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCategories ? (
                <div className="p-2 text-sm text-gray-500 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No categories available</div>
              ) : (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="account" className="text-gray-900 dark:text-gray-100">Account</Label>
          <Select value={formData.accountId} onValueChange={(value: string) => setFormData(prev => ({ ...prev, accountId: value }))}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payment Mode and Merchant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentMode" className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <CreditCard className="h-4 w-4" />
            Payment Mode
          </Label>
          <Select value={formData.paymentMode} onValueChange={(value: PaymentMode) => setFormData(prev => ({ ...prev, paymentMode: value }))}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Select payment mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">💵 Cash</SelectItem>
              <SelectItem value="CARD">💳 Card</SelectItem>
              <SelectItem value="UPI">📱 UPI</SelectItem>
              <SelectItem value="BANK">🏦 Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="merchant" className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Store className="h-4 w-4" />
            Merchant
          </Label>
          <Input
            id="merchant"
            value={formData.merchant}
            onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
            className="bg-white border-gray-300"
            placeholder="Store or merchant name"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Tag className="h-4 w-4" />
          Tags
        </Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags?.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
            >
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTag(tag)}
                className="ml-1 h-4 w-4 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-200"
              >
                ×
              </Button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white border-gray-300"
            placeholder="Add a tag"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Add
          </Button>
        </div>
      </div>

      {/* Receipt Upload */}
      <ReceiptUpload
        onFileSelect={setReceiptFile}
        existingReceiptUrl={formData.receiptUrl}
      />

      {/* Recurring Transaction */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="recurring"
          checked={formData.isRecurring}
          onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor="recurring" className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Recurring transaction
        </Label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || externalLoading}
          className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {(isSubmitting || externalLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {(isSubmitting || externalLoading) ? 'Saving...' : 'Save Transaction'}
        </Button>
      </div>
    </form>
  )
}