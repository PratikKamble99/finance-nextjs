import { prisma } from '@/lib/db'
import { AccountType } from '../../../prisma/generated/prisma/client'
import { validateInput, createAccountSchema, updateAccountSchema } from '@/lib/validations'

// Simple account functions without classes

export async function getAccountById(id: string) {
  return prisma.account.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { date: 'desc' },
        take: 10
      }
    }
  })
}

export async function getUserAccounts(userId: string, includeInactive = false) {
  return prisma.account.findMany({
    where: {
      userId,
      ...(includeInactive ? {} : { isActive: true })
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createAccount(userId: string, data: any) {
  const validatedData = validateInput(createAccountSchema, data)
  
  // Prepare data for database with correct field mapping
  const dbData = {
    name: validatedData.name,
    type: validatedData.type,
    bank: validatedData.bankName,
    accountNumber: validatedData.accountNumber,
    openingBalance: validatedData.openingBalance,
    currentBalance: validatedData.openingBalance,
    currency: validatedData.currency,
    description: validatedData.description,
    lowBalanceThreshold: validatedData.lowBalanceThreshold,
    userId,
  }
  
  return prisma.account.create({
    data: dbData
  })
}

export async function updateAccount(id: string, data: any) {
  const validatedData = validateInput(updateAccountSchema, data)
  
  // Prepare data for database with correct field mapping
  const dbData: any = {}
  
  if (validatedData.name !== undefined) dbData.name = validatedData.name
  if (validatedData.type !== undefined) dbData.type = validatedData.type
  if (validatedData.bankName !== undefined) dbData.bank = validatedData.bankName
  if (validatedData.accountNumber !== undefined) dbData.accountNumber = validatedData.accountNumber
  if (validatedData.currency !== undefined) dbData.currency = validatedData.currency
  if (validatedData.description !== undefined) dbData.description = validatedData.description
  if (validatedData.lowBalanceThreshold !== undefined) dbData.lowBalanceThreshold = validatedData.lowBalanceThreshold
  if (validatedData.isActive !== undefined) dbData.isActive = validatedData.isActive
  
  return prisma.account.update({
    where: { id },
    data: dbData
  })
}

export async function deleteAccount(id: string) {
  // Soft delete by marking as inactive
  return prisma.account.update({
    where: { id },
    data: { isActive: false }
  })
}

export async function updateAccountBalance(accountId: string, amount: number, operation: 'add' | 'subtract') {
  const account = await prisma.account.findUnique({ where: { id: accountId } })
  if (!account) {
    throw new Error('Account not found')
  }

  const newBalance = operation === 'add' 
    ? Number(account.currentBalance) + amount
    : Number(account.currentBalance) - amount

  return prisma.account.update({
    where: { id: accountId },
    data: { currentBalance: newBalance }
  })
}

export async function getAccountSummary(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true }
  })

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.currentBalance), 0)
  const accountsByType = accounts.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + Number(account.currentBalance)
    return acc
  }, {} as Record<AccountType, number>)

  return {
    totalBalance,
    accountCount: accounts.length,
    accountsByType
  }
}

// Legacy class for backward compatibility - will be removed
export class AccountService {
  static async findById(id: string) { return getAccountById(id) }
  static async findByUserId(userId: string, includeInactive = false) { return getUserAccounts(userId, includeInactive) }
  static async create(userId: string, data: any) { return createAccount(userId, data) }
  static async update(id: string, data: any) { return updateAccount(id, data) }
  static async delete(id: string) { return deleteAccount(id) }
  static async updateBalance(accountId: string, amount: number, operation: 'add' | 'subtract') { 
    return updateAccountBalance(accountId, amount, operation) 
  }
  static async getAccountSummary(userId: string) { return getAccountSummary(userId) }
}