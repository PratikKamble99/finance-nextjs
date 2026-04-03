import { z } from 'zod'

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
})

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  timezone: z.string().optional(),
})

// Account validation schemas
export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Name too long'),
  type: z.enum(['SAVINGS', 'SALARY', 'CURRENT', 'CASH']),
  bankName: z.string().max(100, 'Bank name too long').optional(),
  accountNumber: z.string().max(50, 'Account number too long').optional(),
  openingBalance: z.number().finite('Invalid opening balance').default(0),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  description: z.string().max(500, 'Description too long').optional(),
  lowBalanceThreshold: z.number().positive('Threshold must be positive').optional(),
})

export const updateAccountSchema = createAccountSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// Transaction validation schemas
export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'Invalid date format'
  ),
  description: z.string().max(500, 'Description too long').optional(),
  categoryId: z.string().min(1, 'Category ID cannot be empty').optional(),
  tags: z.array(z.string()).optional(),
  accountId: z.string().min(1, 'Account ID cannot be empty').optional(),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'BANK']).optional(),
  location: z.any().optional(),
  merchant: z.string().max(100, 'Merchant name too long').optional(),
  receiptUrl: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.any().optional(),
  splits: z.any().optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

// Investment validation schemas
export const createInvestmentSchema = z.object({
  assetType: z.enum(['STOCK', 'MUTUAL_FUND', 'GOLD', 'BOND', 'FD', 'CRYPTO']),
  symbol: z.string().min(1, 'Symbol is required').max(20, 'Symbol too long'),
  name: z.string().min(1, 'Investment name is required').max(200, 'Name too long'),
  quantity: z.number().positive('Quantity must be positive'),
  averagePrice: z.number().positive('Average price must be positive'),
  currentPrice: z.number().positive('Current price must be positive').optional(),
  totalInvested: z.number().positive('Total invested must be positive'),
  broker: z.string().max(100, 'Broker name too long').optional(),
})

export const updateInvestmentSchema = createInvestmentSchema.partial()

// Goal validation schemas
export const createGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  targetAmount: z.number().positive('Target amount must be positive'),
  deadline: z.string().datetime('Invalid deadline format'),
  category: z.enum(['HOUSE', 'VACATION', 'RETIREMENT', 'EDUCATION', 'EMERGENCY', 'CUSTOM']),
  linkedAccounts: z.array(z.string().cuid('Invalid account ID')).optional(),
  linkedInvestments: z.array(z.string().cuid('Invalid investment ID')).optional(),
  monthlyTarget: z.number().positive('Monthly target must be positive').optional(),
})

export const updateGoalSchema = createGoalSchema.partial().extend({
  currentAmount: z.number().min(0, 'Current amount cannot be negative').optional(),
  isActive: z.boolean().optional(),
})

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format').optional(),
  icon: z.string().max(10, 'Icon too long').optional(),
  parentId: z.string().cuid('Invalid parent category ID').optional(),
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
})

// Tag validation schemas
export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format').optional(),
})

export const updateTagSchema = createTagSchema.partial()

// Budget validation schemas
export const createBudgetSchema = z.object({
  categoryId: z.string().cuid('Invalid category ID'),
  amount: z.number().positive('Budget amount must be positive'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
})

export const updateBudgetSchema = createBudgetSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.issues.map((e: any) => e.message).join(', ')}`)
  }
  return result.data
}

export function validatePartialInput<T>(schema: z.ZodSchema<T>, data: unknown): Partial<T> {
  const partialSchema = (schema as any).partial()
  const result = partialSchema.safeParse(data)
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.issues.map((e: any) => e.message).join(', ')}`)
  }
  return result.data
}