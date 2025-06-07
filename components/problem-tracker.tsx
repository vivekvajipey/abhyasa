'use client'

import { useState, useEffect, useRef } from 'react'

interface Problem {
  id: string
  number: number
  content: string
  completed?: boolean
  timeSpent?: number
  hintsUsed?: number
  flaggedForReview?: boolean
  hints?: Array<{
    id: string
    hint_number: number
    content: string
    created_at: string
  }>
}

interface ProblemTrackerProps {
  problem: Problem
  onComplete: (problemId: string, timeSpent: number) => void
  onFlag: (problemId: string) => void
  onRequestHint: (problemId: string, timeSpent: number) => void
  onGenerateSimilar: (problemId: string) => void
  isGeneratingHint?: boolean
  isGeneratingSimilar?: boolean
  isVariant?: boolean
}

export function ProblemTracker({
  problem,
  onComplete,
  onFlag,
  onRequestHint,
  onGenerateSimilar,
  isGeneratingHint = false,
  isGeneratingSimilar = false,
  isVariant = false,
}: ProblemTrackerProps) {
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showHintButton, setShowHintButton] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [hints, setHints] = useState(problem.hints || [])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update hints when problem.hints changes
  useEffect(() => {
    const newHints = problem.hints || []
    if (newHints.length > hints.length) {
      setShowHints(true)
    }
    setHints(newHints)
  }, [problem.hints])

  useEffect(() => {
    if (isTimerActive) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const newTime = prev + 1
          // if (newTime >= 300 && !showHintButton) {
          if (newTime >= 5 && !showHintButton) { // 5 seconds for testing
            setShowHintButton(true)
          }
          return newTime
        })
      }, 1000)
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
  }, [isTimerActive, showHintButton])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartTimer = () => {
    setIsTimerActive(true)
  }

  const handleComplete = () => {
    setIsTimerActive(false)
    onComplete(problem.id, timeElapsed)
  }

  const handleFlag = () => {
    onFlag(problem.id)
  }

  const handleRequestHint = () => {
    onRequestHint(problem.id, timeElapsed)
  }

  const handleGenerateSimilar = () => {
    onGenerateSimilar(problem.id)
  }

  return (
    <div className={`relative bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-light transition-all duration-300 hover:shadow-medium ${
      isVariant ? 'ml-8 border-2 border-sky-light' : ''
    }`}>
      {/* Subtle gradient overlay for variants */}
      {isVariant && (
        <div className="absolute inset-0 bg-gradient-to-br from-sky/5 to-transparent rounded-3xl pointer-events-none" />
      )}
      
      <div className="relative space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-quicksand font-semibold text-gray-800">
                Problem {problem.number}
              </h3>
              {isVariant && (
                <span className="px-3 py-1 text-xs bg-sky/20 text-sky-dark rounded-full font-medium">
                  Generated Variant
                </span>
              )}
            </div>
            <p className="text-gray-700 leading-relaxed">{problem.content}</p>
          </div>
          {problem.flaggedForReview && (
            <span className="ml-4 px-3 py-1 text-xs bg-coral/20 text-coral-dark rounded-full font-medium">
              Flagged
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-100/50">
          <div className="flex items-center space-x-4">
            {!isTimerActive && !problem.completed && (
              <button
                onClick={handleStartTimer}
                className="btn-primary"
              >
                Start Timer
              </button>
            )}

            {isTimerActive && (
              <>
                <div className="flex items-center space-x-2 px-4 py-2 bg-lavender/20 rounded-full">
                  <div className="w-2 h-2 bg-sage rounded-full animate-pulse" />
                  <span className="font-mono text-lg text-gray-700">
                    {formatTime(timeElapsed)}
                  </span>
                </div>
                <button
                  onClick={handleComplete}
                  className="px-6 py-3 bg-gradient-to-r from-sage to-sage-dark text-white rounded-3xl font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sage"
                >
                  Mark Complete
                </button>
              </>
            )}

            {problem.completed && (
              <div className="flex items-center space-x-2 text-sage-dark font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Completed</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {showHintButton && isTimerActive && (
              <button
                onClick={handleRequestHint}
                disabled={isGeneratingHint}
                className={`px-4 py-2 text-sm border-2 rounded-2xl font-medium transition-all duration-300 ${
                  isGeneratingHint 
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'border-lavender text-lavender-dark hover:bg-lavender/20 hover:-translate-y-0.5'
                }`}
              >
                {isGeneratingHint ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-3 h-3 border-2 border-lavender-dark border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </span>
                ) : 'Get Hint'}
              </button>
            )}
            
            {!problem.flaggedForReview && (
              <button
                onClick={handleFlag}
                className="px-4 py-2 text-sm border-2 border-coral text-coral-dark rounded-2xl font-medium hover:bg-coral/20 transition-all duration-300 hover:-translate-y-0.5"
              >
                Flag for Review
              </button>
            )}

            {problem.completed && !isVariant && (
              <button
                onClick={handleGenerateSimilar}
                disabled={isGeneratingSimilar}
                className={`px-4 py-2 text-sm border-2 rounded-2xl font-medium transition-all duration-300 ${
                  isGeneratingSimilar 
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'border-sky text-sky-dark hover:bg-sky/20 hover:-translate-y-0.5'
                }`}
              >
                {isGeneratingSimilar ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-3 h-3 border-2 border-sky-dark border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </span>
                ) : 'Generate Similar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {hints.length > 0 && (
        <div className="mt-6 border-t border-gray-100/50 pt-6">
          <button
            onClick={() => setShowHints(!showHints)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors group"
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${showHints ? 'rotate-90' : ''}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>{showHints ? 'Hide' : 'Show'} hints ({hints.length})</span>
          </button>
          
          {showHints && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {hints.map((hint, index) => (
                <div 
                  key={hint.id} 
                  className="bg-gradient-to-br from-lavender/30 to-lavender/10 p-4 rounded-2xl animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <p className="text-sm font-semibold text-lavender-dark mb-2">
                    Hint #{hint.hint_number}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{hint.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}