import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ensureUserExists } from '@/lib/ensure-user'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Please sign in to view your curricula</div>
  }

  // Ensure user exists in our database
  try {
    await ensureUserExists(supabase, user.id, user.email!)
  } catch (error) {
    console.error('Error ensuring user exists:', error)
  }
  
  // Fetch curricula directly from Supabase
  const { data: curricula } = await supabase
    .from('curricula')
    .select(`
      *,
      chapters (
        id,
        name,
        order_index,
        sections: sections(count)
      )
    `)
    .order('created_at', { ascending: false })
  
  const formattedCurricula = curricula?.map(curriculum => ({
    id: curriculum.id,
    name: curriculum.name,
    subject: curriculum.subject,
    description: curriculum.description,
    chapters: curriculum.chapters
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((chapter: any) => ({
        id: chapter.id,
        name: chapter.name,
        sections: chapter.sections[0]?.count || 0
      }))
  })) || []
  
  // Also include the hardcoded curriculum for demo purposes
  const demoCurriculum = {
    id: 'demo',
    name: 'Demo: Art of Problem Solving Pre-Algebra',
    chapters: [
      { id: '1', name: 'Chapter 1: Properties of Arithmetic', sections: 5 },
      { id: '2', name: 'Chapter 2: Exponents', sections: 4 },
      { id: '3', name: 'Chapter 3: Number Theory', sections: 6 },
    ]
  }
  
  const allCurricula = [...formattedCurricula, demoCurriculum]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Learning Journey</h2>
          <p className="text-gray-600">Track your progress through structured educational materials</p>
        </div>
        <Link
          href="/dashboard/upload"
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Upload New Curriculum
        </Link>
      </div>

      {allCurricula.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No curricula found. Upload your first curriculum to get started!</p>
          <Link
            href="/dashboard/upload"
            className="inline-block px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Upload Curriculum
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {allCurricula.map((curriculum) => (
            <div key={curriculum.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{curriculum.name}</h3>
                <div className="space-y-4">
                  {curriculum.chapters.map((chapter: any) => (
                    <Link
                      key={chapter.id}
                      href={curriculum.id === 'demo' 
                        ? `/dashboard/chapter/${chapter.id}` 
                        : `/dashboard/curriculum/${curriculum.id}/chapter/${chapter.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">{chapter.name}</h4>
                        <span className="text-sm text-gray-500">{chapter.sections} sections</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}