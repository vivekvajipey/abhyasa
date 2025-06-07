import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      return NextResponse.json({ hints: {} })
    }

    const { data: hintsData, error } = await supabase
      .from('hints')
      .select('*')
      .eq('user_id', user.id)
      .in('problem_id', problemIds)
      .order('hint_number', { ascending: true })

    if (error) {
      console.error('Error fetching hints:', error)
      return NextResponse.json({ error: 'Failed to fetch hints' }, { status: 500 })
    }

    // Group hints by problem_id
    const hintsMap = hintsData?.reduce((acc, hint) => {
      if (!acc[hint.problem_id]) {
        acc[hint.problem_id] = []
      }
      acc[hint.problem_id].push(hint)
      return acc
    }, {} as Record<string, any[]>) || {}

    return NextResponse.json({ hints: hintsMap })
  } catch (error) {
    console.error('Error in hints GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hints' },
      { status: 500 }
    )
  }
}