'use server'

import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { serializePrismaData } from '@/lib/utils/serialization'

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

export async function getIncomeExpenseReport(
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getUserFromToken()
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Get transactions grouped by type
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        category: true,
        account: true
      },
      orderBy: { date: 'desc' }
    })

    // Calculate totals
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    // Group by category
    const incomeByCategory = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, t) => {
        const categoryName = t.category?.name || 'Uncategorized'
        acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)

    const expensesByCategory = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => {
        const categoryName = t.category?.name || 'Uncategorized'
        acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)

    // Group by month for trends
    const monthlyData = transactions.reduce((acc, t) => {
      const monthKey = t.date.toISOString().substring(0, 7) // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = { income: 0, expenses: 0 }
      }
      
      if (t.type === 'INCOME') {
        acc[monthKey].income += Number(t.amount)
      } else if (t.type === 'EXPENSE') {
        acc[monthKey].expenses += Number(t.amount)
      }
      
      return acc
    }, {} as Record<string, { income: number; expenses: number }>)

    const reportData = {
      summary: {
        totalIncome: income,
        totalExpenses: expenses,
        netIncome: income - expenses,
        transactionCount: transactions.length
      },
      incomeByCategory,
      expensesByCategory,
      monthlyTrends: Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month,
          ...data,
          net: data.income - data.expenses
        })),
      transactions: serializePrismaData(transactions)
    }

    return {
      success: true,
      data: reportData
    }
  } catch (error) {
    console.error('Error generating income/expense report:', error)
    return {
      success: false,
      error: 'Failed to generate report'
    }
  }
}

export async function getCashFlowReport(
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getUserFromToken()
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Get all transactions in date range
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        account: true
      },
      orderBy: { date: 'asc' }
    })

    // Get account balances at start of period
    const accounts = await prisma.account.findMany({
      where: { userId: user.userId, isActive: true }
    })

    // Calculate daily cash flow
    const dailyCashFlow = transactions.reduce((acc, t) => {
      const dateKey = t.date.toISOString().substring(0, 10) // YYYY-MM-DD
      if (!acc[dateKey]) {
        acc[dateKey] = { inflow: 0, outflow: 0, net: 0 }
      }
      
      if (t.type === 'INCOME') {
        acc[dateKey].inflow += Number(t.amount)
      } else if (t.type === 'EXPENSE') {
        acc[dateKey].outflow += Number(t.amount)
      }
      
      acc[dateKey].net = acc[dateKey].inflow - acc[dateKey].outflow
      
      return acc
    }, {} as Record<string, { inflow: number; outflow: number; net: number }>)

    // Calculate running balance
    let runningBalance = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0)
    const balanceHistory = Object.entries(dailyCashFlow)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, flow]) => {
        runningBalance += flow.net
        return {
          date,
          ...flow,
          balance: runningBalance
        }
      })

    const reportData = {
      summary: {
        totalInflow: Object.values(dailyCashFlow).reduce((sum, d) => sum + d.inflow, 0),
        totalOutflow: Object.values(dailyCashFlow).reduce((sum, d) => sum + d.outflow, 0),
        netCashFlow: Object.values(dailyCashFlow).reduce((sum, d) => sum + d.net, 0),
        startingBalance: accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0),
        endingBalance: runningBalance
      },
      dailyCashFlow: balanceHistory,
      accountBreakdown: serializePrismaData(accounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        balance: acc.currentBalance
      })))
    }

    return {
      success: true,
      data: reportData
    }
  } catch (error) {
    console.error('Error generating cash flow report:', error)
    return {
      success: false,
      error: 'Failed to generate cash flow report'
    }
  }
}

export async function getAccountBalanceReport(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getUserFromToken()
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Get all accounts with recent transactions
    const accounts = await prisma.account.findMany({
      where: { userId: user.userId, isActive: true },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    })

    // Calculate totals by account type
    const balancesByType = accounts.reduce((acc, account) => {
      const type = account.type
      acc[type] = (acc[type] || 0) + Number(account.currentBalance)
      return acc
    }, {} as Record<string, number>)

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0)

    const reportData = {
      summary: {
        totalBalance,
        accountCount: accounts.length,
        balancesByType
      },
      accounts: serializePrismaData(accounts),
      distribution: Object.entries(balancesByType).map(([type, balance]) => ({
        type,
        balance,
        percentage: totalBalance > 0 ? (balance / totalBalance) * 100 : 0
      }))
    }

    return {
      success: true,
      data: reportData
    }
  } catch (error) {
    console.error('Error generating account balance report:', error)
    return {
      success: false,
      error: 'Failed to generate account balance report'
    }
  }
}

export async function getSpendingTrendsReport(
  months: number = 6
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getUserFromToken()
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Get expense transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: true
      },
      orderBy: { date: 'desc' }
    })

    // Group by month and category
    const monthlySpending = transactions.reduce((acc, t) => {
      const monthKey = t.date.toISOString().substring(0, 7) // YYYY-MM
      const categoryName = t.category?.name || 'Uncategorized'
      
      if (!acc[monthKey]) {
        acc[monthKey] = {}
      }
      
      acc[monthKey][categoryName] = (acc[monthKey][categoryName] || 0) + Number(t.amount)
      
      return acc
    }, {} as Record<string, Record<string, number>>)

    // Calculate trends
    const monthlyTotals = Object.entries(monthlySpending)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, categories]) => ({
        month,
        total: Object.values(categories).reduce((sum, amount) => sum + amount, 0),
        categories
      }))

    // Top spending categories
    const categoryTotals = transactions.reduce((acc, t) => {
      const categoryName = t.category?.name || 'Uncategorized'
      acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount)
      return acc
    }, {} as Record<string, number>)

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([category, amount]) => ({ category, amount }))

    const reportData = {
      summary: {
        totalSpending: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
        averageMonthly: monthlyTotals.length > 0 
          ? monthlyTotals.reduce((sum, m) => sum + m.total, 0) / monthlyTotals.length 
          : 0,
        transactionCount: transactions.length
      },
      monthlyTrends: monthlyTotals,
      topCategories,
      categoryTotals
    }

    return {
      success: true,
      data: reportData
    }
  } catch (error) {
    console.error('Error generating spending trends report:', error)
    return {
      success: false,
      error: 'Failed to generate spending trends report'
    }
  }
}