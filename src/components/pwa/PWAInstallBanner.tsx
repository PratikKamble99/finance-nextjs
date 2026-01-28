'use client'

import { useState, useEffect } from 'react'
import PWAInstallButton from './PWAInstallButton'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function PWAInstallBanner() {
  const { canInstall } = usePWAInstall()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    if (dismissed) {
      setIsDismissed(true)
    }

    // Show banner after a short delay if installable
    const timer = setTimeout(() => {
      setShowBanner(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  // Don't show if dismissed or not installable
  if (isDismissed || !canInstall || !showBanner) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📱</div>
            <div>
              <h3 className="font-medium text-sm">Install Personal Finance Tracker</h3>
              <p className="text-xs text-blue-100">
                Get quick access, work offline, and receive notifications
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const installButton = document.querySelector('[data-pwa-install]') as HTMLButtonElement
                if (installButton) {
                  installButton.click()
                }
              }}
              className="bg-white text-blue-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-blue-100 hover:text-white p-1"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Hidden install button for triggering */}
      <div className="hidden">
        <PWAInstallButton data-pwa-install />
      </div>
    </div>
  )
}