import { prisma } from '@/lib/db'
import { User } from '../../../prisma/generated/prisma/client'
import { validateInput, createUserSchema, updateUserSchema } from '@/lib/validations'

export class UserService {
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    })
  }

  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    })
  }

  static async create(data: {
    email: string
    passwordHash?: string
    googleId?: string
    name: string
    currency?: string
    timezone?: string
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        googleId: data.googleId,
        name: data.name,
        currency: data.currency || 'USD',
        timezone: data.timezone || 'UTC'
      }
    })
  }

  static async update(id: string, data: Partial<User>): Promise<User> {
    const validatedData = validateInput(updateUserSchema, data)
    
    return prisma.user.update({
      where: { id },
      data: validatedData
    })
  }

  static async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id }
    })
  }

  static async getUserStats(userId: string) {
    const [accountCount, transactionCount, investmentCount, goalCount] = await Promise.all([
      prisma.account.count({ where: { userId } }),
      prisma.transaction.count({ where: { userId } }),
      prisma.investment.count({ where: { userId } }),
      prisma.financialGoal.count({ where: { userId } })
    ])

    return {
      accountCount,
      transactionCount,
      investmentCount,
      goalCount
    }
  }
}