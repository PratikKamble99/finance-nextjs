'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, Loader2, KeyRound, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
      } else {
        setError(data.error?.message ?? 'Failed to send reset email. Please try again.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden selection:bg-indigo-500/30">

      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8 sm:p-10">

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 border border-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-3">
                Check your inbox
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-2">
                We&apos;ve sent a password reset link to
              </p>
              <p className="text-indigo-400 font-medium text-sm mb-8">{email}</p>
              <p className="text-slate-500 text-xs leading-relaxed mb-8">
                The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setIsSuccess(false); setEmail('') }}
                  className="w-full py-3 px-4 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 bg-transparent hover:bg-slate-800 transition-all"
                >
                  Try a different email
                </button>
                <Link
                  href="/auth/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_-5px_rgba(79,70,229,0.5)]"
                >
                  Back to sign in
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-10">
                <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
                  <KeyRound className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                  Forgot password?
                </h2>
                <p className="text-slate-400 text-sm">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300 ml-1">
                    Email address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="block w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    <p className="text-sm text-red-200">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_-5px_rgba(79,70,229,0.5)]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Sending reset link...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Send reset link</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>

                <div className="text-center pt-2 border-t border-slate-800">
                  <Link
                    href="/auth/login"
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Back to sign in
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
