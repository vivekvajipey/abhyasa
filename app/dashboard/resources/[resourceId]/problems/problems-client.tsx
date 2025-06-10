'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProblemTracker } from '@/components/problem-tracker'
import { PdfUpload } from '@/components/pdf-upload'

interface ProblemsClientProps {
  resource: any
  problems: any[]
  userId: string
}

export default function ProblemsClient({ 
  resource, 
  problems: initialProblems,
  userId
}: ProblemsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [problems, setProblems] = useState(initialProblems)
  const [isGeneratingHint, setIsGeneratingHint] = useState<string | null>(null)
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [isProcessingPdf, setIsProcessingPdf] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'incomplete' | 'flagged'>('all')

  // Filter problems based on status
  const filteredProblems = problems.filter(p => {
    switch (filterStatus) {
      case 'completed':
        return p.user_progress?.completed
      case 'incomplete':
        return !p.user_progress?.completed
      case 'flagged':
        return p.user_progress?.flagged_for_review
      default:
        return true
    }
  })

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
      formData.append('sectionId', resource.id)
      formData.append('sectionName', resource.title)
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

  // Calculate statistics
  const completedCount = problems.filter(p => p.user_progress?.completed).length
  const flaggedCount = problems.filter(p => p.user_progress?.flagged_for_review).length
  const totalTimeSpent = problems.reduce((acc, p) => acc + (p.user_progress?.time_spent_seconds || 0), 0)
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
          
          {resource.author && (
            <p className="text-gray-600">by {resource.author}</p>
          )}
          
          <div className="flex items-center space-x-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              resource.type === 'textbook' ? 'bg-lavender/20 text-lavender-dark' :
              resource.type === 'problem_set' ? 'bg-coral/20 text-coral-dark' :
              'bg-gray-200 text-gray-600'
            }`}>
              {resource.type === 'textbook' ? '📚 Textbook' : '🧮 Problem Set'}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn-secondary"
        >
          {showUpload ? 'Cancel' : 'Add Problems'}
        </button>
      </div>

      {/* Statistics Overview */}
      {problems.length > 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress Overview</h3>
          
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Problems</p>
              <p className="text-3xl font-bold text-gray-800">{problems.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-sage-dark">{completedCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Flagged</p>
              <p className="text-3xl font-bold text-coral-dark">{flaggedCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Time Spent</p>
              <p className="text-3xl font-bold text-gray-800">
                {Math.round(totalTimeSpent / 60)}m
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
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
        </div>
      )}

      {/* Filter Tabs */}
      {problems.length > 0 && (
        <div className="flex items-center space-x-2">
          {(['all', 'incomplete', 'completed', 'flagged'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                filterStatus === status
                  ? 'bg-sage text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' && `All (${problems.length})`}
              {status === 'incomplete' && `Incomplete (${problems.length - completedCount})`}
              {status === 'completed' && `Completed (${completedCount})`}
              {status === 'flagged' && `Flagged (${flaggedCount})`}
            </button>
          ))}
        </div>
      )}

      {/* PDF Upload Section */}
      {showUpload && (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8 animate-fade-in">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            Upload Problems from PDF
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
      )}

      {/* Problems List */}
      {filteredProblems.length > 0 ? (
        <div className="space-y-6">
          {filteredProblems.map((problem, index) => (
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
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {filterStatus === 'all' 
              ? 'No problems found. Upload a PDF to get started.'
              : `No ${filterStatus} problems.`}
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary"
            >
              Upload Problems
            </button>
          )}
        </div>
      )}
    </div>
  )
}