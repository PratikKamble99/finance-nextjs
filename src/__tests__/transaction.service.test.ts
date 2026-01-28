import { TransactionService } from '@/lib/services/transaction.service'
import { prisma } from '@/lib/db'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    $transaction: jest.fn(),
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tag: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    transactionTag: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

// Mock AccountService
jest.mock('@/lib/services/account.service', () => ({
  AccountService: {
    updateBalance: jest.fn(),
  },
}))

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create transaction with tags successfully', async () => {
      const mockTransaction = {
        id: 'transaction-id',
        userId: 'user-id',
        type: 'EXPENSE',
        amount: 100,
        currency: 'USD',
        date: new Date(),
        description: 'Test transaction',
      }

      const mockTag1 = { id: 'tag-1', name: 'food', userId: 'user-id' }
      const mockTag2 = { id: 'tag-2', name: 'restaurant', userId: 'user-id' }

      const mockTransactionWithTags = {
        ...mockTransaction,
        account: null,
        category: null,
        tags: [
          { tag: mockTag1 },
          { tag: mockTag2 },
        ],
      }

      // Mock the transaction wrapper
      const mockTx = {
        transaction: {
          create: jest.fn().mockResolvedValue(mockTransaction),
          findUnique: jest.fn().mockResolvedValue(mockTransactionWithTags),
        },
        tag: {
          findFirst: jest.fn()
            .mockResolvedValueOnce(mockTag1) // First tag exists
            .mockResolvedValueOnce(null), // Second tag doesn't exist
          create: jest.fn().mockResolvedValue(mockTag2), // Create second tag
        },
        transactionTag: {
          create: jest.fn().mockResolvedValue({}),
        },
      }

      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx)
      })

      const transactionData = {
        type: 'EXPENSE',
        amount: 100,
        currency: 'USD',
        date: new Date().toISOString(),
        description: 'Test transaction',
        tags: ['food', 'restaurant'],
      }

      const result = await TransactionService.create('user-id', transactionData)

      expect(result).toEqual(mockTransactionWithTags)
      expect(mockTx.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'EXPENSE',
          amount: 100,
          currency: 'USD',
          description: 'Test transaction',
          userId: 'user-id',
        }),
      })
      expect(mockTx.tag.findFirst).toHaveBeenCalledTimes(2)
      expect(mockTx.tag.create).toHaveBeenCalledTimes(1)
      expect(mockTx.transactionTag.create).toHaveBeenCalledTimes(2)
    })

    it('should create transaction without tags', async () => {
      const mockTransaction = {
        id: 'transaction-id',
        userId: 'user-id',
        type: 'EXPENSE',
        amount: 100,
        currency: 'USD',
        date: new Date(),
        description: 'Test transaction',
      }

      const mockTransactionWithoutTags = {
        ...mockTransaction,
        account: null,
        category: null,
        tags: [],
      }

      const mockTx = {
        transaction: {
          create: jest.fn().mockResolvedValue(mockTransaction),
          findUnique: jest.fn().mockResolvedValue(mockTransactionWithoutTags),
        },
      }

      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx)
      })

      const transactionData = {
        type: 'EXPENSE',
        amount: 100,
        currency: 'USD',
        date: new Date().toISOString(),
        description: 'Test transaction',
      }

      const result = await TransactionService.create('user-id', transactionData)

      expect(result).toEqual(mockTransactionWithoutTags)
      expect(mockTx.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'EXPENSE',
          amount: 100,
          currency: 'USD',
          description: 'Test transaction',
          userId: 'user-id',
        }),
      })
    })
  })
})