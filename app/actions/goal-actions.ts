'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdateGoalData {
  title: string
  description: string | null
  target_date: string | null
  start_date: string | null
  daily_commitment_hours: number | null
  status: 'active' | 'completed' | 'paused'
}

export async function updateGoal(goalId: string, data: UpdateGoalData) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }
  
  // Verify ownership
  const { data: existingGoal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()
  
  if (!existingGoal) {
    return { error: 'Goal not found or unauthorized' }
  }
  
  // Update the goal
  const { data: updatedGoal, error } = await supabase
    .from('goals')
    .update({
      title: data.title,
      description: data.description,
      target_date: data.target_date,
      start_date: data.start_date,
      daily_commitment_hours: data.daily_commitment_hours,
      status: data.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', goalId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating goal:', error)
    return { error: 'Failed to update goal' }
  }
  
  revalidatePath(`/dashboard/goals/${goalId}`)
  revalidatePath('/dashboard')
  
  return { data: updatedGoal }
}

export async function createGoal(data: {
  title: string
  description?: string
  target_date?: string
  start_date?: string
  daily_commitment_hours?: number
}) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }
  
  // Create the goal
  const { data: newGoal, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      target_date: data.target_date || null,
      start_date: data.start_date || null,
      daily_commitment_hours: data.daily_commitment_hours || null,
      status: 'active'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating goal:', error)
    return { error: 'Failed to create goal' }
  }
  
  revalidatePath('/dashboard')
  
  return { data: newGoal }
}