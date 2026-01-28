'use client'

import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function PWAStatus() {
  const { isInstalled, isStandalone, canInstall } = usePWAInstall()

  if (isInstalled || isStandalone) {
    return (
      <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        App Installed
      </div>
    )
  }

  if (canInstall) {
    return (
      <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Can Install
      </div>
    )
  }

  return (
    <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      Web App
    </div>
  )
}