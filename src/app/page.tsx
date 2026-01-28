'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  ChevronRight, 
  PieChart, 
  Lock 
} from 'lucide-react'

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      
      {/* Abstract Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-[20%] right-[20%] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl opacity-30" />
        {/* Grid Pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
        
        {/* Hero Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            v2.0 is now live
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Master your money. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400">
              Preserve your privacy.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The privacy-first PWA for the modern investor. Track expenses, 
            analyze assets, and get AI insights without your data ever leaving your device.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/dashboard"
              className="group relative flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-500 transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.6)]"
            >
              Go to Dashboard
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/auth/login"
              className="px-8 py-4 rounded-xl font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors border border-slate-700/50 backdrop-blur-sm"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-32 grid md:grid-cols-3 gap-6"
        >
          {/* Card 1 */}
          <div className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-800/50 transition-all duration-300 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Smart Expense Tracking</h3>
            <p className="text-slate-400 leading-relaxed">
              Auto-categorize spending with receipt scanning. Visualise your cash flow with beautiful, interactive charts.
            </p>
          </div>
          
          {/* Card 2 */}
          <div className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-800/50 transition-all duration-300 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Portfolio Analytics</h3>
            <p className="text-slate-400 leading-relaxed">
              Real-time tracking for stocks, crypto, and mutual funds. Compare your performance against market benchmarks.
            </p>
          </div>
          
          {/* Card 3 */}
          <div className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 hover:bg-slate-800/50 transition-all duration-300 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <PieChart className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">AI Financial Advisor</h3>
            <p className="text-slate-400 leading-relaxed">
              Get personalized saving tips and investment opportunities powered by on-device machine learning.
            </p>
          </div>
        </motion.div>

        {/* Privacy Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24 relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-slate-900/50 backdrop-blur-md z-0" />
          <div className="relative z-10 p-8 md:p-12 border border-white/10 rounded-3xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Security is our feature #1</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <Shield className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Local-First Encryption</h4>
                      <p className="text-slate-400 text-sm">Your financial data is encrypted and stored locally on your device. We never see it.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Smartphone className="w-6 h-6 text-blue-400 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Offline Capable PWA</h4>
                      <p className="text-slate-400 text-sm">Manage your finances on a plane or in a tunnel. Syncs silently when you're back online.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex justify-center items-center">
                {/* Visual representation of security */}
                <div className="relative w-64 h-64 bg-slate-800/50 rounded-full flex items-center justify-center border border-indigo-500/30">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                  <Lock className="w-24 h-24 text-indigo-400" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}