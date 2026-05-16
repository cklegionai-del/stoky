import { useState, useRef, ChangeEvent } from "react"
import { useTranslations } from "next-intl"

interface UploadProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  className?: string
}

export function Upload({ onFileSelect, disabled = false, className = "" }: UploadProps) {
  const t = useTranslations()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        onFileSelect(file)
      }
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        onFileSelect(file)
      }
    }
  }

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      "audio/mp3",
      "audio/wav",
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv"
    ]
    
    const allowedExtensions = [
      ".mp3",
      ".wav",
      ".txt",
      ".pdf",
      ".xlsx",
      ".xls",
      ".csv"
    ]
    
    const fileExtension = file.name.toLowerCase().split(".").pop()
    
    return (
      allowedTypes.includes(file.type) ||
      (fileExtension && allowedExtensions.includes(`.${fileExtension}`))
    )
  }

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".mp3,.wav,.txt,.pdf,.xlsx,.xls,.csv"
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center justify-center space-y-2">
        <svg
          className="w-10 h-10 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16a4 4 0 01-.88-7.583 5 5 0 119.762 0A4 4 0 017 16zm-2 2a4 4 0 00-4 4v1a2 2 0 002 2h10a2 2 0 002-2v-1a4 4 0 00-4-4H9z"
          ></path>
        </svg>
        <p className="text-lg font-medium text-gray-900">
          {t("upload.title")}
        </p>
        <p className="text-sm text-gray-500">
          {t("upload.dragDrop")}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {t("upload.formats")}
        </p>
        <button
          type="button"
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t("upload.browse")}
        </button>
      </div>
    </div>
  )
}
