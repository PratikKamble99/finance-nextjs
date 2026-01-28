import { useState, useEffect } from 'react'
import { getDashboardData } from '@/lib/actions/dashboard-actions'

export function useSimpleDashboardData() {
  const [dashboardData, setDashboardData] = useState({
    netWorth: 0,
    totalBalance: 0,
    totalInvestments: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netAmount: 0,
    goalsProgress: 0,
    totalGoals: 0,
    completedGoals: 0
  })
  
  const [recentTransactions, setRecentTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getDashboardData()

      if (result.success && result.data) {
        setDashboardData(result.data.dashboardData)
        setRecentTransactions(result.data.recentTransactions)
      } else {
        setError(result.error || 'Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Dashboard data error:', error)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  // Load data once on mount
  useEffect(() => {
    loadData()
  }, [])

  return {
    dashboardData,
    recentTransactions,
    isLoading,
    error,
    refreshData: loadData
  }
}