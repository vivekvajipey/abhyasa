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

    // Save hint to database
    const { data: hintData, error: hintError } = await supabase
      .from('hints')
      .insert({
        problem_id: problemId,
        user_id: user.id,
        hint_number: hintNumber,
        content: hint
      })
      .select()
      .single()

    if (hintError) {
      console.error('Error saving hint:', hintError)
      return NextResponse.json(
        { error: 'Failed to save hint' },
        { status: 500 }
      )
    }

    // Get all hints for this problem
    const { data: allHints } = await supabase
      .from('hints')
      .select('*')
      .eq('problem_id', problemId)
      .eq('user_id', user.id)
      .order('hint_number', { ascending: true })

    return NextResponse.json({ 
      hint: hintData,
      allHints: allHints || []
    })
  } catch (error) {
    console.error('Error in hint API:', error)
    return NextResponse.json(
      { error: 'Failed to generate hint' },
      { status: 500 }
    )
  }
}