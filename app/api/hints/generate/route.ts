import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateHint } from '@/lib/gemini'
import { ensureUserExists } from '@/lib/ensure-user'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in our database
    await ensureUserExists(supabase, user.id, user.email!)

    const { problemId, timeSpent } = await request.json()

    if (!problemId) {
      return NextResponse.json(
        { error: 'Problem ID is required' },
        { status: 400 }
      )
    }

    // Fetch the problem
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('*')
      .eq('id', problemId)
      .single()

    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      )
    }

    // Get existing hints count
    const { data: existingHints } = await supabase
      .from('hints')
      .select('hint_number')
      .eq('problem_id', problemId)
      .eq('user_id', user.id)
      .order('hint_number', { ascending: false })
      .limit(1)

    const nextHintNumber = existingHints?.[0]?.hint_number ? existingHints[0].hint_number + 1 : 1

    // Generate hint using Gemini
    const hint = await generateHint(problem.content, nextHintNumber)

    // Save hint to database
    const { data: hintData, error: hintError } = await supabase
      .from('hints')
      .insert({
        problem_id: problemId,
        user_id: user.id,
        hint_number: nextHintNumber,
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

    // Update user progress hints count
    const { data: progress } = await supabase
      .from('user_progress')
      .select('hints_used')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single()

    if (progress) {
      await supabase
        .from('user_progress')
        .update({ 
          hints_used: (progress.hints_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('problem_id', problemId)
    } else {
      // Create progress entry if it doesn't exist
      await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          problem_id: problemId,
          hints_used: 1,
          time_spent_seconds: timeSpent || 0
        })
    }

    return NextResponse.json({ 
      hint: hintData
    })
  } catch (error) {
    console.error('Error in hint generation:', error)
    return NextResponse.json(
      { error: 'Failed to generate hint' },
      { status: 500 }
    )
  }
}