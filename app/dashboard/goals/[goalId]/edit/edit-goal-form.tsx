'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateGoal } from '@/app/actions/goal-actions'

interface EditGoalFormProps {
  goal: any
}

export default function EditGoalForm({ goal }: EditGoalFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize form with existing goal data
  const [formData, setFormData] = useState({
    title: goal.title || '',
    description: goal.description || '',
    target_date: goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : '',
    start_date: goal.start_date ? new Date(goal.start_date).toISOString().split('T')[0] : '',
    daily_commitment_hours: goal.daily_commitment_hours?.toString() || '',
    status: goal.status || 'active'
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await updateGoal(goal.id, {
        title: formData.title,
        description: formData.description || null,
        target_date: formData.target_date || null,
        start_date: formData.start_date || null,
        daily_commitment_hours: formData.daily_commitment_hours ? parseFloat(formData.daily_commitment_hours) : null,
        status: formData.status as 'active' | 'completed' | 'paused'
      })
      
      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/dashboard/goals/${goal.id}`)
      }
    } catch (err) {
      setError('Failed to update goal')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href={`/dashboard/goals/${goal.id}`}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Goal</span>
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold gradient-text mb-2" style={{ fontFamily: 'Quicksand, sans-serif' }}>
          Edit Goal
        </h1>
        <p className="text-gray-600">Update your learning goal details</p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Goal Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
              placeholder="e.g., Master Chemistry for USNCO"
            />
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors resize-none"
              placeholder="Describe your learning goal and what you hope to achieve..."
            />
          </div>
          
          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
              />
            </div>
            
            <div>
              <label htmlFor="target_date" className="block text-sm font-medium text-gray-700 mb-2">
                Target Completion Date
              </label>
              <input
                type="date"
                id="target_date"
                value={formData.target_date}
                onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
              />
            </div>
          </div>
          
          {/* Daily Commitment */}
          <div>
            <label htmlFor="daily_commitment" className="block text-sm font-medium text-gray-700 mb-2">
              Daily Commitment (hours)
            </label>
            <input
              type="number"
              id="daily_commitment"
              value={formData.daily_commitment_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, daily_commitment_hours: e.target.value }))}
              step="0.5"
              min="0"
              max="24"
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
              placeholder="e.g., 2.5"
            />
          </div>
          
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          {/* Phases Info */}
          {goal.phases && goal.phases.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-sm text-gray-600">
                This goal has {goal.phases.length} phase{goal.phases.length !== 1 ? 's' : ''}. 
                To modify phases, use the <Link href={`/dashboard/goals/${goal.id}/edit-with-ai`} className="text-sage-dark hover:underline">AI editor</Link> or edit them individually.
              </p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}
          
          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            
            <Link
              href={`/dashboard/goals/${goal.id}`}
              className="btn-secondary"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}