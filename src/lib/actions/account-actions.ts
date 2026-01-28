'use server'

import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/auth'
import { getUserAccounts, createAccount, updateAccount, deleteAccount, getAccountById } from '@/lib/services/account.service'
import { serializeAccount } from '@/lib/utils/serialization'

async function getUserFromToken() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value

  if (!accessToken) {
    throw new Error('No access token found')
  }

  const payload = verifyAccessToken(accessToken)
  if (!payload) {
    throw new Error('Invalid access token')
  }

  return payload
}

export async function getAccounts(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const user = await getUserFromToken()
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const accounts = await getUserAccounts(user.userId)
    
    // Serialize accounts data for client components
    const serializedAccounts = accounts.map(serializeAccount)
    
    return {
      success: true,
      data: serializedAccounts
    }
  } catch (error) {
    console.error('Error loading accounts:', error)
    return {
      success: false,
      error: 'Failed to load accounts'
    }
  }
}

export async function getAccountDetails(accountId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getUserFromToken()
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const account = await getAccountById(accountId)
    
    if (!account || account.userId !== user.userId) {
      return {
        success: false,
        error: 'Account not found'
      }
    }
    
    // Serialize account data for client components
    const serializedAccount = serializeAccount(account)
    
    return {
      success: true,
      data: serializedAccount
    }
  } catch (error) {
    console.error('Error loading account details:', error)
    return {
      success: false,
      error: 'Failed to load account details'
    }
  }
}

export async function createNewAccount(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getUserFromToken()
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const accountData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      openingBalance: parseFloat(formData.get('openingBalance') as string) || 0,
      description: (formData.get('description') as string) || undefined,
      bankName: (formData.get('bankName') as string) || undefined,
      accountNumber: (formData.get('accountNumber') as string) || undefined,
    }

    const account = await createAccount(user.userId, accountData)
    
    // Serialize account data for client components
    const serializedAccount = serializeAccount(account)
    
    return {
      success: true,
      data: serializedAccount
    }
  } catch (error) {
    console.error('Error creating account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create account'
    }
  }
}

export async function updateExistingAccount(accountId: string, formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getUserFromToken()
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Verify account ownership
    const existingAccount = await getAccountById(accountId)
    if (!existingAccount || existingAccount.userId !== user.userId) {
      return {
        success: false,
        error: 'Account not found'
      }
    }

    const accountData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      description: (formData.get('description') as string) || undefined,
      bankName: (formData.get('bankName') as string) || undefined,
      accountNumber: (formData.get('accountNumber') as string) || undefined,
    }

    const account = await updateAccount(accountId, accountData)
    
    // Serialize account data for client components
    const serializedAccount = serializeAccount(account)
    
    return {
      success: true,
      data: serializedAccount
    }
  } catch (error) {
    console.error('Error updating account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update account'
    }
  }
}

export async function deleteExistingAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserFromToken()
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Verify account ownership
    const existingAccount = await getAccountById(accountId)
    if (!existingAccount || existingAccount.userId !== user.userId) {
      return {
        success: false,
        error: 'Account not found'
      }
    }

    await deleteAccount(accountId)
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Error deleting account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete account'
    }
  }
}