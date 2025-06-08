import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Auth callback - origin:', origin)
  console.log('Auth callback - forwardedHost:', request.headers.get('x-forwarded-host'))
  console.log('Auth callback - NODE_ENV:', process.env.NODE_ENV)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
      
      let redirectUrl
      if (siteUrl) {
        // Use the configured site URL from environment variables
        redirectUrl = `${siteUrl}${next}`
      } else if (isLocalEnv) {
        redirectUrl = `${origin}${next}`
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      } else {
        redirectUrl = `${origin}${next}`
      }
      
      console.log('Auth callback - redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}