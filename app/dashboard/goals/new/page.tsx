'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createGoal } from '@/app/actions/goal-actions'

export default function NewGoalPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    start_date: '',
    daily_commitment_hours: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createGoal({
        title: formData.title,
        description: formData.description || undefined,
        target_date: formData.target_date || undefined,
        start_date: formData.start_date || undefined,
        daily_commitment_hours: formData.daily_commitment_hours ? parseFloat(formData.daily_commitment_hours) : undefined
      })

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        // Redirect to the new goal page
        router.push(`/dashboard/goals/${result.data.id}`)
      }
    } catch (err) {
      console.error('Error creating goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to create goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Quicksand, sans-serif' }}>
            Create Learning Goal
          </h1>
          <p className="text-gray-600 mt-2">Define your learning objective and target date</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8 space-y-6">
        {error && (
          <div className="p-4 bg-coral/20 text-coral-dark rounded-2xl">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            Goal Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            placeholder="e.g., Ace the USNCO Local Exam"
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
            placeholder="Describe your goal and what success looks like..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="start_date" className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            />
          </div>
          
          <div>
            <label htmlFor="target_date" className="block text-sm font-semibold text-gray-700 mb-2">
              Target Date
            </label>
            <input
              type="date"
              id="target_date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="daily_commitment" className="block text-sm font-semibold text-gray-700 mb-2">
            Daily Commitment (hours)
          </label>
          <input
            type="number"
            id="daily_commitment"
            value={formData.daily_commitment_hours}
            onChange={(e) => setFormData({ ...formData, daily_commitment_hours: e.target.value })}
            step="0.5"
            min="0"
            max="24"
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            placeholder="e.g., 2.5"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Link
            href="/dashboard"
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
              <span>Create Goal</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}