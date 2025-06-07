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
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-quicksand font-bold gradient-text">Upload Curriculum</h2>
          <p className="text-gray-700 text-lg mt-2">Extract problems and sections from PDF textbooks</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
        <PdfUpload onUpload={handlePdfUpload} />

        {isProcessing && (
          <div className="mt-6 p-6 bg-gradient-to-br from-sky/20 to-sky/10 rounded-2xl animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-3 border-sky-dark border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-sky-dark font-medium">
                  Processing PDF... This may take a moment.
                </p>
                {currentPageRange && (
                  <span className="block mt-1 text-sm text-sky-dark/80">
                    Extracting pages {currentPageRange.start} to {currentPageRange.end}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-6 bg-gradient-to-br from-coral/20 to-coral/10 rounded-2xl animate-fade-in">
            <p className="text-coral-dark">{error}</p>
          </div>
        )}
      </div>

      {extractedData && (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8 animate-slide-up">
          <h3 className="text-2xl font-quicksand font-semibold text-gray-800 mb-6">Extracted Content</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-sage/10 to-transparent rounded-2xl p-6">
                <h4 className="font-semibold text-sage-dark mb-2">Curriculum Name</h4>
                <p className="text-gray-800">{extractedData.name}</p>
              </div>

              <div className="bg-gradient-to-br from-sky/10 to-transparent rounded-2xl p-6">
                <h4 className="font-semibold text-sky-dark mb-2">Subject</h4>
                <p className="text-gray-800">{extractedData.subject}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Structure</h4>
              <div className="space-y-4">
                {extractedData.chapters.map((chapter, index) => (
                  <div 
                    key={chapter.id} 
                    className="border-l-4 border-lavender-light pl-6 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <h5 className="font-semibold text-gray-800">
                      Chapter {chapter.order}: {chapter.name}
                    </h5>
                    <div className="mt-3 space-y-2">
                      {chapter.sections.map((section) => (
                        <div key={section.id} className="flex items-center space-x-2 text-sm text-gray-600 ml-4">
                          <div className="w-1.5 h-1.5 bg-lavender rounded-full" />
                          <span>{section.name}</span>
                          <span className="text-lavender-dark font-medium">({section.problems.length} problems)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-800">Summary</p>
                  <p className="text-gray-600">
                    {extractedData.chapters.length} chapters • 
                    {extractedData.chapters.reduce((acc, ch) => acc + ch.sections.length, 0)} sections • 
                    {extractedData.chapters.reduce((acc, ch) => 
                      acc + ch.sections.reduce((secAcc, sec) => secAcc + sec.problems.length, 0), 0
                    )} problems
                  </p>
                </div>
                
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-gradient-to-r from-sage to-sage-dark text-white rounded-3xl font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sage"
                >
                  Save Curriculum
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}