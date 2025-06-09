import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PracticeExamClient from './practice-exam-client'

export default async function PracticeExamPage({ 
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

  // Fetch resource and check it's a practice exam
  const { data: resource, error } = await supabase
    .from('resources')
    .select(`
      *,
      practice_exams (
        id,
        total_questions,
        time_limit_minutes,
        passing_score,
        topics,
        difficulty_level,
        source_year
      )
    `)
    .eq('id', resourceId)
    .eq('user_id', user.id)
    .eq('type', 'practice_exam')
    .single()

  if (error || !resource || !resource.practice_exams?.[0]) {
    redirect('/dashboard')
  }

  const practiceExam = resource.practice_exams[0]

  // Fetch problems associated with this practice exam
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
    .eq('resource_id', resourceId) // Using resource_id to link to resource
    .order('problem_number')

  // Filter progress and hints for current user
  const problemsWithUserData = problems?.map(problem => ({
    ...problem,
    user_progress: problem.user_progress?.filter((p: any) => p.user_id === user.id)?.[0],
    hints: problem.hints?.filter((h: any) => h.user_id === user.id)
  })) || []

  // Check for existing exam attempt
  const { data: currentAttempt } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('practice_exam_id', practiceExam.id)
    .eq('status', 'in_progress')
    .single()

  return (
    <PracticeExamClient 
      resource={resource}
      practiceExam={practiceExam}
      problems={problemsWithUserData}
      currentAttempt={currentAttempt}
      userId={user.id}
    />
  )
}