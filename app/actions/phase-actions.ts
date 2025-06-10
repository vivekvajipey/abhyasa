'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdatePhaseData {
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: 'not_started' | 'in_progress' | 'completed'
}

export async function updatePhase(phaseId: string, data: UpdatePhaseData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }
  
  // Verify ownership through goal
  const { data: phase } = await supabase
    .from('phases')
    .select('id, goal_id, goals!inner(user_id)')
    .eq('id', phaseId)
    .eq('goals.user_id', user.id)
    .single()
  
  if (!phase) {
    return { error: 'Phase not found or unauthorized' }
  }
  
  // Update the phase
  const { data: updatedPhase, error } = await supabase
    .from('phases')
    .update({
      name: data.name,
      description: data.description,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', phaseId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating phase:', error)
    return { error: 'Failed to update phase' }
  }
  
  revalidatePath(`/dashboard/goals/${phase.goal_id}/phases/${phaseId}`)
  revalidatePath(`/dashboard/goals/${phase.goal_id}`)
  
  return { data: updatedPhase }
}