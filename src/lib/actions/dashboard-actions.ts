'use server'

import { getUserFromToken } from '@/lib/actions/auth-helper'
import { getUserTransactions, getTransactionSummary } from '@/lib/services/transaction.service'
import { getUserAccounts, getAccountSummary } from '@/lib/services/account.service'
import { calculateNetWorth } from '@/lib/services/net-worth.service'
import { serializeAccount, serializePrismaData } from '@/lib/utils/serialization'

interface DashboardData {
  netWorth: number
  totalBalance: number
  totalInvestments: number
  monthlyIncome: number
  monthlyExpenses: number
  netAmount: number
  goalsProgress: number
  totalGoals: number
  completedGoals: number
}

interface RecentTransaction {
  id: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  currency: string
  description: string
  date: string
  category?: {
    name: string
    icon: string
  }
  account?: {
    name: string
  }
}

interface DashboardResponse {
  success: boolean
  data?: {
    dashboardData: DashboardData
    recentTransactions: RecentTransaction[]
  }
  error?: string
}

export async function getDashboardData(): Promise<DashboardResponse> {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Get current month date range for monthly calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    // Load all dashboard data in parallel with error handling
    const [
      netWorthResult,
      accountSummaryResult,
      transactionSummaryResult,
      goalsSummaryResult,
      recentTransactionsResult
    ] = await Promise.allSettled([
      calculateNetWorth(user.userId),
      getAccountSummary(user.userId),
      getTransactionSummary(user.userId, startOfMonth, endOfMonth),
      Promise.resolve({ totalGoals: 0, completedGoals: 0, overallProgress: 0 }),
      getUserTransactions(user.userId, { page: 1, limit: 5 })
    ])

    // Extract data from settled promises, logging failures
    const netWorthData = netWorthResult.status === 'fulfilled' ? netWorthResult.value : (console.error('NetWorth calculation failed:', netWorthResult.reason), null)
    const accountData = accountSummaryResult.status === 'fulfilled' ? accountSummaryResult.value : (console.error('Account summary failed:', accountSummaryResult.reason), null)
    const transactionData = transactionSummaryResult.status === 'fulfilled' ? transactionSummaryResult.value : (console.error('Transaction summary failed:', transactionSummaryResult.reason), null)
    const goalsData = goalsSummaryResult.status === 'fulfilled' ? goalsSummaryResult.value : null
    const transactionsData = recentTransactionsResult.status === 'fulfilled' ? recentTransactionsResult.value : (console.error('Recent transactions failed:', recentTransactionsResult.reason), null)

    // Calculate dashboard metrics with fallbacks and proper number conversion
    const dashboardData: DashboardData = {
      netWorth: typeof netWorthData?.netWorth === 'object' ? Number(netWorthData.netWorth) : (netWorthData?.netWorth || (accountData?.totalBalance || 0)),
      totalBalance: typeof accountData?.totalBalance === 'object' ? Number(accountData.totalBalance) : (accountData?.totalBalance || 0),
      totalInvestments: typeof netWorthData?.totalInvestments === 'object' ? Number(netWorthData.totalInvestments) : (netWorthData?.totalInvestments || 0),
      monthlyIncome: typeof transactionData?.totalIncome === 'object' ? Number(transactionData.totalIncome) : (transactionData?.totalIncome || 0),
      monthlyExpenses: typeof transactionData?.totalExpenses === 'object' ? Number(transactionData.totalExpenses) : (transactionData?.totalExpenses || 0),
      netAmount: typeof transactionData?.netAmount === 'object' ? Number(transactionData.netAmount) : (transactionData?.netAmount || 0),
      goalsProgress: typeof goalsData?.overallProgress === 'object' ? Number(goalsData.overallProgress) : (goalsData?.overallProgress || 0),
      totalGoals: goalsData?.totalGoals || 0,
      completedGoals: goalsData?.completedGoals || 0
    }

    // Format recent transactions with proper serialization
    const recentTransactions: RecentTransaction[] = transactionsData?.transactions?.slice(0, 5).map((transaction: any) => ({
      id: transaction.id,
      type: transaction.type,
      amount: typeof transaction.amount === 'object' ? Number(transaction.amount) : Number(transaction.amount),
      currency: transaction.currency,
      description: transaction.description || '',
      date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date,
      category: transaction.category ? {
        name: transaction.category.name,
        icon: transaction.category.icon
      } : undefined,
      account: transaction.account ? {
        name: transaction.account.name
      } : undefined
    })) || []

    return {
      success: true,
      data: {
        dashboardData,
        recentTransactions
      }
    }
  } catch (error) {
    console.error('Dashboard data error:', error)
    return {
      success: false,
      error: 'Failed to load dashboard data'
    }
  }
}

export async function getAccountsForForm(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return {
        success: false,
        error: 'Authentication required'
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

export async function getCategoriesForForm(type: 'INCOME' | 'EXPENSE'): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // For now, we'll use a simple category service call
    // In a real implementation, you'd have a CategoryService
    const { prisma } = await import('@/lib/db')
    
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: user.userId },
          { isSystem: true }
        ],
        type,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })

    // Serialize categories data for client components
    const serializedCategories = serializePrismaData(categories)

    return {
      success: true,
      data: serializedCategories
    }
  } catch (error) {
    console.error('Error loading categories:', error)
    return {
      success: false,
      error: 'Failed to load categories'
    }
  }
}