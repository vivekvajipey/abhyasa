import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditGoalWithAI from './edit-goal-ai-client'

export default async function EditGoalWithAIPage({ params }: { params: { goalId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Fetch goal to verify ownership
  const { data: goal, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', params.goalId)
    .eq('user_id', user.id)
    .single()
  
  if (error || !goal) {
    redirect('/dashboard')
  }
  
  return <EditGoalWithAI goal={goal} />
}