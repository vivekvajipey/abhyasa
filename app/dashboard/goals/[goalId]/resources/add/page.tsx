'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ResourceType, Priority } from '@/types/goals'

interface PageProps {
  params: Promise<{ goalId: string }>
}

const resourceTypeDetails = {
  textbook: { 
    label: 'Textbook', 
    icon: '📚',
    placeholder: 'e.g., Zumdahl Chemistry 10th Edition',
    fields: ['author', 'total_pages', 'isbn']
  },
  reading: { 
    label: 'Reading Material', 
    icon: '📖',
    placeholder: 'e.g., Dr. Chen\'s Descriptive Chemistry Guide',
    fields: ['author', 'total_pages', 'url']
  },
  practice_exam: { 
    label: 'Practice Exam', 
    icon: '📝',
    placeholder: 'e.g., 2024 USNCO Local Exam',
    fields: ['total_questions', 'time_limit', 'source_year', 'difficulty']
  },
  problem_set: { 
    label: 'Problem Set', 
    icon: '🧮',
    placeholder: 'e.g., Chapter 5 End-of-Chapter Problems',
    fields: ['total_problems', 'source']
  },
  video: { 
    label: 'Video/Lecture', 
    icon: '🎥',
    placeholder: 'e.g., MIT OCW Thermodynamics Lecture',
    fields: ['author', 'duration', 'url']
  },
  reference: { 
    label: 'Reference Material', 
    icon: '📋',
    placeholder: 'e.g., IUPAC Periodic Table',
    fields: ['url']
  },
  website: { 
    label: 'Website/Forum', 
    icon: '🌐',
    placeholder: 'e.g., AoPS Chemistry Forum',
    fields: ['url']
  },
  other: { 
    label: 'Other Resource', 
    icon: '📁',
    placeholder: 'e.g., Study Group Notes',
    fields: []
  }
}

export default function AddResourcePage({ params }: PageProps) {
  const router = useRouter()
  const [goalId, setGoalId] = useState<string | null>(null)
  const [phases, setPhases] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    type: 'textbook' as ResourceType,
    title: '',
    author: '',
    url: '',
    notes: '',
    phase_id: '',
    priority: 'medium' as Priority,
    // Metadata fields
    total_pages: '',
    total_questions: '',
    total_problems: '',
    time_limit: '',
    source_year: '',
    difficulty: 'medium',
    duration: '',
    isbn: '',
    source: ''
  })

  useEffect(() => {
    params.then(p => {
      setGoalId(p.goalId)
      fetchPhases(p.goalId)
    })
  }, [params])

  const fetchPhases = async (gId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('goal_phases')
      .select('id, name, order_index')
      .eq('goal_id', gId)
      .order('order_index')
    
    setPhases(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalId) return
    
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Build metadata based on resource type
      const metadata: any = {}
      if (formData.type === 'textbook' || formData.type === 'reading') {
        if (formData.total_pages) metadata.total_pages = parseInt(formData.total_pages)
        if (formData.isbn) metadata.isbn = formData.isbn
      }
      if (formData.type === 'practice_exam') {
        if (formData.total_questions) metadata.total_questions = parseInt(formData.total_questions)
        if (formData.time_limit) metadata.time_limit_minutes = parseInt(formData.time_limit)
        if (formData.source_year) metadata.source_year = parseInt(formData.source_year)
        metadata.difficulty_level = formData.difficulty
      }
      if (formData.type === 'problem_set') {
        if (formData.total_problems) metadata.total_problems = parseInt(formData.total_problems)
        if (formData.source) metadata.source = formData.source
      }
      if (formData.type === 'video') {
        if (formData.duration) metadata.duration_minutes = parseInt(formData.duration)
      }

      // Create the resource
      const { data: resource, error: resourceError } = await supabase
        .from('resources')
        .insert({
          user_id: user.id,
          type: formData.type,
          title: formData.title,
          author: formData.author || null,
          url: formData.url || null,
          notes: formData.notes || null,
          metadata: Object.keys(metadata).length > 0 ? metadata : null
        })
        .select()
        .single()

      if (resourceError) throw resourceError

      // Link resource to goal
      const { error: linkError } = await supabase
        .from('goal_resources')
        .insert({
          goal_id: goalId,
          resource_id: resource.id,
          phase_id: formData.phase_id || null,
          priority: formData.priority,
          notes: null
        })

      if (linkError) throw linkError

      // If it's a practice exam, create the practice_exams entry
      if (formData.type === 'practice_exam') {
        const { error: examError } = await supabase
          .from('practice_exams')
          .insert({
            resource_id: resource.id,
            total_questions: parseInt(formData.total_questions) || 60,
            time_limit_minutes: formData.time_limit ? parseInt(formData.time_limit) : null,
            source_year: formData.source_year ? parseInt(formData.source_year) : null,
            difficulty_level: formData.difficulty as any
          })
        
        if (examError) throw examError
      }

      // Redirect back to goal page
      router.push(`/dashboard/goals/${goalId}?tab=resources`)
    } catch (err) {
      console.error('Error creating resource:', err)
      setError(err instanceof Error ? err.message : 'Failed to create resource')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!goalId) {
    return <div>Loading...</div>
  }

  const currentTypeDetails = resourceTypeDetails[formData.type]

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Quicksand, sans-serif' }}>
            Add Learning Resource
          </h1>
          <p className="text-gray-600 mt-2">Add a resource to help achieve your goal</p>
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

        {/* Resource Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Resource Type *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(resourceTypeDetails).map(([type, details]) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type: type as ResourceType })}
                className={`p-3 rounded-2xl border-2 transition-all text-center ${
                  formData.type === type
                    ? 'border-sage bg-sage/10 text-sage-dark'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{details.icon}</div>
                <div className="text-sm font-medium">{details.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            placeholder={currentTypeDetails.placeholder}
          />
        </div>

        {/* Dynamic fields based on resource type */}
        {currentTypeDetails.fields.includes('author') && (
          <div>
            <label htmlFor="author" className="block text-sm font-semibold text-gray-700 mb-2">
              Author/Creator
            </label>
            <input
              type="text"
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
              placeholder="e.g., Steven S. Zumdahl"
            />
          </div>
        )}

        {currentTypeDetails.fields.includes('url') && (
          <div>
            <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-2">
              URL/Link
            </label>
            <input
              type="url"
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
              placeholder="https://..."
            />
          </div>
        )}

        {/* Metadata fields */}
        {formData.type === 'practice_exam' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="total_questions" className="block text-sm font-semibold text-gray-700 mb-2">
                Total Questions
              </label>
              <input
                type="number"
                id="total_questions"
                value={formData.total_questions}
                onChange={(e) => setFormData({ ...formData, total_questions: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
                placeholder="60"
              />
            </div>
            <div>
              <label htmlFor="time_limit" className="block text-sm font-semibold text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                id="time_limit"
                value={formData.time_limit}
                onChange={(e) => setFormData({ ...formData, time_limit: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
                placeholder="110"
              />
            </div>
            <div>
              <label htmlFor="source_year" className="block text-sm font-semibold text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                id="source_year"
                value={formData.source_year}
                onChange={(e) => setFormData({ ...formData, source_year: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
                placeholder="2024"
              />
            </div>
            <div>
              <label htmlFor="difficulty" className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="competition">Competition</option>
              </select>
            </div>
          </div>
        )}

        {(formData.type === 'textbook' || formData.type === 'reading') && (
          <div>
            <label htmlFor="total_pages" className="block text-sm font-semibold text-gray-700 mb-2">
              Total Pages
            </label>
            <input
              type="number"
              id="total_pages"
              value={formData.total_pages}
              onChange={(e) => setFormData({ ...formData, total_pages: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
              placeholder="850"
            />
          </div>
        )}

        {/* Phase and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="phase_id" className="block text-sm font-semibold text-gray-700 mb-2">
              Associated Phase
            </label>
            <select
              id="phase_id"
              value={formData.phase_id}
              onChange={(e) => setFormData({ ...formData, phase_id: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            >
              <option value="">All phases</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  Phase {phase.order_index + 1}: {phase.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none transition-colors resize-none"
            placeholder="Any additional notes about this resource..."
          />
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
                <span>Adding...</span>
              </>
            ) : (
              <span>Add Resource</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}