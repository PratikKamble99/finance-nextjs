'use client'

import { useState } from 'react'
import { Menu, Wallet } from 'lucide-react'
import Sidebar from './Sidebar'
import Breadcrumb from './Breadcrumb'
import AuthWrapper from '@/components/auth/AuthWrapper'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <AuthWrapper>
      <div className="flex h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 overflow-hidden">
        
        {/* Sidebar - Handles its own responsive states based on isOpen */}
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

        {/* Main Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Mobile Header (Visible only on small screens) */}
          <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 lg:hidden sticky top-0 z-20">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                onClick={toggleSidebar}
                className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Wallet className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">Finance</span>
              </div>
              
              {/* Spacer to balance the flex layout */}
              <div className="w-10" /> 
            </div>
          </header>

          {/* Main Scrollable Area */}
          <main className="flex-1 overflow-y-auto custom-scrollbar relative">
            
            {/* Background Atmosphere Effects (Subtle glows) */}
            <div className="absolute inset-0 pointer-events-none z-0">
               {/* Top light source */}
               <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl opacity-50" />
               <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl opacity-50" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto w-full">
              
              {/* Breadcrumb Area */}
              <div className="mb-8">
                 <Breadcrumb />
              </div>

              {/* Dynamic Page Content */}
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthWrapper>
  )
}