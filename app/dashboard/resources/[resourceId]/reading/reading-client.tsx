'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ReadingClientProps {
  resource: any
  readingProgress: any
  userId: string
}

export default function ReadingClient({ 
  resource, 
  readingProgress: initialProgress,
  userId
}: ReadingClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [currentPage, setCurrentPage] = useState(initialProgress?.bookmarks?.lastPage || 1)
  const [totalPages, setTotalPages] = useState(initialProgress?.total_pages || resource.metadata?.total_pages || 100)
  const [notes, setNotes] = useState(initialProgress?.notes || '')
  const [readingTime, setReadingTime] = useState(initialProgress?.reading_time_minutes || 0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Timer
  useEffect(() => {
    if (isTimerActive) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 60000) // Update every minute
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isTimerActive])

  // Auto-save progress
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (currentPage !== initialProgress?.bookmarks?.lastPage || 
          notes !== initialProgress?.notes) {
        saveProgress()
      }
    }, 2000) // Auto-save after 2 seconds of no changes

    return () => clearTimeout(saveTimeout)
  }, [currentPage, notes])

  const saveProgress = async () => {
    setIsSaving(true)
    
    const totalReadingTime = readingTime + sessionTime
    const bookmarks = {
      lastPage: currentPage,
      savedAt: new Date().toISOString()
    }

    try {
      await supabase
        .from('reading_progress')
        .upsert({
          user_id: userId,
          resource_id: resource.id,
          pages_read: currentPage,
          total_pages: totalPages,
          reading_time_minutes: totalReadingTime,
          completed: currentPage >= totalPages,
          notes,
          bookmarks,
          last_read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error saving progress:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handleMarkComplete = async () => {
    setCurrentPage(totalPages)
    await saveProgress()
    router.back()
  }

  const progressPercentage = (currentPage / totalPages) * 100

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={() => {
                saveProgress()
                router.back()
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          </div>
          
          <h1 className="text-4xl font-bold gradient-text mb-3" style={{ fontFamily: 'Quicksand, sans-serif' }}>
            {resource.title}
          </h1>
          
          {resource.author && (
            <p className="text-gray-600 mb-2">by {resource.author}</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">Reading Progress</p>
            <p className="text-2xl font-bold text-gray-800">
              Page {currentPage} of {totalPages}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Reading Time</p>
            <p className="text-2xl font-bold text-gray-800">
              {readingTime + sessionTime} min
            </p>
          </div>
        </div>
        
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full rounded-full transition-all duration-1000"
            style={{ 
              background: 'linear-gradient(to right, var(--color-lavender), var(--color-sage))',
              width: `${progressPercentage}%` 
            }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{Math.round(progressPercentage)}% Complete</span>
          {isSaving && (
            <span className="text-sm text-sage-dark flex items-center space-x-2">
              <div className="w-3 h-3 border-2 border-sage-dark border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </span>
          )}
        </div>
      </div>

      {/* Page Navigation */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`p-3 rounded-2xl transition-all ${
              currentPage <= 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-lavender/20 text-lavender-dark hover:bg-lavender/30 hover:-translate-x-1'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Page</span>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 text-center border-2 border-gray-200 rounded-xl focus:border-lavender focus:outline-none"
              min={1}
              max={totalPages}
            />
            <span className="text-gray-600">of {totalPages}</span>
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`p-3 rounded-2xl transition-all ${
              currentPage >= totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-lavender/20 text-lavender-dark hover:bg-lavender/30 hover:translate-x-1'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          {!isTimerActive ? (
            <button
              onClick={() => setIsTimerActive(true)}
              className="btn-secondary"
            >
              Start Reading Timer
            </button>
          ) : (
            <button
              onClick={() => {
                setIsTimerActive(false)
                setReadingTime(readingTime + sessionTime)
                setSessionTime(0)
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-coral/20 text-coral-dark rounded-3xl font-medium hover:bg-coral/30 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Pause Timer ({sessionTime} min)</span>
            </button>
          )}
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Reading Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes, thoughts, or key takeaways..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-lavender focus:outline-none resize-none"
            rows={4}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        {currentPage >= totalPages ? (
          <button
            onClick={handleMarkComplete}
            className="btn-primary"
          >
            Mark as Complete
          </button>
        ) : (
          <button
            onClick={() => handlePageChange(totalPages)}
            className="btn-secondary"
          >
            Jump to End
          </button>
        )}
      </div>

      {/* Tips */}
      <div className="bg-lavender/10 rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-lavender-dark mb-3">Reading Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start space-x-2">
            <span className="text-lavender-dark">•</span>
            <span>Use the timer to track your reading speed and improve over time</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-lavender-dark">•</span>
            <span>Take notes as you read to better retain information</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-lavender-dark">•</span>
            <span>Your progress is automatically saved every few seconds</span>
          </li>
        </ul>
      </div>
    </div>
  )
}