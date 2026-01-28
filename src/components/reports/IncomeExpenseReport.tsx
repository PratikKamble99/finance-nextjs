'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  FileText, 
  Loader2, 
  AlertCircle,
  Calendar,
  Wallet
} from 'lucide-react'
import { useReports } from '@/hooks/useReports'

interface IncomeExpenseReportProps {
  startDate: string
  endDate: string
}

export default function IncomeExpenseReport({ startDate, endDate }: IncomeExpenseReportProps) {
  const { generateIncomeExpenseReport, isLoading, error } = useReports()
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    if (startDate && endDate) {
      loadReport()
    }
  }, [startDate, endDate])

  const loadReport = async () => {
    const data = await generateIncomeExpenseReport(startDate, endDate)
    setReportData(data)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    // Handling YYYY-MM format from monthly trends
    return new Date(dateStr + '-01').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p>Crunching the numbers...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center text-center">
        <div className="p-3 bg-red-500/20 rounded-full mb-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Report Generation Failed</h3>
        <p className="text-red-200 mt-1">{error}</p>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="p-4 bg-slate-800/50 rounded-full mb-4">
          <Calendar className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-lg font-medium text-slate-300">No Data Selected</p>
        <p className="text-sm">Please select a start and end date above.</p>
      </div>
    )
  }

  const { summary, incomeByCategory, expensesByCategory, monthlyTrends } = reportData

  // Helper to calculate percentages for bars
  const calculatePercentage = (amount: number, total: number) => {
    if (total === 0) return 0
    return (amount / total) * 100
  }

  return (
    <div className="space-y-8">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Income */}
        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Income</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>

        {/* Expenses */}
        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <ArrowDownRight className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Expenses</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(summary.totalExpenses)}
          </p>
        </div>

        {/* Net Income */}
        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${summary.netIncome >= 0 ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
              <Wallet className={`w-5 h-5 ${summary.netIncome >= 0 ? 'text-indigo-400' : 'text-amber-400'}`} />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Flow</span>
          </div>
          <p className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-indigo-400' : 'text-amber-400'}`}>
            {formatCurrency(summary.netIncome)}
          </p>
        </div>

        {/* Transactions */}
        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Volume</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {summary.transactionCount}
          </p>
        </div>
      </div>

      {/* Category Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Income Breakdown */}
        {Object.keys(incomeByCategory).length > 0 && (
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              Income Sources
            </h3>
            <div className="space-y-5">
              {Object.entries(incomeByCategory)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, amount]) => {
                  const percent = calculatePercentage(amount as number, summary.totalIncome)
                  return (
                    <div key={category}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-slate-300">{category}</span>
                        <span className="text-sm font-semibold text-emerald-400">
                          {formatCurrency(amount as number)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1 }}
                          className="bg-emerald-500 h-full rounded-full"
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Expense Breakdown */}
        {Object.keys(expensesByCategory).length > 0 && (
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
              Expense Breakdown
            </h3>
            <div className="space-y-5">
              {Object.entries(expensesByCategory)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, amount]) => {
                  const percent = calculatePercentage(amount as number, summary.totalExpenses)
                  return (
                    <div key={category}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-slate-300">{category}</span>
                        <span className="text-sm font-semibold text-rose-400">
                          {formatCurrency(amount as number)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1 }}
                          className="bg-rose-500 h-full rounded-full"
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Trends Table */}
      {monthlyTrends.length > 0 && (
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="font-semibold text-white">Monthly Cash Flow</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Month</th>
                  <th className="px-6 py-4">Income</th>
                  <th className="px-6 py-4">Expenses</th>
                  <th className="px-6 py-4">Net</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {monthlyTrends.map((trend: any) => (
                  <tr key={trend.month} className="group hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-300">
                      {formatDate(trend.month)}
                    </td>
                    <td className="px-6 py-4 text-emerald-400">
                      {formatCurrency(trend.income)}
                    </td>
                    <td className="px-6 py-4 text-rose-400">
                      {formatCurrency(trend.expenses)}
                    </td>
                    <td className={`px-6 py-4 font-semibold ${trend.net >= 0 ? 'text-white' : 'text-rose-200'}`}>
                      {formatCurrency(trend.net)}
                    </td>
                    <td className="px-6 py-4">
                      {trend.net >= 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                          <TrendingUp className="w-3 h-3" />
                          Positive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium">
                          <TrendingUp className="w-3 h-3 rotate-180" />
                          Deficit
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}