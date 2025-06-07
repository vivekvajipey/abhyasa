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
    <div className="space-y-6">
      <div>
        <label className="block text-lg font-semibold text-gray-800 mb-3">
          Upload PDF Document
        </label>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-700 border-2 border-dashed border-sage-light rounded-2xl cursor-pointer bg-sage/5 hover:bg-sage/10 transition-colors py-8 px-4 focus:outline-none focus:border-sage"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg className="w-10 h-10 text-sage mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600">Click to select or drag and drop</p>
            </div>
          </div>
        </div>
      </div>

      {selectedFile && (
        <>
          <div className="p-6 bg-gradient-to-br from-lavender/20 to-lavender/10 rounded-2xl animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-lavender/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-lavender-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-800 font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center space-x-3 group cursor-pointer">
              <input
                type="checkbox"
                checked={usePageRange}
                onChange={(e) => setUsePageRange(e.target.checked)}
                className="w-5 h-5 rounded-lg border-2 border-sage text-sage focus:ring-sage focus:ring-offset-0"
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Extract specific pages</span>
            </label>

            {usePageRange && (
              <div className="flex items-center space-x-6 pl-8 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start page</label>
                  <input
                    type="text"
                    value={pageRange.start}
                    onChange={(e) => setPageRange(prev => ({ 
                      ...prev, 
                      start: e.target.value
                    }))}
                    className="block w-24 px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-sage focus:outline-none transition-colors"
                    placeholder="1"
                  />
                </div>
                <div className="pt-6 text-gray-400">→</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End page</label>
                  <input
                    type="text"
                    value={pageRange.end}
                    onChange={(e) => setPageRange(prev => ({ 
                      ...prev, 
                      end: e.target.value
                    }))}
                    className="block w-24 px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-sage focus:outline-none transition-colors"
                    placeholder="1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-4 pt-2">
            <button
              onClick={handleUpload}
              disabled={!isValidPageRange()}
              className={`px-6 py-3 rounded-3xl font-medium transition-all duration-300 ${
                isValidPageRange() 
                  ? 'bg-gradient-to-r from-coral to-sage text-white hover:-translate-y-0.5 hover:shadow-coral' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Process PDF
            </button>
            <button
              onClick={handleClear}
              className="btn-secondary"
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  )
}