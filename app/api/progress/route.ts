import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const { 
      problemId, 
      completed, 
      timeSpentSeconds, 
      flaggedForReview,
      action 
    } = await request.json()

    if (!problemId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }


    // Check if progress record exists
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single()

    if (existingProgress) {
      // Update existing progress
      const updateData: any = {}
      
      if (action === 'complete') {
        updateData.completed = true
        updateData.completed_at = new Date().toISOString()
        updateData.time_spent_seconds = timeSpentSeconds
      } else if (action === 'flag') {
        updateData.flagged_for_review = true
      } else if (action === 'start') {
        updateData.started_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_progress')
        .update(updateData)
        .eq('id', existingProgress.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating progress:', error)
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
      }

      return NextResponse.json({ progress: data })
    } else {
      // Create new progress record
      const insertData: any = {
        user_id: user.id,
        problem_id: problemId,
        completed: false,
        flagged_for_review: false,
        hints_used: 0
      }

      if (action === 'complete') {
        insertData.completed = true
        insertData.completed_at = new Date().toISOString()
        insertData.time_spent_seconds = timeSpentSeconds
        insertData.started_at = new Date(Date.now() - (timeSpentSeconds * 1000)).toISOString()
      } else if (action === 'flag') {
        insertData.flagged_for_review = true
      } else if (action === 'start') {
        insertData.started_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_progress')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error creating progress:', error)
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
      }

      return NextResponse.json({ progress: data })
    }
  } catch (error) {
    console.error('Error in progress API:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// GET - Fetch user progress for problems
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const problemIds = searchParams.get('problemIds')?.split(',') || []

    if (problemIds.length === 0) {
      return NextResponse.json({ progress: {} })
    }

    const { data: progressData, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .in('problem_id', problemIds)

    if (error) {
      console.error('Error fetching progress:', error)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    // Convert to a map for easy lookup
    const progressMap = progressData?.reduce((acc, progress) => {
      acc[progress.problem_id] = progress
      return acc
    }, {} as Record<string, any>) || {}

    return NextResponse.json({ progress: progressMap })
  } catch (error) {
    console.error('Error in progress GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}