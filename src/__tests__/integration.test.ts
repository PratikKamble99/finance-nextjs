/**
 * Integration tests for the complete transaction management system
 * Tests the integration between hooks, server actions, and components
 */

import { getDashboardData, getAccountsForForm, getCategoriesForForm } from '@/lib/actions/dashboard-actions'
import { createTransaction } from '@/lib/actions/transaction-actions'

// Mock the auth verification
jest.mock('@/lib/auth', () => ({
  verifyAccessToken: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    email: 'test@example.com'
  })
}))

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: 'mock-access-token' })
  })
}))

// Mock the services
jest.mock('@/lib/services/net-worth.service', () => ({
  NetWorthService: {
    calculateCurrentNetWorth: jest.fn().mockResolvedValue({
      netWorth: 50000,
      change: 1000
    })
  }
}))

jest.mock('@/lib/services/account.service', () => ({
  AccountService: {
    getAccountSummary: jest.fn().mockResolvedValue({
      totalBalance: 25000,
      accounts: []
    }),
    findByUserId: jest.fn().mockResolvedValue([
      { id: 'account-1', name: 'Checking Account', type: 'CHECKING' },
      { id: 'account-2', name: 'Savings Account', type: 'SAVINGS' }
    ])
  }
}))

jest.mock('@/lib/services/transaction.service', () => ({
  TransactionService: {
    getTransactionSummary: jest.fn().mockResolvedValue({
      totalIncome: 5000,
      totalExpenses: 3000,
      netAmount: 2000
    }),
    findByUserId: jest.fn().mockResolvedValue({
      transactions: [
        {
          id: 'tx-1',
          type: 'EXPENSE',
          amount: 50,
          currency: 'USD',
          description: 'Coffee',
          date: new Date().toISOString(),
          category: { name: 'Food', icon: '🍕' },
          account: { name: 'Checking Account' }
        }
      ],
      totalCount: 1
    }),
    create: jest.fn().mockResolvedValue({
      id: 'new-tx-id',
      type: 'EXPENSE',
      amount: 25,
      currency: 'USD',
      description: 'Test Transaction',
      date: new Date().toISOString()
    })
  }
}))

// Mock Prisma for categories
jest.mock('@/lib/db', () => ({
  prisma: {
    category: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'cat-1', name: 'Food', icon: '🍕', type: 'EXPENSE' },
        { id: 'cat-2', name: 'Salary', icon: '💰', type: 'INCOME' }
      ])
    }
  }
}))

describe('Integration Tests', () => {
  describe('Dashboard Data Loading', () => {
    it('should load complete dashboard data successfully', async () => {
      const result = await getDashboardData()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.dashboardData).toEqual({
        netWorth: 50000,
        totalBalance: 25000,
        totalInvestments: 0,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        netAmount: 2000,
        goalsProgress: 0, // Goals service removed - using placeholder data
        totalGoals: 0,
        completedGoals: 0
      })
      expect(result.data?.recentTransactions).toHaveLength(1)
      expect(result.data?.recentTransactions[0]).toEqual({
        id: 'tx-1',
        type: 'EXPENSE',
        amount: 50,
        currency: 'USD',
        description: 'Coffee',
        date: expect.any(String),
        category: { name: 'Food', icon: '🍕' },
        account: { name: 'Checking Account' }
      })
    })

    it('should handle dashboard data loading errors gracefully', async () => {
      // Mock auth failure
      const mockAuth = require('@/lib/auth')
      mockAuth.verifyAccessToken.mockReturnValueOnce(null)

      const result = await getDashboardData()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })
  })

  describe('Form Data Loading', () => {
    it('should load accounts for transaction form', async () => {
      const result = await getAccountsForForm()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]).toEqual({
        id: 'account-1',
        name: 'Checking Account',
        type: 'CHECKING'
      })
    })

    it('should load categories for transaction form', async () => {
      const result = await getCategoriesForForm('EXPENSE')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]).toEqual({
        id: 'cat-1',
        name: 'Food',
        icon: '🍕',
        type: 'EXPENSE'
      })
    })
  })

  describe('Transaction Creation', () => {
    it('should create transaction successfully', async () => {
      const formData = new FormData()
      formData.append('type', 'EXPENSE')
      formData.append('amount', '25.00')
      formData.append('currency', 'USD')
      formData.append('date', new Date().toISOString())
      formData.append('description', 'Test Transaction')
      formData.append('tags', '[]')
      formData.append('isRecurring', 'false')

      const result = await createTransaction(formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: 'new-tx-id',
        type: 'EXPENSE',
        amount: 25,
        currency: 'USD',
        description: 'Test Transaction',
        date: expect.any(String)
      })
    })

    it('should handle transaction creation errors', async () => {
      // Mock service error
      const mockTransactionService = require('@/lib/services/transaction.service')
      mockTransactionService.TransactionService.create.mockRejectedValueOnce(
        new Error('Database connection failed')
      )

      const formData = new FormData()
      formData.append('type', 'EXPENSE')
      formData.append('amount', '25.00')
      formData.append('currency', 'USD')
      formData.append('date', new Date().toISOString())
      formData.append('description', 'Test Transaction')
      formData.append('tags', '[]')
      formData.append('isRecurring', 'false')

      const result = await createTransaction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('End-to-End Workflow', () => {
    it('should complete full transaction workflow', async () => {
      // 1. Load dashboard data
      const dashboardResult = await getDashboardData()
      expect(dashboardResult.success).toBe(true)

      // 2. Load form data
      const accountsResult = await getAccountsForForm()
      const categoriesResult = await getCategoriesForForm('EXPENSE')
      expect(accountsResult.success).toBe(true)
      expect(categoriesResult.success).toBe(true)

      // 3. Create transaction
      const formData = new FormData()
      formData.append('type', 'EXPENSE')
      formData.append('amount', '50.00')
      formData.append('currency', 'USD')
      formData.append('date', new Date().toISOString())
      formData.append('description', 'Integration Test Transaction')
      formData.append('categoryId', categoriesResult.data?.[0]?.id || '')
      formData.append('accountId', accountsResult.data?.[0]?.id || '')
      formData.append('tags', '[]')
      formData.append('isRecurring', 'false')

      const createResult = await createTransaction(formData)
      expect(createResult.success).toBe(true)

      // 4. Verify dashboard would show updated data
      const updatedDashboardResult = await getDashboardData()
      expect(updatedDashboardResult.success).toBe(true)
    })
  })
})