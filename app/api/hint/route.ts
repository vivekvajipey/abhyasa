import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateHint } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { problemId, problemContent, hintNumber } = await request.json()

    if (!problemContent || !hintNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const hint = await generateHint(problemContent, hintNumber)

    // In a real app, we'd save this to the database
    // For now, just return the generated hint
    return NextResponse.json({ hint })
  } catch (error) {
    console.error('Error in hint API:', error)
    return NextResponse.json(
      { error: 'Failed to generate hint' },
      { status: 500 }
    )
  }
}