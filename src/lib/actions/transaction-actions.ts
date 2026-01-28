'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { verifyAccessToken } from '@/lib/auth'
import { 
  createTransaction as createTransactionService, 
  updateTransaction as updateTransactionService, 
  deleteTransaction as deleteTransactionService, 
  getUserTransactions 
} from '@/lib/services/transaction.service'
import { validateInput, createTransactionSchema } from '@/lib/validations'
import { serializeTransaction } from '@/lib/utils/serialization'

async function getUserFromToken(): Promise<{ userId: string } | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value
    
    if (!accessToken) {
      return null
    }

    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return null
    }

    return { userId: payload.userId }
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function createTransaction(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Extract form data with proper empty string handling
    const transactionData = {
      type: formData.get('type') as string,
      amount: parseFloat(formData.get('amount') as string),
      currency: formData.get('currency') as string,
      date: formData.get('date') as string,
      description: (formData.get('description') as string) || undefined,
      categoryId: (formData.get('categoryId') as string) || undefined,
      accountId: (formData.get('accountId') as string) || undefined,
      paymentMode: (formData.get('paymentMode') as string) || undefined,
      merchant: (formData.get('merchant') as string) || undefined,
      receiptUrl: (formData.get('receiptUrl') as string) || undefined,
      tags: JSON.parse(formData.get('tags') as string || '[]'),
      isRecurring: formData.get('isRecurring') === 'true'
    }

    // Validate the data
    const validatedData = validateInput(createTransactionSchema, transactionData)

    // Create the transaction
    const transaction = await createTransactionService(user.userId, validatedData)

    // Serialize the transaction data for client components
    const serializedTransaction = serializeTransaction(transaction)

    // Revalidate the dashboard and transactions pages
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/transactions')

    return {
      success: true,
      data: serializedTransaction
    }
  } catch (error) {
    console.error('Create transaction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create transaction'
    }
  }
}

export async function updateTransaction(id: string, formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Extract form data with proper empty string handling
    const transactionData = {
      type: formData.get('type') as string,
      amount: parseFloat(formData.get('amount') as string),
      currency: formData.get('currency') as string,
      date: formData.get('date') as string,
      description: (formData.get('description') as string) || undefined,
      categoryId: (formData.get('categoryId') as string) || undefined,
      accountId: (formData.get('accountId') as string) || undefined,
      paymentMode: (formData.get('paymentMode') as string) || undefined,
      merchant: (formData.get('merchant') as string) || undefined,
      receiptUrl: (formData.get('receiptUrl') as string) || undefined,
      tags: JSON.parse(formData.get('tags') as string || '[]'),
      isRecurring: formData.get('isRecurring') === 'true'
    }

    // Update the transaction
    const transaction = await updateTransactionService(id, transactionData)

    // Serialize the transaction data for client components
    const serializedTransaction = serializeTransaction(transaction)

    // Revalidate the dashboard and transactions pages
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/transactions')

    return {
      success: true,
      data: serializedTransaction
    }
  } catch (error) {
    console.error('Update transaction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update transaction'
    }
  }
}

export async function deleteTransaction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    await deleteTransactionService(id)

    // Revalidate the dashboard and transactions pages
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/transactions')

    return {
      success: true
    }
  } catch (error) {
    console.error('Delete transaction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete transaction'
    }
  }
}

export async function getTransactions(options: {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  category?: string
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  accountId?: string
} = {}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const result = await getUserTransactions(user.userId, options)

    // Serialize the result data for client components
    const serializedResult = {
      transactions: result.transactions ? result.transactions.map(serializeTransaction) : [],
      totalCount: result.total || 0,
      totalPages: Math.ceil((result.total || 0) / (options.limit || 10)),
      currentPage: options.page || 1
    }

    return {
      success: true,
      data: serializedResult
    }
  } catch (error) {
    console.error('Get transactions error:', error)
    return {
      success: false,
      error: 'Failed to load transactions'
    }
  }
}