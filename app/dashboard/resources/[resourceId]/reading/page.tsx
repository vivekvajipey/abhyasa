import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReadingClient from './reading-client'

export default async function ReadingPage({ 
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

  // Fetch resource
  const { data: resource, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .eq('user_id', user.id)
    .in('type', ['reading', 'textbook', 'reference'])
    .single()

  if (error || !resource) {
    redirect('/dashboard')
  }

  // Fetch reading progress
  const { data: readingProgress } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('resource_id', resourceId)
    .eq('user_id', user.id)
    .single()

  return (
    <ReadingClient 
      resource={resource}
      readingProgress={readingProgress}
      userId={user.id}
    />
  )
}