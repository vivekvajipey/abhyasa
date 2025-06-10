import { createClient } from '@/lib/supabase/server'

export async function updateGoalPhaseStatuses(goalId: string) {
  const supabase = await createClient()
  
  // Get all phases for this goal
  const { data: phases } = await supabase
    .from('phases')
    .select('id')
    .eq('goal_id', goalId)
  
  if (!phases || phases.length === 0) return
  
  // Get all activities for all phases
  const phaseIds = phases.map(p => p.id)
  const { data: activities } = await supabase
    .from('activities')
    .select('id, phase_id')
    .in('phase_id', phaseIds)
  
  if (!activities || activities.length === 0) return
  
  // Get all activity progress
  const activityIds = activities.map(a => a.id)
  const { data: progressRecords } = await supabase
    .from('activity_progress')
    .select('activity_id, status')
    .in('activity_id', activityIds)
  
  const progressMap = new Map(
    progressRecords?.map(p => [p.activity_id, p.status]) || []
  )
  
  // Group activities by phase
  const activitiesByPhase = activities.reduce((acc: any, activity) => {
    if (!acc[activity.phase_id]) acc[activity.phase_id] = []
    acc[activity.phase_id].push(activity)
    return acc
  }, {})
  
  // Update each phase status
  for (const phase of phases) {
    const phaseActivities = activitiesByPhase[phase.id] || []
    
    if (phaseActivities.length === 0) continue
    
    let allCompleted = true
    let anyStarted = false
    
    for (const activity of phaseActivities) {
      const status = progressMap.get(activity.id) || 'not_started'
      
      if (status !== 'completed') {
        allCompleted = false
      }
      
      if (status === 'in_progress' || status === 'completed') {
        anyStarted = true
      }
    }
    
    let newStatus: 'not_started' | 'in_progress' | 'completed'
    if (allCompleted) {
      newStatus = 'completed'
    } else if (anyStarted) {
      newStatus = 'in_progress'
    } else {
      newStatus = 'not_started'
    }
    
    // Update phase status
    await supabase
      .from('phases')
      .update({ status: newStatus })
      .eq('id', phase.id)
  }
}

export async function updateGoalStatus(goalId: string) {
  const supabase = await createClient()
  
  // Get all phases for this goal
  const { data: phases } = await supabase
    .from('phases')
    .select('status')
    .eq('goal_id', goalId)
  
  if (!phases || phases.length === 0) return
  
  // Calculate goal status based on phase statuses
  let allCompleted = true
  let anyStarted = false
  
  for (const phase of phases) {
    if (phase.status !== 'completed') {
      allCompleted = false
    }
    
    if (phase.status === 'in_progress' || phase.status === 'completed') {
      anyStarted = true
    }
  }
  
  let newStatus: 'active' | 'completed' | 'paused' | 'archived'
  if (allCompleted) {
    newStatus = 'completed'
  } else {
    newStatus = 'active'
  }
  
  // Update goal status
  await supabase
    .from('goals')
    .update({ status: newStatus })
    .eq('id', goalId)
}