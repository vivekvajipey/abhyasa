import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PhaseClient from './phase-client'

export default async function PhasePage({ 
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

  // Fetch phase with activities and resources
  const { data: phase, error } = await supabase
    .from('goal_phases')
    .select(`
      *,
      activities (
        id,
        resource_id,
        type,
        title,
        description,
        estimated_hours,
        order_index,
        target_score,
        pages_to_read,
        problems_to_solve,
        prerequisite_activity_id,
        resources (
          id,
          type,
          title,
          author,
          url,
          notes,
          metadata
        )
      ),
      goals!inner (
        id,
        title,
        user_id
      )
    `)
    .eq('id', phaseId)
    .eq('goals.user_id', user.id)
    .single()

  if (error || !phase) {
    redirect(`/dashboard/goals/${goalId}`)
  }

  // Fetch resources associated with this phase
  const { data: phaseResources } = await supabase
    .from('goal_resources')
    .select(`
      *,
      resources (
        id,
        type,
        title,
        author,
        url,
        notes,
        metadata,
        curricula (
          id,
          name
        )
      )
    `)
    .eq('goal_id', goalId)
    .eq('phase_id', phaseId)
    .order('priority')

  // Fetch activity progress for the user
  const activityIds = phase.activities?.map((a: any) => a.id) || []
  const { data: activityProgress } = await supabase
    .from('activity_progress')
    .select('*')
    .eq('user_id', user.id)
    .in('activity_id', activityIds)

  // Create a map of progress by activity ID
  const progressMap = activityProgress?.reduce((acc: any, prog: any) => {
    acc[prog.activity_id] = prog
    return acc
  }, {}) || {}

  // Sort activities by order
  if (phase.activities) {
    phase.activities.sort((a: any, b: any) => a.order_index - b.order_index)
  }

  return (
    <PhaseClient 
      phase={phase}
      phaseResources={phaseResources || []}
      activityProgress={progressMap}
      goalId={goalId}
    />
  )
}