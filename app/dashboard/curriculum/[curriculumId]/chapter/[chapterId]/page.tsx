import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function fetchChapter(curriculumId: string, chapterId: string) {
  const supabase = await createClient()
  
  // Fetch curriculum with chapters and sections
  const { data: curriculum, error } = await supabase
    .from('curricula')
    .select(`
      *,
      chapters!inner (
        *,
        sections (
          *,
          problems (*)
        )
      )
    `)
    .eq('id', curriculumId)
    .eq('chapters.id', chapterId)
    .single()

  if (error || !curriculum) {
    throw new Error('Failed to fetch curriculum')
  }

  const chapter = curriculum.chapters[0]
  
  return { curriculum, chapter }
}

export default async function ChapterPage({ 
  params 
}: { 
  params: Promise<{ curriculumId: string; chapterId: string }> 
}) {
  const { curriculumId, chapterId } = await params
  const { curriculum, chapter } = await fetchChapter(curriculumId, chapterId)

  if (!chapter) {
    return <div>Chapter not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{chapter.name}</h2>
          <p className="text-sm text-gray-600">{curriculum.name}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {chapter.sections
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((section: any) => (
            <Link
              key={section.id}
              href={`/dashboard/curriculum/${curriculumId}/section/${section.id}`}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">{section.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {section.problems.length} problems
                  </p>
                </div>
                <div className="text-2xl text-gray-300">→</div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  )
}