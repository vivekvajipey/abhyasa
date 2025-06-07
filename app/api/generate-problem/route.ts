import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSimilarProblem } from '@/lib/gemini'
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

    const { originalProblem, solution, sectionId, problemId } = await request.json()

    if (!originalProblem) {
      return NextResponse.json(
        { error: 'Missing original problem' },
        { status: 400 }
      )
    }

    const newProblem = await generateSimilarProblem(originalProblem, solution)

    // Save the generated problem to database if sectionId is provided
    if (sectionId) {
      // Get the highest problem number in the section
      const { data: existingProblems } = await supabase
        .from('problems')
        .select('problem_number')
        .eq('section_id', sectionId)
        .order('problem_number', { ascending: false })
        .limit(1)

      const nextProblemNumber = existingProblems && existingProblems.length > 0 
        ? existingProblems[0].problem_number + 1 
        : 100 // Start generated problems at 100

      const { data: savedProblem, error: saveError } = await supabase
        .from('problems')
        .insert({
          section_id: sectionId,
          problem_number: nextProblemNumber,
          content: newProblem.content,
          solution: newProblem.solution,
          generated: true,
          parent_problem_id: problemId // Store reference to original problem
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving generated problem:', saveError)
        return NextResponse.json(newProblem) // Return generated problem even if save fails
      }

      return NextResponse.json({
        ...newProblem,
        id: savedProblem.id,
        problem_number: savedProblem.problem_number
      })
    }

    return NextResponse.json(newProblem)
  } catch (error) {
    console.error('Error in generate problem API:', error)
    return NextResponse.json(
      { error: 'Failed to generate problem' },
      { status: 500 }
    )
  }
}