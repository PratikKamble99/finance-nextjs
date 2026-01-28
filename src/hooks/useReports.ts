'use client'

import { useState } from 'react'
import { 
  getIncomeExpenseReport, 
  getCashFlowReport, 
  getAccountBalanceReport, 
  getSpendingTrendsReport 
} from '@/lib/actions/report-actions'

export function useReports() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const generateIncomeExpenseReport = async (startDate: string, endDate: string) => {
    try {
      setIsLoading(true)
      setError('')
      
      const result = await getIncomeExpenseReport(startDate, endDate)
      
      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Failed to generate report')
        return null
      }
    } catch (err) {
      console.error('Error generating income/expense report:', err)
      setError('Failed to generate report')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const generateCashFlowReport = async (startDate: string, endDate: string) => {
    try {
      setIsLoading(true)
      setError('')
      
      const result = await getCashFlowReport(startDate, endDate)
      
      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Failed to generate cash flow report')
        return null
      }
    } catch (err) {
      console.error('Error generating cash flow report:', err)
      setError('Failed to generate cash flow report')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const generateAccountBalanceReport = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const result = await getAccountBalanceReport()
      
      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Failed to generate account balance report')
        return null
      }
    } catch (err) {
      console.error('Error generating account balance report:', err)
      setError('Failed to generate account balance report')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const generateSpendingTrendsReport = async (months: number = 6) => {
    try {
      setIsLoading(true)
      setError('')
      
      const result = await getSpendingTrendsReport(months)
      
      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Failed to generate spending trends report')
        return null
      }
    } catch (err) {
      console.error('Error generating spending trends report:', err)
      setError('Failed to generate spending trends report')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    generateIncomeExpenseReport,
    generateCashFlowReport,
    generateAccountBalanceReport,
    generateSpendingTrendsReport
  }
}