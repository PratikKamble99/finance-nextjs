import { TransactionType } from '../../../prisma/generated/prisma/client'
import { validateInput, createTransactionSchema, updateTransactionSchema } from '@/lib/validations'
import { updateAccountBalance } from './account.service'
import { prisma } from '@/lib/db'

// Simple transaction functions without classes

export async function getTransactionById(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      account: true,
      category: true,
      tags: {
        include: {
          tag: true
        }
      }
    }
  })
}

export async function getUserTransactions(
  userId: string, 
  options: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
    category?: string
    type?: TransactionType
    accountId?: string
  } = {}
) {
  const { page = 1, limit = 20, startDate, endDate, category, type, accountId } = options

  const where: any = { userId }
  
  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate)
  }
  
  if (category) where.categoryId = category
  if (type) where.type = type
  if (accountId) where.accountId = accountId

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { 
        account: true,
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.transaction.count({ where })
  ])

  return { transactions, total }
}

export async function createTransaction(userId: string, data: any) {
  const validatedData = validateInput(createTransactionSchema, data)
  
  return prisma.$transaction(async (tx) => {
    // Extract tags from validated data
    const { tags, ...transactionData } = validatedData
    
    // Create transaction
    const transaction = await tx.transaction.create({
      data: {
        ...transactionData,
        userId,
        date: new Date(validatedData.date)
      }
    })

    // Handle tags if provided
    if (tags && tags.length > 0) {
      // Find or create tags
      const tagRecords = await Promise.all(
        tags.map(async (tagName: string) => {
          // Try to find existing tag
          let tag = await tx.tag.findFirst({
            where: { userId, name: tagName }
          })
          
          // Create tag if it doesn't exist
          if (!tag) {
            tag = await tx.tag.create({
              data: { userId, name: tagName }
            })
          }
          
          return tag
        })
      )

      // Create TransactionTag relationships
      await Promise.all(
        tagRecords.map(tag =>
          tx.transactionTag.create({
            data: {
              transactionId: transaction.id,
              tagId: tag.id
            }
          })
        )
      )
    }

    // Update account balance if account is linked
    if (validatedData.accountId) {
      const operation = validatedData.type === 'INCOME' ? 'add' : 'subtract'
      await updateAccountBalance(validatedData.accountId, validatedData.amount, operation)
    }

    // Return transaction with tags included
    return tx.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        account: true,
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })
  })
}

export async function updateTransaction(id: string, data: any) {
  const validatedData = validateInput(updateTransactionSchema, data)
  
  return prisma.$transaction(async (tx) => {
    // Get original transaction
    const originalTransaction = await tx.transaction.findUnique({ where: { id } })
    if (!originalTransaction) {
      throw new Error('Transaction not found')
    }

    // Revert original balance change if account was linked
    if (originalTransaction.accountId) {
      const revertOperation = originalTransaction.type === 'INCOME' ? 'subtract' : 'add'
      await updateAccountBalance(originalTransaction.accountId, Number(originalTransaction.amount), revertOperation)
    }

    // Extract tags from validated data
    const { tags, ...transactionData } = validatedData

    // Update transaction
    const updatedTransaction = await tx.transaction.update({
      where: { id },
      data: {
        ...transactionData,
        ...(validatedData.date && { date: new Date(validatedData.date) })
      }
    })

    // Handle tags if provided
    if (tags !== undefined) {
      // Remove existing tag relationships
      await tx.transactionTag.deleteMany({
        where: { transactionId: id }
      })

      // Add new tags if any
      if (tags.length > 0) {
        // Find or create tags
        const tagRecords = await Promise.all(
          tags.map(async (tagName: string) => {
            // Try to find existing tag
            let tag = await tx.tag.findFirst({
              where: { userId: originalTransaction.userId, name: tagName }
            })
            
            // Create tag if it doesn't exist
            if (!tag) {
              tag = await tx.tag.create({
                data: { userId: originalTransaction.userId, name: tagName }
              })
            }
            
            return tag
          })
        )

        // Create TransactionTag relationships
        await Promise.all(
          tagRecords.map(tag =>
            tx.transactionTag.create({
              data: {
                transactionId: id,
                tagId: tag.id
              }
            })
          )
        )
      }
    }

    // Apply new balance change if account is linked
    if (updatedTransaction.accountId) {
      const operation = updatedTransaction.type === 'INCOME' ? 'add' : 'subtract'
      await updateAccountBalance(updatedTransaction.accountId, Number(updatedTransaction.amount), operation)
    }

    // Return transaction with tags included
    return tx.transaction.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })
  })
}

export async function deleteTransaction(id: string) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({ where: { id } })
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    // Revert balance change if account was linked
    if (transaction.accountId) {
      const revertOperation = transaction.type === 'INCOME' ? 'subtract' : 'add'
      await updateAccountBalance(transaction.accountId, Number(transaction.amount), revertOperation)
    }

    // Delete TransactionTag relationships first
    await tx.transactionTag.deleteMany({
      where: { transactionId: id }
    })

    return tx.transaction.delete({ where: { id } })
  })
}

export async function getTransactionSummary(userId: string, startDate?: string, endDate?: string) {
  const where: any = { userId }
  
  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate)
  }

  const [totalIncome, totalExpenses, transactionCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...where, type: 'INCOME' },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: 'EXPENSE' },
      _sum: { amount: true }
    }),
    prisma.transaction.count({ where })
  ])

  return {
    totalIncome: Number(totalIncome._sum.amount || 0),
    totalExpenses: Number(totalExpenses._sum.amount || 0),
    netAmount: Number(totalIncome._sum.amount || 0) - Number(totalExpenses._sum.amount || 0),
    transactionCount
  }
}

// Legacy class for backward compatibility - will be removed
export class TransactionService {
  static async findById(id: string) { return getTransactionById(id) }
  static async findByUserId(userId: string, options: any = {}) { return getUserTransactions(userId, options) }
  static async create(userId: string, data: any) { return createTransaction(userId, data) }
  static async update(id: string, data: any) { return updateTransaction(id, data) }
  static async delete(id: string) { return deleteTransaction(id) }
  static async getTransactionSummary(userId: string, startDate?: string, endDate?: string) { 
    return getTransactionSummary(userId, startDate, endDate) 
  }
}