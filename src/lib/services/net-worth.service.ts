import { prisma } from '@/lib/db'

// Simple net worth functions without complex classes

export async function calculateNetWorth(userId: string) {
  try {
    // Get all accounts and investments in parallel
    const [accounts, investments] = await Promise.all([
      prisma.account.findMany({
        where: { userId, isActive: true }
      }),
      prisma.investment.findMany({
        where: { userId }
      })
    ])

    // Calculate total account balance
    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.currentBalance), 0)

    // Calculate total investment value (use currentValue if available, otherwise totalInvested)
    const totalInvestments = investments.reduce((sum, investment) => {
      const value = investment.currentValue
        ? Number(investment.currentValue)
        : Number(investment.totalInvested)
      return sum + value
    }, 0)

    const totalAssets = totalBalance + totalInvestments

    return {
      netWorth: totalAssets,
      totalAssets,
      totalLiabilities: 0,
      totalBalance,
      totalInvestments
    }
  } catch (error) {
    console.error('Error calculating net worth:', error)
    return {
      netWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      totalBalance: 0,
      totalInvestments: 0
    }
  }
}

// Legacy class for backward compatibility - will be removed
export class NetWorthService {
  static async calculateCurrentNetWorth(userId: string) {
    const result = await calculateNetWorth(userId)
    return {
      id: `snapshot_${Date.now()}`,
      userId,
      date: new Date(),
      ...result,
      assetBreakdown: {
        accounts: { total: result.totalAssets, breakdown: [] },
        investments: { total: 0, breakdown: [] },
        cash: { total: 0, breakdown: [] }
      },
      liabilityBreakdown: {
        loans: { total: 0, breakdown: [] },
        creditCards: { total: 0, breakdown: [] }
      },
      monthOverMonthChange: null,
      yearOverYearChange: null
    }
  }
}