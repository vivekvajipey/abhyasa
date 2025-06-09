'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProblemTracker } from '@/components/problem-tracker'
import { PdfUpload } from '@/components/pdf-upload'

interface PracticeExamClientProps {
  resource: any
  practiceExam: any
  problems: any[]
  currentAttempt: any
  userId: string
}

export default function PracticeExamClient({ 
  resource, 
  practiceExam, 
  problems: initialProblems, 
  currentAttempt: initialAttempt,
  userId
}: PracticeExamClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [problems, setProblems] = useState(initialProblems)
  const [currentAttempt, setCurrentAttempt] = useState(initialAttempt)
  const [examStarted, setExamStarted] = useState(!!currentAttempt)
  const [examCompleted, setExamCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isGeneratingHint, setIsGeneratingHint] = useState<string | null>(null)
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(problems.length === 0)
  const [isProcessingPdf, setIsProcessingPdf] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate initial time remaining if exam is in progress
  useEffect(() => {
    if (currentAttempt && practiceExam.time_limit_minutes) {
      const startTime = new Date(currentAttempt.started_at).getTime()
      const now = Date.now()
      const elapsedMinutes = (now - startTime) / 1000 / 60
      const remaining = practiceExam.time_limit_minutes - elapsedMinutes
      
      if (remaining > 0) {
        setTimeRemaining(Math.floor(remaining * 60)) // Convert to seconds
      } else {
        // Time's up
        handleSubmitExam()
      }
    }
  }, [currentAttempt, practiceExam.time_limit_minutes])

  // Timer countdown
  useEffect(() => {
    if (examStarted && timeRemaining !== null && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleSubmitExam()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [examStarted, timeRemaining])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartExam = async () => {
    if (problems.length === 0) {
      alert('Please upload problems first')
      return
    }

    // Create exam attempt
    const { data: attempt, error } = await supabase
      .from('exam_attempts')
      .insert({
        user_id: userId,
        practice_exam_id: practiceExam.id,
        started_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .select()
      .single()

    if (error) {
      console.error('Error starting exam:', error)
      return
    }

    setCurrentAttempt(attempt)
    setExamStarted(true)
    if (practiceExam.time_limit_minutes) {
      setTimeRemaining(practiceExam.time_limit_minutes * 60)
    }
  }

  const handleSubmitExam = async () => {
    if (!currentAttempt) return

    // Calculate score
    const completedProblems = problems.filter(p => p.user_progress?.completed).length
    const score = Math.round((completedProblems / problems.length) * 100)

    // Update attempt
    const { error } = await supabase
      .from('exam_attempts')
      .update({
        completed_at: new Date().toISOString(),
        score,
        status: 'completed',
        time_taken_minutes: practiceExam.time_limit_minutes || 
          Math.floor((Date.now() - new Date(currentAttempt.started_at).getTime()) / 1000 / 60)
      })
      .eq('id', currentAttempt.id)

    if (!error) {
      setExamCompleted(true)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const handleProblemComplete = async (problemId: string, timeSpent: number) => {
    // Update local state
    setProblems(prev => prev.map(p => 
      p.id === problemId 
        ? { ...p, user_progress: { ...p.user_progress, completed: true, time_spent_seconds: timeSpent } }
        : p
    ))

    // Update database
    await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        problem_id: problemId,
        completed: true,
        time_spent_seconds: timeSpent,
        updated_at: new Date().toISOString()
      })
  }

  const handleProblemFlag = async (problemId: string) => {
    // Update local state
    setProblems(prev => prev.map(p => 
      p.id === problemId 
        ? { ...p, user_progress: { ...p.user_progress, flagged_for_review: true } }
        : p
    ))

    // Update database
    await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        problem_id: problemId,
        flagged_for_review: true,
        updated_at: new Date().toISOString()
      })
  }

  const handleRequestHint = async (problemId: string, timeSpent: number) => {
    setIsGeneratingHint(problemId)
    
    try {
      const response = await fetch('/api/hints/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, timeSpent })
      })

      if (response.ok) {
        const { hint } = await response.json()
        
        // Update local state with new hint
        setProblems(prev => prev.map(p => {
          if (p.id === problemId) {
            const updatedHints = [...(p.hints || []), hint]
            return { ...p, hints: updatedHints }
          }
          return p
        }))
      }
    } catch (error) {
      console.error('Error generating hint:', error)
    } finally {
      setIsGeneratingHint(null)
    }
  }

  const handleGenerateSimilar = async (problemId: string) => {
    setIsGeneratingSimilar(problemId)
    
    try {
      const response = await fetch('/api/problems/generate-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, resourceId: resource.id })
      })

      if (response.ok) {
        // Refresh problems list
        const { data: updatedProblems } = await supabase
          .from('problems')
          .select(`
            *,
            user_progress!left (
              completed,
              time_spent_seconds,
              hints_used,
              flagged_for_review
            ),
            hints!left (
              id,
              hint_number,
              content,
              created_at
            )
          `)
          .eq('resource_id', resource.id)
          .order('problem_number')

        if (updatedProblems) {
          const problemsWithUserData = updatedProblems.map(problem => ({
            ...problem,
            user_progress: problem.user_progress?.filter((p: any) => p.user_id === userId)?.[0],
            hints: problem.hints?.filter((h: any) => h.user_id === userId)
          }))
          setProblems(problemsWithUserData)
        }
      }
    } catch (error) {
      console.error('Error generating similar problem:', error)
    } finally {
      setIsGeneratingSimilar(null)
    }
  }

  const handlePdfUpload = async (file: File, pageRange?: { start: number; end: number }) => {
    setIsProcessingPdf(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('resourceId', resource.id)
      formData.append('resourceName', resource.title)
      if (pageRange) {
        formData.append('startPage', pageRange.start.toString())
        formData.append('endPage', pageRange.end.toString())
      }

      const response = await fetch('/api/problems/extract', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        // Refresh problems list
        const { data: updatedProblems } = await supabase
          .from('problems')
          .select(`
            *,
            user_progress!left (
              completed,
              time_spent_seconds,
              hints_used,
              flagged_for_review
            ),
            hints!left (
              id,
              hint_number,
              content,
              created_at
            )
          `)
          .eq('resource_id', resource.id)
          .order('problem_number')

        if (updatedProblems) {
          const problemsWithUserData = updatedProblems.map(problem => ({
            ...problem,
            user_progress: problem.user_progress?.filter((p: any) => p.user_id === userId)?.[0],
            hints: problem.hints?.filter((h: any) => h.user_id === userId)
          }))
          setProblems(problemsWithUserData)
          setShowUpload(false)
        }
      }
    } catch (error) {
      console.error('Error processing PDF:', error)
    } finally {
      setIsProcessingPdf(false)
    }
  }

  // Calculate progress
  const completedCount = problems.filter(p => p.user_progress?.completed).length
  const progressPercentage = problems.length > 0 ? (completedCount / problems.length) * 100 : 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={() => router.back()}
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
          
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            <span className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{practiceExam.total_questions} questions</span>
            </span>
            
            {practiceExam.time_limit_minutes && (
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{practiceExam.time_limit_minutes} min limit</span>
              </span>
            )}
            
            {practiceExam.difficulty_level && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                practiceExam.difficulty_level === 'hard' ? 'bg-coral/20 text-coral-dark' :
                practiceExam.difficulty_level === 'medium' ? 'bg-sage/20 text-sage-dark' :
                'bg-sky/20 text-sky-dark'
              }`}>
                {practiceExam.difficulty_level}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Exam Status Bar */}
      {examStarted && !examCompleted && (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-800">
                  {completedCount} / {problems.length}
                </p>
              </div>
              
              {timeRemaining !== null && (
                <div className={`${timeRemaining < 300 ? 'text-coral' : 'text-gray-700'}`}>
                  <p className="text-sm text-gray-600">Time Remaining</p>
                  <p className="text-2xl font-bold font-mono">
                    {formatTime(timeRemaining)}
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={handleSubmitExam}
              className="btn-primary"
            >
              Submit Exam
            </button>
          </div>
          
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{ 
                background: 'linear-gradient(to right, var(--color-sage), var(--color-sky))',
                width: `${progressPercentage}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Exam Results */}
      {examCompleted && currentAttempt && (
        <div className="bg-gradient-to-br from-sky/20 to-sage/20 rounded-3xl p-8 text-center animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Exam Complete!</h2>
          
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-sm text-gray-600 mb-1">Score</p>
              <p className={`text-4xl font-bold ${
                currentAttempt.score >= (practiceExam.passing_score || 70) ? 'text-sage-dark' : 'text-coral-dark'
              }`}>
                {currentAttempt.score}%
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Questions</p>
              <p className="text-4xl font-bold text-gray-800">
                {completedCount}/{problems.length}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Time</p>
              <p className="text-4xl font-bold text-gray-800">
                {currentAttempt.time_taken_minutes || 0} min
              </p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Back to Phase
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Review Answers
            </button>
          </div>
        </div>
      )}

      {/* Start Exam / Upload Problems */}
      {!examStarted && !examCompleted && (
        <>
          {problems.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                No problems found. Upload a PDF to get started.
              </h3>
              <PdfUpload onUpload={handlePdfUpload} />
              {isProcessingPdf && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center space-x-2 text-sage-dark">
                    <div className="w-4 h-4 border-2 border-sage-dark border-t-transparent rounded-full animate-spin" />
                    <span>Processing PDF...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8 text-center">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Ready to Start?
              </h3>
              <p className="text-gray-600 mb-6">
                You have {practiceExam.time_limit_minutes} minutes to complete {problems.length} questions.
              </p>
              <button
                onClick={handleStartExam}
                className="btn-primary text-lg px-8 py-4"
              >
                Start Exam
              </button>
            </div>
          )}
        </>
      )}

      {/* Problems List */}
      {problems.length > 0 && (examStarted || examCompleted) && (
        <div className="space-y-6">
          {showUpload && (
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add More Problems</h3>
              <PdfUpload onUpload={handlePdfUpload} />
            </div>
          )}
          
          {problems.map((problem, index) => (
            <div key={problem.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <ProblemTracker
                problem={{
                  id: problem.id,
                  number: problem.problem_number,
                  content: problem.content,
                  completed: problem.user_progress?.completed || false,
                  timeSpent: problem.user_progress?.time_spent_seconds || 0,
                  hintsUsed: problem.user_progress?.hints_used || 0,
                  flaggedForReview: problem.user_progress?.flagged_for_review || false,
                  hints: problem.hints || []
                }}
                onComplete={handleProblemComplete}
                onFlag={handleProblemFlag}
                onRequestHint={handleRequestHint}
                onGenerateSimilar={handleGenerateSimilar}
                isGeneratingHint={isGeneratingHint === problem.id}
                isGeneratingSimilar={isGeneratingSimilar === problem.id}
              />
            </div>
          ))}
          
          {!showUpload && (
            <div className="text-center">
              <button
                onClick={() => setShowUpload(true)}
                className="btn-secondary"
              >
                Add More Problems
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}