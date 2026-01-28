// Re-export Prisma types
export type {
  User,
  Account,
  Transaction,
  Investment,
  FinancialGoal,
  Category,
  Tag,
  Budget,
  TransactionTag,
  AccountType,
  TransactionType,
  PaymentMode,
  AssetType,
  GoalCategory,
  BudgetPeriod,
} from '../../prisma/generated/prisma/client'

// Import types for use in interfaces
import type { TransactionType, PaymentMode, AssetType, GoalCategory, BudgetPeriod } from '../../prisma/generated/prisma/client'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
  }
  accessToken: string
  refreshToken: string
}

// Transaction types
export interface CreateTransactionRequest {
  type: TransactionType
  amount: number
  currency: string
  date: string
  description?: string
  categoryId?: string
  tags?: string[]
  accountId?: string
  paymentMode?: PaymentMode
  location?: any
  merchant?: string
  receiptUrl?: string
  isRecurring?: boolean
  recurringPattern?: any
  splits?: any
}

// Investment types
export interface CreateInvestmentRequest {
  assetType: AssetType
  symbol: string
  name: string
  quantity: number
  averagePrice: number
  currentPrice?: number
  totalInvested: number
  broker?: string
}

// Goal types
export interface CreateGoalRequest {
  name: string
  description?: string
  targetAmount: number
  deadline: string
  category: GoalCategory
  linkedAccounts?: string[]
  linkedInvestments?: string[]
}

// Analytics types
export interface SpendingInsight {
  type: 'overspending' | 'unusual_pattern' | 'saving_opportunity' | 'budget_alert'
  category: string
  message: string
  severity: 'low' | 'medium' | 'high'
  actionable: boolean
  recommendation?: string
}

export interface CategoryPrediction {
  transactionId: string
  predictedCategory: string
  confidence: number
  suggestedTags: string[]
  reasoning: string
}

export interface OCRResult {
  extractedText: string
  detectedAmount?: number
  detectedMerchant?: string
  detectedDate?: Date
  detectedCategory?: string
  confidence: number
  boundingBoxes: any[]
}