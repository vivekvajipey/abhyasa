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

  // Fetch goal with phases, activities, and resources
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
        status,
        activities (
          id,
          title,
          description,
          type,
          order_index,
          estimated_hours,
          resource_id,
          resources (
            id,
            title,
            type
          )
        )
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
    // Sort activities within each phase
    goal.phases.forEach((phase: any) => {
      if (phase.activities) {
        phase.activities.sort((a: any, b: any) => a.order_index - b.order_index)
      }
    })
  }
  
  // Fetch activity progress for all activities
  const activityIds = goal.phases?.flatMap((phase: any) => 
    phase.activities?.map((activity: any) => activity.id) || []
  ) || []
  
  const { data: activityProgress } = await supabase
    .from('activity_progress')
    .select('*')
    .eq('user_id', user.id)
    .in('activity_id', activityIds)
  
  // Create a map of activity progress
  const progressMap = activityProgress?.reduce((acc: any, progress: any) => {
    acc[progress.activity_id] = progress
    return acc
  }, {}) || {}

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
        status,
        activities (
          id,
          title,
          description,
          type,
          order_index,
          estimated_hours,
          resource_id,
          resources (
            id,
            title,
            type
          )
        )
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

  // Attach progress to activities
  const goalWithProgress = updatedGoal || goal
  if (goalWithProgress.phases) {
    goalWithProgress.phases.forEach((phase: any) => {
      if (phase.activities) {
        phase.activities.forEach((activity: any) => {
          activity.progress = progressMap[activity.id] || null
        })
      }
    })
  }
  
  return <GoalClient goal={goalWithProgress} />
}