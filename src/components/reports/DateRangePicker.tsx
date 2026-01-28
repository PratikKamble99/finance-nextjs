'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string, endDate: string) => void
  defaultRange?: 'week' | 'month' | 'quarter' | 'year' | 'custom'
}

export default function DateRangePicker({ onDateRangeChange, defaultRange = 'month' }: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState<string>(defaultRange)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const getDateRange = (range: string) => {
    const today = new Date()
    const endDate = today.toISOString().split('T')[0]
    let startDate = ''

    switch (range) {
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
        startDate = weekAgo.toISOString().split('T')[0]
        break
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(today.getMonth() - 1)
        startDate = monthAgo.toISOString().split('T')[0]
        break
      case 'quarter':
        const quarterAgo = new Date(today)
        quarterAgo.setMonth(today.getMonth() - 3)
        startDate = quarterAgo.toISOString().split('T')[0]
        break
      case 'year':
        const yearAgo = new Date(today)
        yearAgo.setFullYear(today.getFullYear() - 1)
        startDate = yearAgo.toISOString().split('T')[0]
        break
      case 'custom':
        return { startDate: customStartDate, endDate: customEndDate }
      default:
        startDate = endDate
    }

    return { startDate, endDate }
  }

  const handleRangeChange = (range: string) => {
    setSelectedRange(range)
    if (range !== 'custom') {
      const { startDate, endDate } = getDateRange(range)
      onDateRangeChange(startDate, endDate)
    }
  }

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      onDateRangeChange(customStartDate, customEndDate)
    }
  }

  // Initialize with default range
  useEffect(() => {
    if (defaultRange !== 'custom') {
      const { startDate, endDate } = getDateRange(defaultRange)
      onDateRangeChange(startDate, endDate)
    }
  }, []) 

  const ranges = [
    { key: 'week', label: '1W' },
    { key: 'month', label: '1M' },
    { key: 'quarter', label: '3M' },
    { key: 'year', label: '1Y' },
    { key: 'custom', label: 'Custom' }
  ]

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        
        {/* Range Buttons */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          {ranges.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleRangeChange(key)}
              className={`
                flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all
                ${selectedRange === key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        <AnimatePresence mode="popLayout">
          {selectedRange === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <div className="relative group flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  onBlur={handleCustomDateChange}
                  className="w-full pl-10 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                />
              </div>
              
              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

              <div className="relative group flex-1">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  onBlur={handleCustomDateChange}
                  className="w-full pl-10 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}