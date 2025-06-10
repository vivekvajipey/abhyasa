import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditGoalForm from './edit-goal-form'

export default async function EditGoalPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Fetch goal with phases to verify ownership
  const { data: goal, error } = await supabase
    .from('goals')
    .select(`
      *,
      phases (
        id,
        name,
        order_index
      )
    `)
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()
  
  if (error || !goal) {
    redirect('/dashboard')
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <EditGoalForm goal={goal} />
    </div>
  )
}