'use client'

import { createClient } from '@/lib/supabase/client'

export function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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