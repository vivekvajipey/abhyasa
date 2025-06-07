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
}

interface ProblemTrackerProps {
  problem: Problem
  onComplete: (problemId: string, timeSpent: number) => void
  onFlag: (problemId: string) => void
  onRequestHint: (problemId: string, timeSpent: number) => void
  onGenerateSimilar: (problemId: string) => void
}

export function ProblemTracker({
  problem,
  onComplete,
  onFlag,
  onRequestHint,
  onGenerateSimilar,
}: ProblemTrackerProps) {
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showHintButton, setShowHintButton] = useState(false)
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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Problem {problem.number}
            </h3>
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
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Get Hint
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

            {problem.completed && (
              <button
                onClick={handleGenerateSimilar}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Generate Similar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}