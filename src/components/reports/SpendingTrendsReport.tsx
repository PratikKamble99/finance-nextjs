'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import { useReports } from '@/hooks/useReports'

interface SpendingTrendsReportProps {
  months?: number
}

export default function SpendingTrendsReport({ months = 6 }: SpendingTrendsReportProps) {
  const { generateSpendingTrendsReport, isLoading, error } = useReports()
  const [reportData, setReportData] = useState<any>(null)
  const [selectedMonths, setSelectedMonths] = useState(months)

  useEffect(() => {
    loadReport()
  }, [selectedMonths])

  const loadReport = async () => {
    const data = await generateSpendingTrendsReport(selectedMonths)
    setReportData(data)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + '-01').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p>Analyzing spending patterns...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center text-center">
        <div className="p-3 bg-red-500/20 rounded-full mb-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Analysis Failed</h3>
        <p className="text-red-200 mt-1">{error}</p>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="p-4 bg-slate-800/50 rounded-full mb-4">
          <BarChart3 className="w-8 h-8 opacity-50" />
        </div>
        <p>No spending data available for this period.</p>
      </div>
    )
  }

  const { summary, monthlyTrends, topCategories } = reportData

  return (
    <div className="space-y-8">
      
      {/* Time Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Trend Analysis</h3>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[3, 6, 12].map((monthOption) => (
            <button
              key={monthOption}
              onClick={() => setSelectedMonths(monthOption)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                selectedMonths === monthOption
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {monthOption}M
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <DollarSign className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Spent</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {formatCurrency(summary.totalSpending)}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Avg</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {formatCurrency(summary.averageMonthly)}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <CreditCard className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Transactions</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {summary.transactionCount}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Spending Bars */}
        {monthlyTrends.length > 0 && (
          <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800">
            <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Monthly History
            </h3>
            <div className="space-y-5">
              {monthlyTrends.map((trend: any) => {
                const maxAmount = Math.max(...monthlyTrends.map((t: any) => t.total))
                const percentage = maxAmount > 0 ? (trend.total / maxAmount) * 100 : 0
                
                return (
                  <div key={trend.month} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-slate-300">
                        {formatDate(trend.month)}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {formatCurrency(trend.total)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-indigo-500 h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800">
            <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              Top Categories
            </h3>
            <div className="space-y-4">
              {topCategories.map((category: any, index: number) => {
                const maxAmount = topCategories[0]?.amount || 1
                const percentage = (category.amount / maxAmount) * 100
                
                return (
                  <div key={category.category} className="relative">
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-200">
                          {category.category}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-rose-400">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                    {/* Background Progress Bar */}
                    <div className="absolute inset-0 bg-slate-800/30 rounded-lg overflow-hidden -z-0 h-full w-full">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full bg-rose-500/10"
                       />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Breakdown Table */}
      {monthlyTrends.length > 0 && (
        <div className="rounded-2xl bg-slate-950/50 border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-semibold text-white">Detailed Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Month</th>
                  <th className="px-6 py-4">Spent</th>
                  <th className="px-6 py-4">Change</th>
                  <th className="px-6 py-4">Highest Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {monthlyTrends.map((trend: any, index: number) => {
                  const prevTrend = monthlyTrends[index - 1]
                  const change = prevTrend ? trend.total - prevTrend.total : 0
                  const changePercent = prevTrend && prevTrend.total > 0 
                    ? ((change / prevTrend.total) * 100) 
                    : 0
                  
                  const topCategory = Object.entries(trend.categories)
                    .sort(([, a], [, b]) => (b as number) - (a as number))[0]

                  return (
                    <tr key={trend.month} className="group hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-300">
                        {formatDate(trend.month)}
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        {formatCurrency(trend.total)}
                      </td>
                      <td className="px-6 py-4">
                        {prevTrend ? (
                          <div className={`flex items-center gap-1 ${change >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span>{Math.abs(changePercent).toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {topCategory ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
                               {topCategory[0]}
                            </span>
                            <span className="text-xs opacity-50">
                              {formatCurrency(topCategory[1] as number)}
                            </span>
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}