import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewActivityPage({ 
  params 
}: { 
  params: Promise<{ goalId: string; phaseId: string }> 
}) {
  const { goalId, phaseId } = await params
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Verify the phase belongs to the user's goal
  const { data: phase, error } = await supabase
    .from('phases')
    .select(`
      *,
      goals!inner (
        user_id
      )
    `)
    .eq('id', phaseId)
    .eq('goals.user_id', user.id)
    .single()

  if (error || !phase) {
    redirect('/dashboard')
  }

  // Get resources associated with this goal
  const { data: goalResources } = await supabase
    .from('goal_resources')
    .select(`
      *,
      resources (
        id,
        type,
        title,
        author
      )
    `)
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })

  // Get existing activities to determine order
  const { data: existingActivities } = await supabase
    .from('activities')
    .select('order_index')
    .eq('phase_id', phaseId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextOrderIndex = existingActivities?.[0]?.order_index ? existingActivities[0].order_index + 1 : 1

  async function createActivity(formData: FormData) {
    'use server'
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    const resourceId = formData.get('resourceId') as string
    const estimatedHours = formData.get('estimatedHours') as string
    const targetScore = formData.get('targetScore') as string
    const pagesToRead = formData.get('pagesToRead') as string
    const problemsToSolve = formData.get('problemsToSolve') as string
    
    const { error } = await supabase
      .from('activities')
      .insert({
        phase_id: phaseId,
        title,
        description: description || null,
        type,
        resource_id: resourceId || null,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
        target_score: targetScore ? parseInt(targetScore) : null,
        pages_to_read: pagesToRead ? parseInt(pagesToRead) : null,
        problems_to_solve: problemsToSolve ? parseInt(problemsToSolve) : null,
        order_index: nextOrderIndex
      })
    
    if (!error) {
      redirect(`/dashboard/goals/${goalId}/phases/${phaseId}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-3" style={{ fontFamily: 'Quicksand, sans-serif' }}>
          Create New Activity
        </h1>
        <p className="text-gray-600">
          Add a learning activity to {phase.name}
        </p>
      </div>

      <form action={createActivity} className="space-y-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Activity Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              placeholder="e.g., Read Chapter 1: Introduction to Chemistry"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-sage focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Provide additional details about this activity..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-sage focus:outline-none resize-none"
            />
          </div>

          {/* Activity Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Activity Type *
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-sage focus:outline-none"
            >
              <option value="">Select type...</option>
              <option value="read">📖 Read</option>
              <option value="watch">🎥 Watch</option>
              <option value="practice">✏️ Practice</option>
              <option value="exam">📝 Take Exam</option>
              <option value="review">🔍 Review</option>
              <option value="assess">📊 Self-Assess</option>
              <option value="other">📋 Other</option>
            </select>
          </div>

          {/* Resource Selection */}
          <div>
            <label htmlFor="resourceId" className="block text-sm font-medium text-gray-700 mb-2">
              Associated Resource
            </label>
            <select
              id="resourceId"
              name="resourceId"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-sage focus:outline-none"
            >
              <option value="">No specific resource</option>
              {goalResources?.map((gr) => (
                <option key={gr.id} value={gr.resources?.id}>
                  {gr.resources?.title} ({gr.resources?.type})
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Link this activity to a specific resource
            </p>
          </div>

          {/* Estimated Hours */}
          <div>
            <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Time (hours)
            </label>
            <input
              type="number"
              id="estimatedHours"
              name="estimatedHours"
              step="0.5"
              min="0"
              placeholder="e.g., 2.5"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-sage focus:outline-none"
            />
          </div>

          {/* Type-specific fields */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Activity-Specific Goals (Optional)</h3>
            
            {/* Target Score (for exams/assessments) */}
            <div>
              <label htmlFor="targetScore" className="block text-sm font-medium text-gray-700 mb-2">
                Target Score (%)
              </label>
              <input
                type="number"
                id="targetScore"
                name="targetScore"
                min="0"
                max="100"
                placeholder="e.g., 85"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-sage focus:outline-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                For exam or assessment activities
              </p>
            </div>

            {/* Pages to Read */}
            <div>
              <label htmlFor="pagesToRead" className="block text-sm font-medium text-gray-700 mb-2">
                Pages to Read
              </label>
              <input
                type="number"
                id="pagesToRead"
                name="pagesToRead"
                min="0"
                placeholder="e.g., 25"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-sage focus:outline-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                For reading activities
              </p>
            </div>

            {/* Problems to Solve */}
            <div>
              <label htmlFor="problemsToSolve" className="block text-sm font-medium text-gray-700 mb-2">
                Problems to Solve
              </label>
              <input
                type="number"
                id="problemsToSolve"
                name="problemsToSolve"
                min="0"
                placeholder="e.g., 10"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-sage focus:outline-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                For practice activities
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <a
            href={`/dashboard/goals/${goalId}/phases/${phaseId}`}
            className="btn-secondary"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="btn-primary"
          >
            Create Activity
          </button>
        </div>
      </form>
    </div>
  )
}