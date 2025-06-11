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
    .from('phases')
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
        prerequisite_activity_id,
        metadata,
        resources (
          id,
          type,
          title,
          author,
          url,
          description,
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
    console.error('Error fetching phase:', error)
    redirect(`/dashboard/goals/${goalId}`)
  }

  // Fetch aggregated resources for this phase using the new view
  const { data: phaseResources } = await supabase
    .rpc('get_phase_resources', { p_phase_id: phaseId })
  
  // Count total resources for this phase
  const { data: resourceCount } = await supabase
    .rpc('count_phase_resources', { p_phase_id: phaseId })

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

  // Calculate phase status based on activity progress
  let computedPhaseStatus = phase.status
  if (phase.activities && phase.activities.length > 0) {
    let allCompleted = true
    let anyStarted = false
    
    for (const activity of phase.activities) {
      const progress = progressMap[activity.id]
      const status = progress?.status || 'not_started'
      
      if (status !== 'completed') {
        allCompleted = false
      }
      
      if (status === 'in_progress' || status === 'completed') {
        anyStarted = true
      }
    }
    
    if (allCompleted) {
      computedPhaseStatus = 'completed'
    } else if (anyStarted) {
      computedPhaseStatus = 'in_progress'
    } else {
      computedPhaseStatus = 'not_started'
    }
    
    // Update phase status if it differs from computed
    if (computedPhaseStatus !== phase.status) {
      const { updatePhaseStatus } = await import('./update-phase-status')
      await updatePhaseStatus(phaseId)
    }
  }

  return (
    <PhaseClient 
      phase={{...phase, status: computedPhaseStatus}}
      phaseResources={phaseResources || []}
      resourceCount={resourceCount || 0}
      activityProgress={progressMap}
      goalId={goalId}
      userId={user.id}
    />
  )
}