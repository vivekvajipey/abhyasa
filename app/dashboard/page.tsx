import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ensureUserExists } from '@/lib/ensure-user'
import { Goal } from '@/types/goals'

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
  
  // Fetch user's goals
  const { data: goals } = await supabase
    .from('goals')
    .select(`
      *,
      goal_phases (
        id,
        name,
        status,
        order_index
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  // Fetch curricula directly from Supabase (legacy support)
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
  
  // Format goals data
  const formattedGoals = goals?.map(goal => ({
    ...goal,
    phases: goal.goal_phases || [],
    completedPhases: goal.goal_phases?.filter((p: any) => p.status === 'completed').length || 0,
    totalPhases: goal.goal_phases?.length || 0
  })) || []

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-quicksand font-bold gradient-text mb-3">Your Learning Goals</h2>
          <p className="text-gray-700 text-lg font-light">Achieve ambitious objectives through structured learning paths</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/goals/new"
            className="btn-primary"
          >
            Create New Goal
          </Link>
          <Link
            href="/dashboard/upload"
            className="btn-secondary text-sm"
          >
            Upload Curriculum
          </Link>
        </div>
      </div>

      {/* Goals Section */}
      {formattedGoals.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-gray-800" style={{ fontFamily: 'Quicksand, sans-serif' }}>Active Goals</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {formattedGoals.map((goal: any, index: number) => (
              <Link
                key={goal.id}
                href={`/dashboard/goals/${goal.id}`}
                className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8 hover:shadow-medium transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-semibold text-gray-800">{goal.title}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    goal.status === 'active' ? 'bg-sage/20 text-sage-dark' :
                    goal.status === 'completed' ? 'bg-sky/20 text-sky-dark' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {goal.status}
                  </span>
                </div>
                
                {goal.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{goal.description}</p>
                )}
                
                {goal.target_date && (
                  <p className="text-sm text-gray-500 mb-4">
                    Target: {new Date(goal.target_date).toLocaleDateString()}
                  </p>
                )}
                
                {goal.totalPhases > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{goal.completedPhases} of {goal.totalPhases} phases</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          background: 'linear-gradient(to right, var(--color-sage), var(--color-sky))',
                          width: `${(goal.completedPhases / goal.totalPhases) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Curricula Section */}
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-gray-800" style={{ fontFamily: 'Quicksand, sans-serif' }}>
          {formattedGoals.length > 0 ? 'Learning Resources' : 'Your Curricula'}
        </h3>
      </div>

      {allCurricula.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-light p-12 text-center">
          <p className="text-gray-600 mb-6 text-lg">No curricula found. Upload your first curriculum to get started!</p>
          <Link
            href="/dashboard/upload"
            className="btn-primary inline-block"
          >
            Upload Curriculum
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {allCurricula.map((curriculum, index) => (
            <div 
              key={curriculum.id} 
              className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-light p-8 card-hover animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <h3 className="text-2xl font-quicksand font-semibold text-gray-800 mb-6">{curriculum.name}</h3>
              <div className="grid gap-4">
                {curriculum.chapters.map((chapter: any) => (
                  <Link
                    key={chapter.id}
                    href={curriculum.id === 'demo' 
                      ? `/dashboard/chapter/${chapter.id}` 
                      : `/dashboard/curriculum/${curriculum.id}/chapter/${chapter.id}`}
                    className="group relative p-6 rounded-2xl border border-gray-100 transition-all duration-300"
                    style={{ 
                      background: 'linear-gradient(to bottom right, white, #f0f0f0)'
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-800 transition-colors">{chapter.name}</h4>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-sm text-gray-600">{chapter.sections} sections</span>
                          <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000"
                              style={{ 
                                background: 'linear-gradient(to right, var(--color-sage), var(--color-sky))',
                                width: `${Math.random() * 60 + 20}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center group-hover:bg-sage/20 transition-colors">
                        <svg className="w-5 h-5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}