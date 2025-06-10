import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditPhaseForm from './edit-phase-form'

export default async function EditPhasePage({ params }: { params: { goalId: string, phaseId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const { data: phase, error } = await supabase
    .from('phases')
    .select('*, goals!inner(user_id)')
    .eq('id', params.phaseId)
    .eq('goals.user_id', user.id)
    .single()
  
  if (error || !phase) {
    redirect(`/dashboard/goals/${params.goalId}`)
  }
  
  return <EditPhaseForm phase={phase} goalId={params.goalId} />
}