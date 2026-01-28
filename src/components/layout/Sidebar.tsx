'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import PWAInstallButton from '@/components/pwa/PWAInstallButton'
import PWAStatus from '@/components/pwa/PWAStatus'
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Tags, 
  PiggyBank, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Plus, 
  ArrowRightLeft, 
  Settings, 
  LogOut, 
  X, 
  Wallet,
  Lock,
  ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview',
      disabled: false
    },
    {
      name: 'Transactions',
      href: '/dashboard/transactions',
      icon: Receipt,
      description: 'History',
      disabled: false
    },
    {
      name: 'Accounts',
      href: '/dashboard/accounts',
      icon: CreditCard,
      description: 'Bank & Cards',
      disabled: false
    },
    {
      name: 'Categories',
      href: '/dashboard/categories',
      icon: Tags,
      description: 'Manage tags',
      disabled: true
    },
    {
      name: 'Budgets',
      href: '/dashboard/budgets',
      icon: PiggyBank,
      description: 'Planning',
      disabled: true
    },
    {
      name: 'Goals',
      href: '/dashboard/goals',
      icon: Target,
      description: 'Savings',
      disabled: true
    },
    {
      name: 'Investments',
      href: '/dashboard/investments',
      icon: TrendingUp,
      description: 'Portfolio',
      disabled: true
    },
    {
      name: 'Reports',
      href: '/dashboard/reports',
      icon: BarChart3,
      description: 'Analytics',
      disabled: false
    }
  ]

  const quickActions = [
    {
      name: 'New Transaction',
      href: '/dashboard/transactions?action=add',
      icon: Plus,
      color: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20',
      disabled: false
    },
    {
      name: 'Transfer',
      href: '/dashboard/transfers',
      icon: ArrowRightLeft,
      color: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
      disabled: true
    }
  ]

  return (
    <>
      {/* Mobile backdrop with blur */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 h-screen flex flex-col
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Wallet className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Finance
            </span>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-8">
          
          {/* Quick Actions */}
          <div>
            <h3 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.disabled ? '#' : action.href}
                  className={`
                    group flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg
                    ${action.color}
                    ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={(e) => {
                    if (action.disabled) e.preventDefault()
                    if (window.innerWidth < 1024 && !action.disabled) onToggle()
                  }}
                >
                  <action.icon className="w-4 h-4" />
                  {action.name}
                  {action.disabled && <Lock className="w-3 h-3 ml-1 opacity-50" />}
                </Link>
              ))}
            </div>
          </div>

          {/* Main Navigation */}
          <div>
            <h3 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Menu
            </h3>
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.disabled ? '#' : item.href}
                    onClick={(e) => {
                      if (item.disabled) e.preventDefault()
                      if (window.innerWidth < 1024 && !item.disabled) onToggle()
                    }}
                    className={`
                      relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group
                      ${isActive 
                        ? 'bg-indigo-500/10 text-indigo-400' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }
                      ${item.disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}
                    `}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    
                    <div className="flex-1">
                      <span>{item.name}</span>
                    </div>

                    {item.disabled && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-500 border border-slate-700">
                        Soon
                      </span>
                    )}
                    
                    {isActive && (
                      <motion.div 
                         layoutId="activeNav"
                         className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          
          {/* PWA Status (Styled Wrapper) */}
          <div className="mb-4 space-y-2 [&_*]:text-slate-400 [&_button]:w-full [&_button]:bg-slate-900 [&_button]:border-slate-800 [&_button]:text-sm">
             <PWAInstallButton variant="sidebar" />
             <div className="scale-90 origin-left opacity-70">
               <PWAStatus />
             </div>
          </div>

          {/* User Profile Dropup */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => alert('Settings coming soon')}
                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors border border-slate-800"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </button>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium transition-colors border border-red-500/10"
              >
                {isLoggingOut ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}