'use client'

import { useState } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

interface PWAInstallButtonProps {
  variant?: 'button' | 'banner' | 'sidebar'
  className?: string
}

export default function PWAInstallButton({ variant = 'button', className = '' }: PWAInstallButtonProps) {
  const { canInstall, isInstalled, isStandalone, installApp } = usePWAInstall()
  const [isInstalling, setIsInstalling] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const success = await installApp()
      if (success) {
        console.log('PWA installed successfully')
      }
    } catch (error) {
      console.error('Failed to install PWA:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  // Don't show anything if already installed or not installable
  if (isInstalled || isStandalone || !canInstall) {
    return null
  }

  if (variant === 'banner' && showBanner) {
    return (
      <div className={`bg-blue-600 text-white p-4 ${className}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📱</div>
            <div>
              <h3 className="font-medium">Install Personal Finance Tracker</h3>
              <p className="text-sm text-blue-100">
                Get quick access and work offline by installing our app
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 disabled:opacity-50"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="text-blue-100 hover:text-white p-1"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleInstall}
        disabled={isInstalling}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
      >
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {isInstalling ? 'Installing...' : 'Install App'}
      </button>
    )
  }

  // Default button variant
  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      {isInstalling ? 'Installing...' : 'Install App'}
    </button>
  )
}