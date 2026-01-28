import { prisma } from '@/lib/db'

// Simple net worth functions without complex classes

export async function calculateNetWorth(userId: string) {
  try {
    // Get all accounts
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true }
    })

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.currentBalance), 0)

    // For now, just return the account balance as net worth
    // In the future, we can add investments and liabilities
    return {
      netWorth: totalBalance,
      totalAssets: totalBalance,
      totalLiabilities: 0
    }
  } catch (error) {
    console.error('Error calculating net worth:', error)
    return {
      netWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0
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