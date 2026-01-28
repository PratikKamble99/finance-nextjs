'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2, ShieldCheck, Lock } from 'lucide-react'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm mb-4 shadow-xl">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
          <p className="text-slate-400 font-medium animate-pulse">Verifying credentials...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl opacity-30 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm mb-6 shadow-xl">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400 mb-6">Redirecting you to the secure login...</p>
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}