'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PdfUpload } from '@/components/pdf-upload'

interface ExtractedCurriculum {
  id: string
  name: string
  subject: string
  chapters: Array<{
    id: string
    name: string
    order: number
    sections: Array<{
      id: string
      name: string
      order: number
      problems: Array<{
        id: string
        number: number
        content: string
        solution?: string
        skills?: string[]
      }>
    }>
  }>
}

export default function UploadPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedCurriculum | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentPageRange, setCurrentPageRange] = useState<{ start: number; end: number } | null>(null)

  const handlePdfUpload = async (file: File, pageRange?: { start: number; end: number }) => {
    setIsProcessing(true)
    setError(null)
    setExtractedData(null)
    setCurrentPageRange(pageRange || null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (pageRange) {
        formData.append('pageRange', JSON.stringify(pageRange))
      }

      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process PDF')
      }

      const { curriculum } = await response.json()
      setExtractedData(curriculum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSave = async () => {
    if (!extractedData) return
    
    setError(null)
    
    try {
      const response = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save curriculum')
      }

      await response.json()
      alert('Curriculum saved successfully!')
      
      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error saving curriculum:', error)
      setError(error instanceof Error ? error.message : 'Failed to save curriculum. Please try again.')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Upload Curriculum</h2>
          <p className="text-gray-600 mt-2">Extract problems and sections from PDF textbooks</p>
        </div>
        <Link
          href="/dashboard"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <PdfUpload onUpload={handlePdfUpload} />

        {isProcessing && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700">
              Processing PDF... This may take a moment.
              {currentPageRange && (
                <span className="block mt-1 text-sm">
                  Extracting pages {currentPageRange.start} to {currentPageRange.end}
                </span>
              )}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {extractedData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Extracted Content</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700">Curriculum Name</h4>
              <p className="text-gray-900">{extractedData.name}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700">Subject</h4>
              <p className="text-gray-900">{extractedData.subject}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700">Structure</h4>
              <div className="mt-2 space-y-3">
                {extractedData.chapters.map((chapter) => (
                  <div key={chapter.id} className="border-l-2 border-gray-200 pl-4">
                    <h5 className="font-medium text-gray-900">
                      Chapter {chapter.order}: {chapter.name}
                    </h5>
                    <div className="mt-2 space-y-1">
                      {chapter.sections.map((section) => (
                        <div key={section.id} className="text-sm text-gray-600 ml-4">
                          • {section.name} ({section.problems.length} problems)
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-600 mb-4">
                Total: {extractedData.chapters.length} chapters, {' '}
                {extractedData.chapters.reduce((acc, ch) => acc + ch.sections.length, 0)} sections, {' '}
                {extractedData.chapters.reduce((acc, ch) => 
                  acc + ch.sections.reduce((secAcc, sec) => secAcc + sec.problems.length, 0), 0
                )} problems
              </p>
              
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Save Curriculum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}