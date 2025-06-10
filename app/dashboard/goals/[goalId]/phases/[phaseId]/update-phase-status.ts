'use server'

import { createClient } from '@/lib/supabase/server'

export async function updatePhaseStatus(phaseId: string) {
  const supabase = await createClient()
  
  // Get all activities for this phase
  const { data: activities } = await supabase
    .from('activities')
    .select('id')
    .eq('phase_id', phaseId)
  
  if (!activities || activities.length === 0) {
    // No activities, keep phase as not_started
    return
  }
  
  // Get progress for all activities
  const activityIds = activities.map(a => a.id)
  const { data: progressRecords } = await supabase
    .from('activity_progress')
    .select('activity_id, status')
    .in('activity_id', activityIds)
  
  const progressMap = new Map(
    progressRecords?.map(p => [p.activity_id, p.status]) || []
  )
  
  // Calculate phase status based on activity progress
  let allCompleted = true
  let anyStarted = false
  
  for (const activity of activities) {
    const status = progressMap.get(activity.id) || 'not_started'
    
    if (status !== 'completed') {
      allCompleted = false
    }
    
    if (status === 'in_progress' || status === 'completed') {
      anyStarted = true
    }
  }
  
  // Determine new phase status
  let newStatus: 'not_started' | 'in_progress' | 'completed'
  if (allCompleted) {
    newStatus = 'completed'
  } else if (anyStarted) {
    newStatus = 'in_progress'
  } else {
    newStatus = 'not_started'
  }
  
  // Update phase status
  const { error } = await supabase
    .from('phases')
    .update({ status: newStatus })
    .eq('id', phaseId)
  
  if (error) {
    console.error('Error updating phase status:', error)
  }
  
  return newStatus
}