import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--color-neutral-off)' }}>
      {/* Gradient overlay */}
      <div className="gradient-overlay" />
      
      {/* Floating decorative elements */}
      <div className="fixed top-20 left-10 w-32 h-32 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(168, 192, 154, 0.1)', animation: 'float 20s infinite ease-in-out' }} />
      <div className="fixed bottom-20 right-10 w-40 h-40 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(135, 206, 235, 0.1)', animation: 'float 20s infinite ease-in-out', animationDelay: '10s' }} />
      <div className="fixed top-1/2 left-1/3 w-24 h-24 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(230, 230, 250, 0.1)', animation: 'float 20s infinite ease-in-out', animationDelay: '5s' }} />
      
      <nav className="relative z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Quicksand, sans-serif' }}>Abhyasa</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-600 font-medium">{user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-medium p-8">
          {children}
        </div>
      </main>
    </div>
  )
}