'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updatePhase } from '@/app/actions/phase-actions'

export default function EditPhaseForm({ phase, goalId }: { phase: any, goalId: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: phase.name || '',
    description: phase.description || '',
    start_date: phase.start_date ? new Date(phase.start_date).toISOString().split('T')[0] : '',
    end_date: phase.end_date ? new Date(phase.end_date).toISOString().split('T')[0] : '',
    status: phase.status || 'not_started'
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await updatePhase(phase.id, {
        name: formData.name,
        description: formData.description || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status as 'not_started' | 'in_progress' | 'completed'
      })
      
      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/dashboard/goals/${goalId}/phases/${phase.id}`)
      }
    } catch (err) {
      setError('Failed to update phase')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Link
          href={`/dashboard/goals/${goalId}/phases/${phase.id}`}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group mb-4"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Phase</span>
        </Link>
        
        <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Quicksand, sans-serif' }}>
          Edit Phase
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Phase Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors resize-none"
          />
        </div>
        
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
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              id="end_date"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            />
          </div>
        </div>
        
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
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}
        
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          
          <Link
            href={`/dashboard/goals/${goalId}/phases/${phase.id}`}
            className="btn-secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}