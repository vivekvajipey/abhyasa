'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProblemTracker } from '@/components/problem-tracker'

// Mock problems data
const mockProblems: Record<string, any[]> = {
  '1': [
    { id: 'p1', number: 1, content: 'Evaluate: 3 + 4 × 5' },
    { id: 'p2', number: 2, content: 'Simplify: 2 × (8 + 3) - 5' },
    { id: 'p3', number: 3, content: 'Calculate: 15 ÷ 3 + 2 × 4' },
  ],
  '2': [
    { id: 'p4', number: 1, content: 'Use the distributive property: 3(x + 5)' },
    { id: 'p5', number: 2, content: 'Expand: 2(3x - 4) + 5' },
    { id: 'p6', number: 3, content: 'Simplify: 4(2a + 3) - 2(a - 1)' },
  ],
}

const sectionNames: Record<string, string> = {
  '1': 'Section 1.1: Order of Operations',
  '2': 'Section 1.2: Distributive Property',
}

export default function SectionClient({ sectionId }: { sectionId: string }) {
  const problems = mockProblems[sectionId] || []
  const sectionName = sectionNames[sectionId] || 'Unknown Section'
  
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
        const { hint, allHints } = await response.json()
        
        setProblemStates(prev => ({
          ...prev,
          [problemId]: { 
            ...prev[problemId], 
            hintsUsed: allHints.length,
            hints: allHints 
          }
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
          problemId: problem.id
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
          href="/dashboard"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Chapters
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">{sectionName}</h2>
      </div>

      <div className="space-y-4">
        {problems.map((problem) => (
          <ProblemTracker
            key={problem.id}
            problem={{
              ...problem,
              ...problemStates[problem.id],
              hints: problemStates[problem.id]?.hints || []
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