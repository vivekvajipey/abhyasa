import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProblemSetClient from './problem-set-client'

export default async function ProblemSetPage({ 
  params 
}: { 
  params: Promise<{ resourceId: string }> 
}) {
  const { resourceId } = await params
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Fetch resource and check it's a problem set
  const { data: resource, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .eq('user_id', user.id)
    .eq('type', 'problem_set')
    .single()

  if (error || !resource) {
    redirect('/dashboard')
  }

  // Fetch problems associated with this problem set
  const { data: problems } = await supabase
    .from('problems')
    .select(`
      *,
      user_progress!left (
        completed,
        time_spent_seconds,
        hints_used,
        flagged_for_review
      ),
      hints!left (
        id,
        hint_number,
        content,
        created_at
      )
    `)
    .eq('resource_id', resourceId)
    .order('problem_number')

  // Filter progress and hints for current user
  const problemsWithUserData = problems?.map(problem => ({
    ...problem,
    user_progress: problem.user_progress?.filter((p: any) => p.user_id === user.id)?.[0],
    hints: problem.hints?.filter((h: any) => h.user_id === user.id)
  })) || []

  return (
    <ProblemSetClient 
      resource={resource}
      problems={problemsWithUserData}
      userId={user.id}
    />
  )
}