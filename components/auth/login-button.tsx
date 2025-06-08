'use client'

import { createClient } from '@/lib/supabase/client'

export function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient()
    
    // Use environment variable if available, otherwise use current origin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const redirectTo = `${siteUrl}/auth/callback`
    
    console.log('OAuth redirect URL:', redirectTo)
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })
  }

  return (
    <button
      onClick={handleLogin}
      className="btn-primary w-full"
    >
      Sign in with Google
    </button>
  )
}