import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSimilarProblem } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { originalProblem, solution } = await request.json()

    if (!originalProblem) {
      return NextResponse.json(
        { error: 'Missing original problem' },
        { status: 400 }
      )
    }

    const newProblem = await generateSimilarProblem(originalProblem, solution)

    return NextResponse.json(newProblem)
  } catch (error) {
    console.error('Error in generate problem API:', error)
    return NextResponse.json(
      { error: 'Failed to generate problem' },
      { status: 500 }
    )
  }
}