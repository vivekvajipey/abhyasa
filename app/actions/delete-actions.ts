'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function deleteActivity(activityId: string, phaseId: string, goalId: string) {
  const supabase = await createClient()
  
  // Verify ownership
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select(`
      id,
      phases!inner (
        id,
        goals!inner (
          id,
          user_id
        )
      )
    `)
    .eq('id', activityId)
    .single()
  
  if (activityError) {
    throw new Error('Activity not found')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Type assertion for nested query result
  const activityWithRelations = activity as any
  if (!activityWithRelations || activityWithRelations.phases.goals.user_id !== user?.id) {
    throw new Error('Unauthorized')
  }
  
  // Delete the activity (cascade will handle related records)
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)
  
  if (error) {
    throw new Error('Failed to delete activity')
  }
  
  // Update phase status after deletion
  const { updatePhaseStatus } = await import('@/app/dashboard/goals/[goalId]/phases/[phaseId]/update-phase-status')
  await updatePhaseStatus(phaseId)
  
  revalidatePath(`/dashboard/goals/${goalId}/phases/${phaseId}`)
  redirect(`/dashboard/goals/${goalId}/phases/${phaseId}`)
}

export async function deletePhase(phaseId: string, goalId: string) {
  const supabase = await createClient()
  
  // Verify ownership
  const { data: phase, error: phaseError } = await supabase
    .from('phases')
    .select(`
      id,
      goals!inner (
        id,
        user_id
      )
    `)
    .eq('id', phaseId)
    .single()
  
  if (phaseError) {
    throw new Error('Phase not found')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Type assertion for nested query result
  const phaseWithGoal = phase as any
  if (!phaseWithGoal || phaseWithGoal.goals.user_id !== user?.id) {
    throw new Error('Unauthorized')
  }
  
  // Get all phases to reorder
  const { data: allPhases } = await supabase
    .from('phases')
    .select('id, order_index')
    .eq('goal_id', goalId)
    .order('order_index')
  
  // Delete the phase (cascade will handle activities and their progress)
  const { error } = await supabase
    .from('phases')
    .delete()
    .eq('id', phaseId)
  
  if (error) {
    throw new Error('Failed to delete phase')
  }
  
  // Reorder remaining phases
  if (allPhases) {
    const deletedIndex = allPhases.find(p => p.id === phaseId)?.order_index || 0
    const remainingPhases = allPhases.filter(p => p.id !== phaseId && p.order_index > deletedIndex)
    
    for (const phase of remainingPhases) {
      await supabase
        .from('phases')
        .update({ order_index: phase.order_index - 1 })
        .eq('id', phase.id)
    }
  }
  
  revalidatePath(`/dashboard/goals/${goalId}`)
  redirect(`/dashboard/goals/${goalId}`)
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient()
  
  // Verify ownership
  const { data: goal } = await supabase
    .from('goals')
    .select('id, user_id')
    .eq('id', goalId)
    .single()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!goal || goal.user_id !== user?.id) {
    throw new Error('Unauthorized')
  }
  
  // Delete the goal (cascade will handle phases, activities, and all related records)
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
  
  if (error) {
    throw new Error('Failed to delete goal')
  }
  
  revalidatePath('/dashboard')
  redirect('/dashboard')
}