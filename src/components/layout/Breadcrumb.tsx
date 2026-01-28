'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Breadcrumb() {
  const pathname = usePathname()
  
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    // Always start with Dashboard
    breadcrumbs.push({
      name: 'Dashboard',
      href: '/dashboard',
      icon: '🏠'
    })
    
    // Add specific page breadcrumbs
    if (paths.includes('transactions')) {
      breadcrumbs.push({
        name: 'Transactions',
        href: '/dashboard/transactions',
        icon: '💳'
      })
    } else if (paths.includes('accounts')) {
      breadcrumbs.push({
        name: 'Accounts',
        href: '/dashboard/accounts',
        icon: '🏦'
      })
    } else if (paths.includes('budgets')) {
      breadcrumbs.push({
        name: 'Budgets',
        href: '/dashboard/budgets',
        icon: '📋'
      })
    } else if (paths.includes('goals')) {
      breadcrumbs.push({
        name: 'Goals',
        href: '/dashboard/goals',
        icon: '🎯'
      })
    } else if (paths.includes('investments')) {
      breadcrumbs.push({
        name: 'Investments',
        href: '/dashboard/investments',
        icon: '📈'
      })
    } else if (paths.includes('reports')) {
      breadcrumbs.push({
        name: 'Reports',
        href: '/dashboard/reports',
        icon: '📊'
      })
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = getBreadcrumbs()
  
  // Don't show breadcrumbs if we're just on the main dashboard
  if (breadcrumbs.length <= 1) {
    return null
  }
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          {index > 0 && (
            <span className="mx-2 text-gray-400">/</span>
          )}
          {index === breadcrumbs.length - 1 ? (
            <span className="flex items-center text-gray-900 font-medium">
              <span className="mr-1">{breadcrumb.icon}</span>
              {breadcrumb.name}
            </span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="flex items-center hover:text-gray-700 transition-colors"
            >
              <span className="mr-1">{breadcrumb.icon}</span>
              {breadcrumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}