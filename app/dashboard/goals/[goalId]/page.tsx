import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import GoalClient from './goal-client'

export default async function GoalPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Fetch goal with phases and resources
  const { data: goal, error } = await supabase
    .from('goals')
    .select(`
      *,
      phases (
        id,
        name,
        description,
        order_index,
        start_date,
        end_date,
        status
      ),
      goal_resources (
        id,
        resource_id,
        resources (
          id,
          type,
          title,
          author,
          url,
          description,
          metadata
        )
      )
    `)
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()

  if (error || !goal) {
    console.error('Error fetching goal:', error)
    redirect('/dashboard')
  }

  // Sort phases by order
  if (goal.phases) {
    goal.phases.sort((a: any, b: any) => a.order_index - b.order_index)
  }

  // Update phase statuses based on activity progress
  const { updateGoalPhaseStatuses } = await import('@/lib/update-goal-progress')
  await updateGoalPhaseStatuses(goalId)
  
  // Re-fetch goal with updated phase statuses
  const { data: updatedGoal } = await supabase
    .from('goals')
    .select(`
      *,
      phases (
        id,
        name,
        description,
        order_index,
        start_date,
        end_date,
        status
      ),
      goal_resources (
        id,
        resource_id,
        resources (
          id,
          type,
          title,
          author,
          url,
          description,
          metadata
        )
      )
    `)
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()

  return <GoalClient goal={updatedGoal || goal} />
}