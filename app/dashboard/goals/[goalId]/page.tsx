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
      goal_phases (
        id,
        name,
        description,
        order_index,
        target_start_date,
        target_end_date,
        status
      ),
      goal_resources (
        id,
        resource_id,
        priority,
        notes,
        resources (
          id,
          type,
          title,
          author,
          url,
          notes,
          metadata
        )
      )
    `)
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()

  if (error || !goal) {
    redirect('/dashboard')
  }

  // Sort phases by order
  if (goal.goal_phases) {
    goal.goal_phases.sort((a: any, b: any) => a.order_index - b.order_index)
  }

  return <GoalClient goal={goal} />
}