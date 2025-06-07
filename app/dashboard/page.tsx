import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // For now, we'll use hardcoded curriculum data
  // In production, this would come from the database
  const curriculum = {
    id: '1',
    name: 'Art of Problem Solving Pre-Algebra',
    chapters: [
      { id: '1', name: 'Chapter 1: Properties of Arithmetic', sections: 5 },
      { id: '2', name: 'Chapter 2: Exponents', sections: 4 },
      { id: '3', name: 'Chapter 3: Number Theory', sections: 6 },
    ]
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Learning Journey</h2>
        <p className="text-gray-600">Track your progress through structured educational materials</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{curriculum.name}</h3>
          <div className="space-y-4">
            {curriculum.chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/dashboard/chapter/${chapter.id}`}
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
    </div>
  )
}