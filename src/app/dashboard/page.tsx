'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Loader2,
  MoreHorizontal,
  DollarSign
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useSimpleDashboardData } from '@/hooks/useSimpleDashboardData'
import { useAuth } from '@/contexts/AuthContext'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const {
    dashboardData,
    recentTransactions,
    isLoading,
    error
  } = useSimpleDashboardData()

  // Formatters (Kept original logic)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Syncing financial data...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Hello, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-slate-400 mt-1">Here is your daily financial briefing.</p>
          </div>
          <div className="flex gap-3">
             <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Data
             </span>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div variants={itemVariants} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/20">
               <ArrowDownRight className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-sm text-red-200">{error}</div>
          </motion.div>
        )}

        {/* Net Worth Hero Card */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl shadow-indigo-500/20">
          {/* Abstract background patterns */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>
          
          <div className="relative p-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div>
                <h2 className="text-indigo-100 font-medium mb-1 flex items-center gap-2">
                  Total Net Worth
                </h2>
                <div className="text-5xl font-bold tracking-tight mb-4">
                  {formatCurrency(dashboardData.netWorth)}
                </div>
                <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                  <span className={dashboardData.netAmount >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                    {dashboardData.netAmount >= 0 ? '+' : ''}{formatCurrency(dashboardData.netAmount)}
                  </span>
                  <span className="text-indigo-200">vs last month</span>
                </div>
              </div>

              <div className="flex gap-8 bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                <div>
                  <div className="text-indigo-200 text-xs uppercase tracking-wider mb-1">Income</div>
                  <div className="text-xl font-semibold flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    {formatCurrency(dashboardData.monthlyIncome)}
                  </div>
                </div>
                <div className="w-px bg-white/10"></div>
                <div>
                  <div className="text-indigo-200 text-xs uppercase tracking-wider mb-1">Expenses</div>
                  <div className="text-xl font-semibold flex items-center gap-1">
                    <ArrowDownRight className="w-4 h-4 text-rose-400" />
                    {formatCurrency(dashboardData.monthlyExpenses)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Balance */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:bg-slate-800/50 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-1 rounded">Liquid</span>
            </div>
            <div className="text-slate-400 text-sm font-medium">Cash & Accounts</div>
            <div className="text-2xl font-bold text-white mt-1">{formatCurrency(dashboardData.totalBalance)}</div>
          </div>

          {/* Card 2: Investments */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:bg-slate-800/50 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">+2.4%</span>
            </div>
            <div className="text-slate-400 text-sm font-medium">Investments</div>
            <div className="text-2xl font-bold text-white mt-1">{formatCurrency(dashboardData.totalInvestments)}</div>
          </div>

          {/* Card 3: Monthly Spend */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:bg-slate-800/50 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div className="text-slate-400 text-sm font-medium">Monthly Spending</div>
            <div className="text-2xl font-bold text-white mt-1">{formatCurrency(dashboardData.monthlyExpenses)}</div>
          </div>

          {/* Card 4: Goals */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:bg-slate-800/50 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-xs font-medium text-slate-400">
                {dashboardData.completedGoals}/{dashboardData.totalGoals}
              </span>
            </div>
            <div className="text-slate-400 text-sm font-medium">Goals Progress</div>
            <div className="mt-2 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-amber-500 rounded-full" style={{ width: `${dashboardData.goalsProgress}%` }}></div>
            </div>
          </div>
        </motion.div>

        {/* Lower Section: Actions & History */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Recent Transactions (Takes up 2/3 on large screens) */}
          <motion.div variants={itemVariants} className="xl:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm overflow-hidden">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-semibold text-white">Recent Transactions</h3>
                <Link href="/dashboard/transactions" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  View All
                </Link>
             </div>
             <div className="p-0">
               {recentTransactions.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                   <div className="p-4 bg-slate-800/50 rounded-full mb-3">
                     <MoreHorizontal className="w-6 h-6" />
                   </div>
                   <p>No recent transactions</p>
                 </div>
               ) : (
                 <div className="divide-y divide-slate-800">
                   {recentTransactions.map((t) => (
                     <div key={t.id} className="p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                         <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center border
                            ${t.type === 'INCOME' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : ''}
                            ${t.type === 'EXPENSE' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : ''}
                            ${t.type === 'TRANSFER' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : ''}
                         `}>
                            {t.type === 'INCOME' && <ArrowUpRight className="w-5 h-5" />}
                            {t.type === 'EXPENSE' && <ArrowDownRight className="w-5 h-5" />}
                            {t.type === 'TRANSFER' && <ArrowUpRight className="w-5 h-5 rotate-45" />}
                         </div>
                         <div>
                           <p className="font-medium text-slate-200">{t.description}</p>
                           <p className="text-xs text-slate-500 flex items-center gap-1.5">
                             {t.category && <span className="bg-slate-800 px-1.5 py-0.5 rounded">{t.category.name}</span>}
                             <span>{formatDate(t.date)}</span>
                           </p>
                         </div>
                       </div>
                       <div className={`font-semibold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {t.type === 'EXPENSE' ? '-' : '+'}
                          {formatCurrency(t.amount)}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </motion.div>

          {/* Quick Actions (Sidebar on large screens) */}
          <motion.div variants={itemVariants} className="space-y-6">
            
            {/* Action Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/dashboard/transactions?action=add" className="flex items-center gap-3 w-full p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20 group">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Add Transaction</div>
                    <div className="text-xs text-indigo-100 opacity-80">Record income or expense</div>
                  </div>
                </Link>

                <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-left group">
                   <div className="bg-slate-700 p-1.5 rounded-lg group-hover:bg-slate-600 transition-colors">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Update Portfolio</div>
                    <div className="text-xs text-slate-500">Track stock prices</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Debug/Status Card (Styled nicely) */}
            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <h4 className="text-sm font-semibold text-emerald-400">System Status</h4>
              </div>
              <p className="text-xs text-emerald-200/70 leading-relaxed">
                Server actions are fully integrated. Data is being pulled securely from your local encrypted database.
              </p>
            </div>

          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}