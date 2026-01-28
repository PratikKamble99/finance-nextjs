/**
 * Recursively converts Prisma Decimal objects to numbers for client serialization
 */
export function serializePrismaData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data
  }

  // Check if it's a Decimal-like object (has toNumber method)
  if (data && typeof data === 'object' && 'toNumber' in data && typeof (data as any).toNumber === 'function') {
    return (data as any).toNumber() as T
  }

  if (data instanceof Date) {
    return data.toISOString() as T
  }

  if (Array.isArray(data)) {
    return data.map(item => serializePrismaData(item)) as T
  }

  if (typeof data === 'object' && data !== null) {
    const serialized: any = {}
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializePrismaData(value)
    }
    return serialized as T
  }

  return data
}

/**
 * Serializes transaction data specifically for client components
 */
export function serializeTransaction(transaction: any) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    type: transaction.type,
    amount: transaction.amount && typeof transaction.amount === 'object' && 'toNumber' in transaction.amount 
      ? transaction.amount.toNumber() 
      : Number(transaction.amount),
    currency: transaction.currency,
    date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date,
    description: transaction.description,
    categoryId: transaction.categoryId,
    accountId: transaction.accountId,
    paymentMode: transaction.paymentMode,
    location: transaction.location,
    merchant: transaction.merchant,
    receiptUrl: transaction.receiptUrl,
    isRecurring: transaction.isRecurring,
    recurringPattern: transaction.recurringPattern,
    splits: transaction.splits,
    createdAt: transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : transaction.createdAt,
    updatedAt: transaction.updatedAt instanceof Date ? transaction.updatedAt.toISOString() : transaction.updatedAt,
    account: transaction.account ? {
      id: transaction.account.id,
      name: transaction.account.name,
      type: transaction.account.type,
      balance: transaction.account.balance && typeof transaction.account.balance === 'object' && 'toNumber' in transaction.account.balance
        ? transaction.account.balance.toNumber()
        : Number(transaction.account.balance || 0)
    } : null,
    category: transaction.category ? {
      id: transaction.category.id,
      name: transaction.category.name,
      icon: transaction.category.icon,
      type: transaction.category.type
    } : null,
    tags: transaction.tags ? transaction.tags.map((tagRelation: any) => ({
      id: tagRelation.tag.id,
      name: tagRelation.tag.name
    })) : []
  }
}

/**
 * Serializes account data for client components
 */
export function serializeAccount(account: any) {
  return {
    id: account.id,
    userId: account.userId,
    name: account.name,
    type: account.type,
    currentBalance: account.currentBalance && typeof account.currentBalance === 'object' && 'toNumber' in account.currentBalance
      ? account.currentBalance.toNumber()
      : Number(account.currentBalance || 0),
    openingBalance: account.openingBalance && typeof account.openingBalance === 'object' && 'toNumber' in account.openingBalance
      ? account.openingBalance.toNumber()
      : Number(account.openingBalance || 0),
    currency: account.currency,
    bankName: account.bank, // Map bank field to bankName
    accountNumber: account.accountNumber,
    description: account.description,
    isActive: account.isActive,
    createdAt: account.createdAt instanceof Date ? account.createdAt.toISOString() : account.createdAt,
    updatedAt: account.updatedAt instanceof Date ? account.updatedAt.toISOString() : account.updatedAt,
    transactions: account.transactions ? account.transactions.map((transaction: any) => serializeTransaction(transaction)) : []
  }
}