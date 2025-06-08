'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PhaseStatus } from '@/types/goals'

interface PageProps {
  params: Promise<{ goalId: string }>
}

export default function NewPhasePage({ params }: PageProps) {
  const router = useRouter()
  const [goalId, setGoalId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingPhases, setExistingPhases] = useState<number>(0)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_start_date: '',
    target_end_date: '',
    status: 'not_started' as PhaseStatus
  })

  // Get goalId from params
  params.then(p => {
    setGoalId(p.goalId)
    // Fetch existing phases count
    fetchExistingPhases(p.goalId)
  })

  const fetchExistingPhases = async (gId: string) => {
    const supabase = createClient()
    const { count } = await supabase
      .from('goal_phases')
      .select('*', { count: 'exact', head: true })
      .eq('goal_id', gId)
    
    setExistingPhases(count || 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalId) return
    
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Create the phase
      const { data: phase, error: phaseError } = await supabase
        .from('goal_phases')
        .insert({
          goal_id: goalId,
          name: formData.name,
          description: formData.description || null,
          target_start_date: formData.target_start_date || null,
          target_end_date: formData.target_end_date || null,
          status: formData.status,
          order_index: existingPhases
        })
        .select()
        .single()

      if (phaseError) throw phaseError

      // Redirect back to goal page
      router.push(`/dashboard/goals/${goalId}?tab=phases`)
    } catch (err) {
      console.error('Error creating phase:', err)
      setError(err instanceof Error ? err.message : 'Failed to create phase')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!goalId) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Quicksand, sans-serif' }}>
            Create Learning Phase
          </h1>
          <p className="text-gray-600 mt-2">Define a phase or step in your learning goal</p>
        </div>
        <Link
          href={`/dashboard/goals/${goalId}`}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Goal</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8 space-y-6">
        {error && (
          <div className="p-4 bg-coral/20 text-coral-dark rounded-2xl">
            {error}
          </div>
        )}

        <div className="p-4 bg-lavender/20 rounded-2xl">
          <p className="text-sm text-gray-700">
            This will be phase #{existingPhases + 1} in your learning journey
          </p>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            Phase Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            placeholder="e.g., Foundation - Core Chemistry Concepts"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors resize-none"
            placeholder="Describe what this phase covers and its objectives..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="target_start_date" className="block text-sm font-semibold text-gray-700 mb-2">
              Target Start Date
            </label>
            <input
              type="date"
              id="target_start_date"
              value={formData.target_start_date}
              onChange={(e) => setFormData({ ...formData, target_start_date: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="target_end_date" className="block text-sm font-semibold text-gray-700 mb-2">
              Target End Date
            </label>
            <input
              type="date"
              id="target_end_date"
              value={formData.target_end_date}
              onChange={(e) => setFormData({ ...formData, target_end_date: e.target.value })}
              min={formData.target_start_date}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Link
            href={`/dashboard/goals/${goalId}`}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Phase</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}