import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

export class FileUploadService {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'receipts')
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ]

  static async ensureUploadDir(): Promise<void> {
    if (!existsSync(this.UPLOAD_DIR)) {
      await mkdir(this.UPLOAD_DIR, { recursive: true })
    }
  }

  static async uploadReceipt(file: File, userId: string): Promise<string> {
    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.')
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 10MB.')
    }

    await this.ensureUploadDir()

    // Derive a safe extension from the validated MIME type, not the user-supplied name
    const fileExtension = this.getFileExtension(file.type)
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(8).toString('hex')
    const filename = `${userId}_${timestamp}_${randomString}${fileExtension}`
    const filepath = path.join(this.UPLOAD_DIR, filename)

    // Verify the resolved path is still within the upload directory
    const resolvedPath = path.resolve(filepath)
    if (!resolvedPath.startsWith(path.resolve(this.UPLOAD_DIR))) {
      throw new Error('Invalid file path')
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Write file to disk
    await writeFile(filepath, buffer)

    // Return relative URL for storage in database
    return `/uploads/receipts/${filename}`
  }

  static async uploadReceiptFromBuffer(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string
  ): Promise<string> {
    // Validate file type
    if (!this.ALLOWED_TYPES.includes(mimeType)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.')
    }

    // Validate file size
    if (buffer.length > this.MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 10MB.')
    }

    await this.ensureUploadDir()

    // Derive a safe extension from the validated MIME type, not the user-supplied name
    const fileExtension = this.getFileExtension(mimeType)
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(8).toString('hex')
    const filename = `${userId}_${timestamp}_${randomString}${fileExtension}`
    const filepath = path.join(this.UPLOAD_DIR, filename)

    // Verify the resolved path is still within the upload directory
    const resolvedPath = path.resolve(filepath)
    if (!resolvedPath.startsWith(path.resolve(this.UPLOAD_DIR))) {
      throw new Error('Invalid file path')
    }

    // Write file to disk
    await writeFile(filepath, buffer)

    // Return relative URL for storage in database
    return `/uploads/receipts/${filename}`
  }

  static getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf'
    }
    return extensions[mimeType] || '.bin'
  }

  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.'
      }
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 10MB.'
      }
    }

    return { isValid: true }
  }
}