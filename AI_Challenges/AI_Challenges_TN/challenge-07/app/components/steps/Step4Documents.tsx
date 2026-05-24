'use client'

import { useRef } from 'react'
import type { DocState } from '../../types/wizard'

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_SIZE_MB = 10

interface Props {
  docs: DocState[]
  isMajorDental: boolean
  claimType: string
  onFileSelect: (docType: string, file: File) => void
  onRemove: (docType: string) => void
  onMajorDentalChange: (val: boolean) => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocUploadCard({
  doc,
  onFileSelect,
  onRemove,
}: {
  doc: DocState
  onFileSelect: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isDone = doc.status === 'done'
  const isUploading = doc.status === 'uploading'
  const hasError = doc.status === 'error'

  return (
    <div
      className={[
        'rounded-xl border-2 p-4 transition-all',
        isDone
          ? 'border-green-300 bg-green-50'
          : hasError
          ? 'border-red-300 bg-red-50'
          : doc.required
          ? 'border-gray-200 bg-white'
          : 'border-dashed border-gray-200 bg-gray-50',
      ].join(' ')}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-medium text-sm text-gray-900">{doc.label}</span>
          {doc.required ? (
            <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Required</span>
          ) : (
            <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Optional</span>
          )}
        </div>
        {isDone && (
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {isDone && doc.file ? (
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate">{doc.file.name}</span>
            <span className="text-gray-400 shrink-0">{formatSize(doc.file.size)}</span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="ml-2 text-xs text-red-600 hover:text-red-800 shrink-0"
          >
            Remove
          </button>
        </div>
      ) : isUploading ? (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Uploading...</span>
            <span>{doc.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-200"
              style={{ width: `${doc.progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div>
          {hasError && doc.errorMsg && (
            <p className="text-xs text-red-600 mb-2">{doc.errorMsg}</p>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload file
          </button>
          <p className="text-xs text-gray-400 mt-1">PDF, JPG or PNG · max {MAX_SIZE_MB}MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileSelect(file)
              e.target.value = ''
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function Step4Documents({
  docs,
  isMajorDental,
  claimType,
  onFileSelect,
  onRemove,
  onMajorDentalChange,
}: Props) {
  const requiredMissing = docs.filter((d) => d.required && d.status !== 'done')

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Document Upload</h2>
      <p className="text-gray-500 text-sm mb-6">
        Upload the required documents for your claim. PDF, JPG, and PNG files accepted (max 10MB each).
      </p>

      {claimType === 'dental' && (
        <label className="flex items-center gap-3 mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={isMajorDental}
            onChange={(e) => onMajorDentalChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            This is a major dental procedure
            <span className="ml-1 text-gray-400 font-normal">(crowns, bridges, implants, dentures)</span>
          </span>
        </label>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {docs.map((doc) => (
          <DocUploadCard
            key={doc.docType}
            doc={doc}
            onFileSelect={(file) => onFileSelect(doc.docType, file)}
            onRemove={() => onRemove(doc.docType)}
          />
        ))}
      </div>

      {requiredMissing.length > 0 && (
        <div className="mt-4 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>
            Still required:{' '}
            {requiredMissing.map((d) => d.label).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}
