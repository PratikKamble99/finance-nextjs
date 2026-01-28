'use client'

import { useState, useRef } from 'react'
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline'

interface ReceiptUploadProps {
  onFileSelect: (file: File | null) => void
  existingReceiptUrl?: string
  className?: string
}

export default function ReceiptUpload({ onFileSelect, existingReceiptUrl, className = '' }: ReceiptUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    onFileSelect(file)

    if (file) {
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
    } else {
      setPreviewUrl(null)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isValidFile(file)) {
        handleFileSelect(file)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isValidFile(file)) {
        handleFileSelect(file)
      }
    }
  }

  const isValidFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image (JPEG, PNG, GIF) or PDF file.')
      return false
    }

    if (file.size > maxSize) {
      alert('File size must be less than 10MB.')
      return false
    }

    return true
  }

  const clearFile = () => {
    handleFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const viewReceipt = (url: string) => {
    window.open(url, '_blank')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Receipt
      </label>

      {/* Existing Receipt */}
      {existingReceiptUrl && !selectedFile && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Current receipt</span>
            </div>
            <button
              type="button"
              onClick={() => viewReceipt(existingReceiptUrl)}
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              View
            </button>
          </div>
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentIcon className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <div className="text-sm font-medium text-blue-900">{selectedFile.name}</div>
                <div className="text-xs text-blue-600">{formatFileSize(selectedFile.size)}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="text-blue-600 hover:text-blue-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          {/* Image Preview */}
          {previewUrl && (
            <div className="mt-3">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="max-w-full h-32 object-contain rounded border"
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors ${
          dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            <button
              type="button"
              onClick={openFileDialog}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Click to upload
            </button>{' '}
            or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, GIF or PDF up to 10MB
          </p>
        </div>
      </div>

      {/* Upload Tips */}
      <div className="mt-2 text-xs text-gray-500">
        <p>💡 Tips for better receipt scanning:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Ensure good lighting and clear text</li>
          <li>Capture the entire receipt</li>
          <li>Avoid shadows and reflections</li>
        </ul>
      </div>
    </div>
  )
}