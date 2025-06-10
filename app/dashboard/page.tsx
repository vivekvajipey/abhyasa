import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ensureUserExists } from '@/lib/ensure-user'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Please sign in to view your goals</div>
  }

  // Ensure user exists in our database
  try {
    await ensureUserExists(supabase, user.id, user.email!)
  } catch (error) {
    console.error('Error ensuring user exists:', error)
  }
  
  // Fetch user's goals with phases
  const { data: goals } = await supabase
    .from('goals')
    .select(`
      *,
      phases (
        id,
        name,
        status,
        order_index
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  // Format goals data
  const formattedGoals = goals?.map(goal => ({
    ...goal,
    phases: goal.phases || [],
    completedPhases: goal.phases?.filter((p: any) => p.status === 'completed').length || 0,
    totalPhases: goal.phases?.length || 0
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
            href="/dashboard/goals/import"
            className="btn-primary"
          >
            Import Study Plan
          </Link>
        </div>
      </div>

      {/* Goals Section */}
      {formattedGoals.length > 0 ? (
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
      ) : (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-light p-12 text-center">
          <p className="text-gray-600 mb-6 text-lg">No goals found. Create your first learning goal to get started!</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard/goals/new"
              className="btn-primary inline-block"
            >
              Create New Goal
            </Link>
            <Link
              href="/dashboard/goals/import"
              className="btn-secondary inline-block"
            >
              Import Study Plan
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}