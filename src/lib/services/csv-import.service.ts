import { TransactionType, PaymentMode } from '../../../prisma/generated/prisma/client'
import { TransactionService } from './transaction.service'

export interface CSVImportResult {
  totalRows: number
  successfulImports: number
  failedImports: number
  errors: string[]
  importedTransactions: any[]
}

export interface CSVTransaction {
  date: string
  description: string
  amount: number
  type?: TransactionType
  category?: string
  paymentMode?: PaymentMode
  merchant?: string
}

export class CSVImportService {
  static async parseCSV(csvContent: string): Promise<CSVTransaction[]> {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row')
    }

    const headers = this.parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
    const transactions: CSVTransaction[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length === 0 || values.every(v => !v.trim())) {
        continue // Skip empty lines
      }

      try {
        const transaction = this.mapRowToTransaction(headers, values)
        if (transaction) {
          transactions.push(transaction)
        }
      } catch (error) {
        console.warn(`Skipping row ${i + 1}: ${error}`)
      }
    }

    return transactions
  }

  static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  static mapRowToTransaction(headers: string[], values: string[]): CSVTransaction | null {
    const row: Record<string, string> = {}
    
    // Map headers to values
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    // Find required fields with flexible header matching
    const dateField = this.findField(row, ['date', 'transaction date', 'trans date', 'posting date'])
    const descriptionField = this.findField(row, ['description', 'memo', 'details', 'transaction details', 'narration'])
    const amountField = this.findField(row, ['amount', 'transaction amount', 'debit', 'credit'])
    
    if (!dateField || !descriptionField || !amountField) {
      throw new Error('Required fields (date, description, amount) not found')
    }

    // Parse date
    const date = this.parseDate(dateField)
    if (!date) {
      throw new Error('Invalid date format')
    }

    // Parse amount
    const amount = this.parseAmount(amountField)
    if (amount === null) {
      throw new Error('Invalid amount format')
    }

    // Determine transaction type
    const type = this.determineTransactionType(row, amount)

    // Extract other fields
    const category = this.findField(row, ['category', 'type', 'transaction type'])
    const merchant = this.findField(row, ['merchant', 'payee', 'vendor'])
    const paymentMode = this.parsePaymentMode(this.findField(row, ['payment mode', 'method', 'card type']))

    return {
      date: date.toISOString(),
      description: descriptionField.trim(),
      amount: Math.abs(amount),
      type,
      category: category || undefined,
      merchant: merchant || undefined,
      paymentMode: paymentMode || undefined
    }
  }

  static findField(row: Record<string, string>, possibleNames: string[]): string | null {
    for (const name of possibleNames) {
      if (row[name] && row[name].trim()) {
        return row[name].trim()
      }
    }
    return null
  }

  static parseDate(dateStr: string): Date | null {
    // Try multiple date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{2}\/\d{2}\/\d{2}$/, // MM/DD/YY
    ]

    const cleanDate = dateStr.trim()
    
    // Try parsing with Date constructor first
    const parsed = new Date(cleanDate)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }

    // Try manual parsing for specific formats
    if (formats[1].test(cleanDate)) { // MM/DD/YYYY
      const [month, day, year] = cleanDate.split('/')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }

    if (formats[2].test(cleanDate)) { // MM-DD-YYYY
      const [month, day, year] = cleanDate.split('-')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }

    return null
  }

  static parseAmount(amountStr: string): number | null {
    // Remove currency symbols, commas, and extra spaces
    const cleaned = amountStr.replace(/[$,\s]/g, '').trim()
    
    // Handle parentheses for negative amounts
    const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')')
    const numberStr = isNegative ? cleaned.slice(1, -1) : cleaned
    
    const amount = parseFloat(numberStr)
    if (isNaN(amount)) {
      return null
    }
    
    return isNegative ? -amount : amount
  }

  static determineTransactionType(row: Record<string, string>, amount: number): TransactionType {
    // Check for explicit type indicators
    const typeField = this.findField(row, ['type', 'transaction type', 'debit/credit'])
    if (typeField) {
      const type = typeField.toLowerCase()
      if (type.includes('credit') || type.includes('deposit') || type.includes('income')) {
        return 'INCOME'
      }
      if (type.includes('debit') || type.includes('withdrawal') || type.includes('expense')) {
        return 'EXPENSE'
      }
    }

    // Check for separate debit/credit columns
    const debitField = this.findField(row, ['debit', 'withdrawal'])
    const creditField = this.findField(row, ['credit', 'deposit'])
    
    if (debitField && parseFloat(debitField.replace(/[$,\s]/g, '')) > 0) {
      return 'EXPENSE'
    }
    if (creditField && parseFloat(creditField.replace(/[$,\s]/g, '')) > 0) {
      return 'INCOME'
    }

    // Fall back to amount sign
    return amount >= 0 ? 'INCOME' : 'EXPENSE'
  }

  static parsePaymentMode(modeStr: string | null): PaymentMode | undefined {
    if (!modeStr) return undefined
    
    const mode = modeStr.toLowerCase()
    if (mode.includes('card') || mode.includes('credit') || mode.includes('debit')) {
      return 'CARD'
    }
    if (mode.includes('upi') || mode.includes('digital')) {
      return 'UPI'
    }
    if (mode.includes('cash')) {
      return 'CASH'
    }
    if (mode.includes('bank') || mode.includes('transfer') || mode.includes('ach')) {
      return 'BANK'
    }
    
    return undefined
  }

  static async importTransactions(
    userId: string,
    accountId: string,
    transactions: CSVTransaction[],
    currency = 'USD'
  ): Promise<CSVImportResult> {
    const result: CSVImportResult = {
      totalRows: transactions.length,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
      importedTransactions: []
    }

    for (const [index, transaction] of transactions.entries()) {
      try {
        const importedTransaction = await TransactionService.create(userId, {
          ...transaction,
          currency,
          accountId
        })
        
        result.successfulImports++
        result.importedTransactions.push(importedTransaction)
      } catch (error) {
        result.failedImports++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Row ${index + 2}: ${errorMessage}`)
      }
    }

    return result
  }

  static generateSampleCSV(): string {
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Payment Mode']
    const sampleData = [
      ['2024-01-15', 'Grocery Store Purchase', '-85.50', 'EXPENSE', 'Food', 'CARD'],
      ['2024-01-16', 'Salary Deposit', '3500.00', 'INCOME', 'Salary', 'BANK'],
      ['2024-01-17', 'Coffee Shop', '-4.75', 'EXPENSE', 'Food', 'CARD'],
      ['2024-01-18', 'Gas Station', '-45.20', 'EXPENSE', 'Transportation', 'CARD'],
      ['2024-01-19', 'Freelance Payment', '500.00', 'INCOME', 'Freelance', 'BANK']
    ]

    const csvLines = [headers.join(',')]
    sampleData.forEach(row => {
      csvLines.push(row.map(field => `"${field}"`).join(','))
    })

    return csvLines.join('\n')
  }
}