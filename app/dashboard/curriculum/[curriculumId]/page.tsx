import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function fetchCurriculum(curriculumId: string) {
  const supabase = await createClient()
  
  const { data: curriculum, error } = await supabase
    .from('curricula')
    .select(`
      *,
      chapters (
        *,
        sections (
          *,
          problems (*)
        )
      )
    `)
    .eq('id', curriculumId)
    .single()

  if (error || !curriculum) {
    throw new Error('Failed to fetch curriculum')
  }

  // Sort chapters and sections
  curriculum.chapters.sort((a: any, b: any) => a.order_index - b.order_index)
  curriculum.chapters.forEach((chapter: any) => {
    chapter.sections.sort((a: any, b: any) => a.order_index - b.order_index)
  })

  return curriculum
}

export default async function CurriculumPage({ 
  params 
}: { 
  params: Promise<{ curriculumId: string }> 
}) {
  const { curriculumId } = await params
  const curriculum = await fetchCurriculum(curriculumId)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{curriculum.name}</h2>
          <p className="text-gray-600 mt-2">{curriculum.subject}</p>
        </div>
        <Link
          href="/dashboard"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="space-y-6">
        {curriculum.chapters.map((chapter: any) => (
          <div key={chapter.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Chapter {chapter.order_index}: {chapter.name}
              </h3>
              <div className="space-y-4">
                {chapter.sections.map((section: any) => (
                  <Link
                    key={section.id}
                    href={`/dashboard/curriculum/${curriculumId}/section/${section.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">{section.name}</h4>
                      <span className="text-sm text-gray-500">
                        {section.problems.length} problems
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}