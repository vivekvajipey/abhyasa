import SectionClient from './section-client'
import { createClient } from '@/lib/supabase/server'

async function fetchSection(curriculumId: string, sectionId: string) {
  const supabase = await createClient()
  
  // Fetch section with its problems
  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select(`
      *,
      problems (*),
      chapters!inner (
        *,
        curriculum:curricula!inner (*)
      )
    `)
    .eq('id', sectionId)
    .single()

  if (sectionError || !section) {
    throw new Error('Failed to fetch section')
  }

  const curriculum = section.chapters.curriculum
  
  // Sort problems by number
  section.problems.sort((a: any, b: any) => a.problem_number - b.problem_number)
  
  return { curriculum, section }
}

export default async function SectionPage({ 
  params 
}: { 
  params: Promise<{ curriculumId: string; sectionId: string }> 
}) {
  const { curriculumId, sectionId } = await params
  const { curriculum, section } = await fetchSection(curriculumId, sectionId)

  if (!section) {
    return <div>Section not found</div>
  }

  return (
    <SectionClient
      curriculumId={curriculumId}
      sectionId={sectionId}
      sectionName={section.name}
      problems={section.problems}
      curriculumName={curriculum.name}
    />
  )
}