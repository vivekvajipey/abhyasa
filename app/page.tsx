import { createClient } from '@/lib/supabase/server'
import { LoginButton } from '@/components/auth/login-button'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--color-neutral-off)' }}>
      {/* Gradient overlay */}
      <div className="gradient-overlay" />
      
      {/* Floating decorative elements */}
      <div className="fixed top-10 right-20 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(230, 230, 250, 0.2)', animation: 'float 20s infinite ease-in-out' }} />
      <div className="fixed bottom-10 left-20 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255, 182, 193, 0.2)', animation: 'float 20s infinite ease-in-out', animationDelay: '7s' }} />
      <div className="fixed top-1/3 left-1/2 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(168, 192, 154, 0.2)', animation: 'float 20s infinite ease-in-out', animationDelay: '14s' }} />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="max-w-4xl mx-auto p-8 text-center animate-fade-in">
          <div className="space-y-12">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold gradient-text mb-4" style={{ fontFamily: 'Quicksand, sans-serif' }}>Abhyasa</h1>
              <p className="text-2xl text-gray-700 font-light">Your Mindful Learning Journey</p>
            </div>
            
            <div className="max-w-md mx-auto space-y-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-light">
                <p className="text-gray-700 mb-8 leading-relaxed">
                  Begin your path to mastery with intelligent guidance, 
                  thoughtful hints, and personalized practice. 
                  Every step forward is progress worth celebrating.
                </p>
                <LoginButton />
              </div>
              
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-sage)' }} />
                  <span>Track Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-sky)' }} />
                  <span>Get Hints</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-coral)' }} />
                  <span>Practice More</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}