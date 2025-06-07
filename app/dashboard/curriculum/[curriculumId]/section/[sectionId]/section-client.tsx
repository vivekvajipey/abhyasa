'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProblemTracker } from '@/components/problem-tracker'

interface Problem {
  id: string
  problem_number: number
  content: string
  solution?: string
  skills?: string[]
  generated: boolean
}

interface SectionClientProps {
  curriculumId: string
  sectionId: string
  sectionName: string
  problems: Problem[]
  curriculumName: string
}

export default function SectionClient({
  curriculumId,
  sectionId,
  sectionName,
  problems,
  curriculumName
}: SectionClientProps) {
  const [problemStates, setProblemStates] = useState<Record<string, any>>({})

  const handleComplete = (problemId: string, timeSpent: number) => {
    setProblemStates(prev => ({
      ...prev,
      [problemId]: { ...prev[problemId], completed: true, timeSpent }
    }))
  }

  const handleFlag = (problemId: string) => {
    setProblemStates(prev => ({
      ...prev,
      [problemId]: { ...prev[problemId], flaggedForReview: true }
    }))
  }

  const handleRequestHint = async (problemId: string, timeSpent: number) => {
    const problem = problems.find(p => p.id === problemId)
    if (!problem) return

    const hintsUsed = (problemStates[problemId]?.hintsUsed || 0) + 1

    try {
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          problemContent: problem.content,
          hintNumber: hintsUsed,
        }),
      })

      if (response.ok) {
        const { hint } = await response.json()
        alert(`Hint #${hintsUsed}: ${hint}`)
        
        setProblemStates(prev => ({
          ...prev,
          [problemId]: { ...prev[problemId], hintsUsed }
        }))
      }
    } catch (error) {
      console.error('Error requesting hint:', error)
      alert('Failed to generate hint. Please try again.')
    }
  }

  const handleGenerateSimilar = async (problemId: string) => {
    const problem = problems.find(p => p.id === problemId)
    if (!problem) return

    try {
      const response = await fetch('/api/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalProblem: problem.content,
          solution: problem.solution
        }),
      })

      if (response.ok) {
        const newProblem = await response.json()
        alert(`New problem generated:\n\n${newProblem.content}\n\nSolution: ${newProblem.solution}`)
      }
    } catch (error) {
      console.error('Error generating problem:', error)
      alert('Failed to generate similar problem. Please try again.')
    }
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
        {problems.map((problem) => (
          <ProblemTracker
            key={problem.id}
            problem={{
              id: problem.id,
              number: problem.problem_number,
              content: problem.content,
              ...problemStates[problem.id]
            }}
            onComplete={handleComplete}
            onFlag={handleFlag}
            onRequestHint={handleRequestHint}
            onGenerateSimilar={handleGenerateSimilar}
          />
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Progress Summary</h3>
        <p className="text-sm text-gray-600">
          Completed: {Object.values(problemStates).filter((s: any) => s.completed).length} / {problems.length}
        </p>
      </div>
    </div>
  )
}