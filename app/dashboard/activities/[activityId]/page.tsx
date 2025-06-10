import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ActivityClient from './activity-client'

export default async function ActivityPage({ 
  params 
}: { 
  params: Promise<{ activityId: string }> 
}) {
  const { activityId } = await params
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Fetch activity with its phase, goal, and resource
  const { data: activity, error } = await supabase
    .from('activities')
    .select(`
      *,
      resources (
        id,
        type,
        title,
        author,
        url,
        description,
        metadata
      ),
      phases!inner (
        id,
        name,
        goal_id,
        goals!inner (
          id,
          title,
          user_id
        )
      )
    `)
    .eq('id', activityId)
    .eq('phases.goals.user_id', user.id)
    .single()

  if (error || !activity) {
    console.error('Error fetching activity:', error)
    redirect('/dashboard')
  }

  // Fetch activity progress
  const { data: progress } = await supabase
    .from('activity_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('activity_id', activityId)
    .single()

  return (
    <ActivityClient 
      activity={activity}
      progress={progress}
      userId={user.id}
    />
  )
}