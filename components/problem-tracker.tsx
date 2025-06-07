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
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${isVariant ? 'border-blue-300 ml-8' : 'border-gray-200'}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                Problem {problem.number}
              </h3>
              {isVariant && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  Generated Variant
                </span>
              )}
            </div>
            <p className="text-gray-700">{problem.content}</p>
          </div>
          {problem.flaggedForReview && (
            <span className="ml-4 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
              Flagged
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            {!isTimerActive && !problem.completed && (
              <button
                onClick={handleStartTimer}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Start Timer
              </button>
            )}

            {isTimerActive && (
              <>
                <span className="font-mono text-lg text-gray-700">
                  {formatTime(timeElapsed)}
                </span>
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Mark Complete
                </button>
              </>
            )}

            {problem.completed && (
              <span className="text-green-600 font-medium">✓ Completed</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {showHintButton && isTimerActive && (
              <button
                onClick={handleRequestHint}
                disabled={isGeneratingHint}
                className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                  isGeneratingHint 
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isGeneratingHint ? 'Generating...' : 'Get Hint'}
              </button>
            )}
            
            {!problem.flaggedForReview && (
              <button
                onClick={handleFlag}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Flag for Review
              </button>
            )}

            {problem.completed && !isVariant && (
              <button
                onClick={handleGenerateSimilar}
                disabled={isGeneratingSimilar}
                className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                  isGeneratingSimilar 
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isGeneratingSimilar ? 'Generating...' : 'Generate Similar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {hints.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <button
            onClick={() => setShowHints(!showHints)}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showHints ? 'Hide' : 'Show'} hints ({hints.length})
          </button>
          
          {showHints && (
            <div className="mt-3 space-y-3">
              {hints.map((hint) => (
                <div key={hint.id} className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Hint #{hint.hint_number}
                  </p>
                  <p className="text-sm text-blue-800">{hint.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}