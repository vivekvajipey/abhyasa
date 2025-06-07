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
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-8">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Abhyasa</h1>
            <p className="text-xl text-gray-600">Learning Progress Tracker</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <p className="text-gray-600 mb-8">
              Track your learning journey with intelligent hints and practice problems. 
              Start by signing in with your Google account.
            </p>
            <LoginButton />
          </div>
        </div>
      </div>
    </main>
  )
}