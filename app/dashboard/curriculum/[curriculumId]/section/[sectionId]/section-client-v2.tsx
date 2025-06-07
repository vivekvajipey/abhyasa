'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProblemTracker } from '@/components/problem-tracker'

interface Problem {
  id: string
  problem_number: number
  content: string
  solution?: string
  skills?: string[]
  generated: boolean
  parent_problem_id?: string
}

interface UserProgress {
  completed: boolean
  time_spent_seconds?: number
  hints_used: number
  flagged_for_review: boolean
  started_at?: string
  completed_at?: string
}

interface SectionClientProps {
  curriculumId: string
  sectionId: string
  sectionName: string
  initialProblems: Problem[]
  curriculumName: string
}

export default function SectionClient({
  curriculumId,
  sectionId,
  sectionName,
  initialProblems,
  curriculumName
}: SectionClientProps) {
  const [problems, setProblems] = useState(initialProblems)
  const [problemStates, setProblemStates] = useState<Record<string, UserProgress>>({})
  const [problemHints, setProblemHints] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [generatingHint, setGeneratingHint] = useState<string | null>(null)
  const [generatingSimilar, setGeneratingSimilar] = useState<string | null>(null)

  // Fetch user progress and hints on mount
  useEffect(() => {
    fetchUserProgress()
  }, [])

  const fetchUserProgress = async () => {
    try {
      const problemIds = problems.map(p => p.id).join(',')
      const response = await fetch(`/api/progress?problemIds=${problemIds}`)
      
      if (response.ok) {
        const { progress } = await response.json()
        setProblemStates(progress)
      }

      // Also fetch hints for all problems
      const hintsResponse = await fetch(`/api/hints?problemIds=${problemIds}`)
      if (hintsResponse.ok) {
        const { hints } = await hintsResponse.json()
        console.log('Fetched hints:', hints) // Debug log
        setProblemHints(hints)
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (problemId: string, timeSpent: number) => {
    setProblemStates(prev => ({
      ...prev,
      [problemId]: { 
        ...prev[problemId], 
        completed: true, 
        time_spent_seconds: timeSpent 
      }
    }))

    // Save to database
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          completed: true,
          timeSpentSeconds: timeSpent,
          action: 'complete'
        }),
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const handleFlag = async (problemId: string) => {
    setProblemStates(prev => ({
      ...prev,
      [problemId]: { 
        ...prev[problemId], 
        flagged_for_review: true 
      }
    }))

    // Save to database
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          flaggedForReview: true,
          action: 'flag'
        }),
      })
    } catch (error) {
      console.error('Error saving flag:', error)
    }
  }

  const handleRequestHint = async (problemId: string, timeSpent: number) => {
    const problem = problems.find(p => p.id === problemId)
    if (!problem) return

    const currentHints = problemHints[problemId] || []
    const hintNumber = currentHints.length + 1

    setGeneratingHint(problemId)

    try {
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          problemContent: problem.content,
          hintNumber,
        }),
      })

      if (response.ok) {
        const { hint, allHints } = await response.json()
        console.log('Received hints:', allHints) // Debug log
        
        // Update hints state
        setProblemHints(prev => {
          const newHints = {
            ...prev,
            [problemId]: allHints
          }
          console.log('Updated problemHints:', newHints) // Debug log
          return newHints
        })

        // Update problem states with hint count
        setProblemStates(prev => ({
          ...prev,
          [problemId]: { 
            ...prev[problemId], 
            hints_used: allHints.length 
          }
        }))
        
        // Force a re-render by updating problems to trigger hint display
        setProblems(prev => [...prev])
      }
    } catch (error) {
      console.error('Error requesting hint:', error)
    } finally {
      setGeneratingHint(null)
    }
  }

  const handleGenerateSimilar = async (problemId: string) => {
    const problem = problems.find(p => p.id === problemId)
    if (!problem) return

    setGeneratingSimilar(problemId)

    try {
      const response = await fetch('/api/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalProblem: problem.content,
          solution: problem.solution,
          sectionId,
          problemId: problem.id
        }),
      })

      if (response.ok) {
        const newProblem = await response.json()
        
        // Add the new problem to the list
        const problemToAdd: Problem = {
          id: newProblem.id,
          problem_number: newProblem.problem_number,
          content: newProblem.content,
          solution: newProblem.solution,
          generated: true,
          skills: [],
          parent_problem_id: problemId
        }
        
        setProblems(prev => [...prev, problemToAdd])
      }
    } catch (error) {
      console.error('Error generating problem:', error)
    } finally {
      setGeneratingSimilar(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading your problems...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/curriculum/${curriculumId}`}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Chapters</span>
          </Link>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-quicksand font-bold gradient-text">{sectionName}</h2>
          <p className="text-gray-600 mt-1">{curriculumName}</p>
        </div>
      </div>

      <div className="space-y-6">
        {problems
          .filter(p => !p.parent_problem_id) // Show only parent problems first
          .sort((a, b) => a.problem_number - b.problem_number)
          .map((problem, index) => {
            const state = problemStates[problem.id] || {}
            const hints = problemHints[problem.id] || []
            const variants = problems.filter(p => p.parent_problem_id === problem.id)
            
            return (
              <div 
                key={problem.id} 
                className="space-y-3 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProblemTracker
                  problem={{
                    id: problem.id,
                    number: problem.problem_number,
                    content: problem.content,
                    completed: state.completed,
                    timeSpent: state.time_spent_seconds,
                    hintsUsed: state.hints_used,
                    flaggedForReview: state.flagged_for_review,
                    hints
                  }}
                  onComplete={handleComplete}
                  onFlag={handleFlag}
                  onRequestHint={handleRequestHint}
                  onGenerateSimilar={handleGenerateSimilar}
                  isGeneratingHint={generatingHint === problem.id}
                  isGeneratingSimilar={generatingSimilar === problem.id}
                />
                
                {/* Render variants */}
                {variants.map((variant) => {
                  const variantState = problemStates[variant.id] || {}
                  const variantHints = problemHints[variant.id] || []
                  
                  return (
                    <ProblemTracker
                      key={variant.id}
                      problem={{
                        id: variant.id,
                        number: variant.problem_number,
                        content: variant.content,
                        completed: variantState.completed,
                        timeSpent: variantState.time_spent_seconds,
                        hintsUsed: variantState.hints_used,
                        flaggedForReview: variantState.flagged_for_review,
                        hints: variantHints
                      }}
                      onComplete={handleComplete}
                      onFlag={handleFlag}
                      onRequestHint={handleRequestHint}
                      onGenerateSimilar={handleGenerateSimilar}
                      isGeneratingHint={generatingHint === variant.id}
                      isGeneratingSimilar={generatingSimilar === variant.id}
                      isVariant={true}
                    />
                  )
                })}
              </div>
            )
          })}
      </div>

      <div className="mt-12 p-8 bg-gradient-to-br from-sage/10 to-sky/10 rounded-3xl">
        <h3 className="font-quicksand font-semibold text-xl text-gray-800 mb-4">Your Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{problems.length}</p>
                <p className="text-sm text-gray-600">Total Problems</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-sky/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {Object.values(problemStates).filter((s: any) => s.completed).length}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-coral/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-coral-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {Object.values(problemStates).filter((s: any) => s.flagged_for_review).length}
                </p>
                <p className="text-sm text-gray-600">Flagged</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}