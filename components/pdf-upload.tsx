'use client'

import { useState, useRef } from 'react'

interface PdfUploadProps {
  onUpload: (file: File, pageRange?: { start: number; end: number }) => void
}

export function PdfUpload({ onUpload }: PdfUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pageRange, setPageRange] = useState({ start: '1', end: '1' })
  const [usePageRange, setUsePageRange] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF file')
    }
  }

  const isValidPageRange = () => {
    if (!usePageRange) return true
    const start = parseInt(pageRange.start)
    const end = parseInt(pageRange.end)
    return !isNaN(start) && !isNaN(end) && start > 0 && end >= start
  }

  const handleUpload = () => {
    if (!selectedFile || !isValidPageRange()) return
    
    onUpload(
      selectedFile,
      usePageRange ? { 
        start: parseInt(pageRange.start), 
        end: parseInt(pageRange.end) 
      } : undefined
    )
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPageRange({ start: '1', end: '1' })
    setUsePageRange(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload PDF
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
      </div>

      {selectedFile && (
        <>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Selected: <span className="font-medium">{selectedFile.name}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={usePageRange}
                onChange={(e) => setUsePageRange(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Extract specific pages</span>
            </label>

            {usePageRange && (
              <div className="flex items-center space-x-4 pl-6">
                <div>
                  <label className="block text-xs text-gray-600">Start page</label>
                  <input
                    type="text"
                    value={pageRange.start}
                    onChange={(e) => setPageRange(prev => ({ 
                      ...prev, 
                      start: e.target.value
                    }))}
                    className="mt-1 block w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">End page</label>
                  <input
                    type="text"
                    value={pageRange.end}
                    onChange={(e) => setPageRange(prev => ({ 
                      ...prev, 
                      end: e.target.value
                    }))}
                    className="mt-1 block w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    placeholder="1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={!isValidPageRange()}
              className={`px-4 py-2 rounded-md transition-colors ${
                isValidPageRange() 
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Process PDF
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  )
}