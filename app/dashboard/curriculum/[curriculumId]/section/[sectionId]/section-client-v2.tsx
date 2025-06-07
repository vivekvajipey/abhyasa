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
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/dashboard/curriculum/${curriculumId}`}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Chapters
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{sectionName}</h2>
          <p className="text-sm text-gray-600">{curriculumName}</p>
        </div>
      </div>

      <div className="space-y-4">
        {problems
          .filter(p => !p.parent_problem_id) // Show only parent problems first
          .sort((a, b) => a.problem_number - b.problem_number)
          .map((problem) => {
            const state = problemStates[problem.id] || {}
            const hints = problemHints[problem.id] || []
            const variants = problems.filter(p => p.parent_problem_id === problem.id)
            
            return (
              <div key={problem.id} className="space-y-2">
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

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Progress Summary</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            Total problems: {problems.length} 
            ({problems.filter(p => p.generated).length} generated)
          </p>
          <p>
            Completed: {Object.values(problemStates).filter((s: any) => s.completed).length}
          </p>
          <p>
            Flagged for review: {Object.values(problemStates).filter((s: any) => s.flagged_for_review).length}
          </p>
        </div>
      </div>
    </div>
  )
}