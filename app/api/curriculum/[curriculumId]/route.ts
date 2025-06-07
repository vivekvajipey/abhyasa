import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch a specific curriculum with all its data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ curriculumId: string }> }
) {
  try {
    const { curriculumId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch curriculum with all nested data
    const { data: curriculum, error } = await supabase
      .from('curricula')
      .select(`
        *,
        chapters (
          *,
          sections (
            *,
            problems (*)
          )
        )
      `)
      .eq('id', curriculumId)
      .single()

    if (error) {
      console.error('Error fetching curriculum:', error)
      return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 })
    }

    // Sort chapters, sections, and problems by their order
    curriculum.chapters.sort((a: any, b: any) => a.order_index - b.order_index)
    curriculum.chapters.forEach((chapter: any) => {
      chapter.sections.sort((a: any, b: any) => a.order_index - b.order_index)
      chapter.sections.forEach((section: any) => {
        section.problems.sort((a: any, b: any) => a.problem_number - b.problem_number)
      })
    })

    return NextResponse.json({ curriculum })
  } catch (error) {
    console.error('Error in curriculum GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch curriculum' },
      { status: 500 }
    )
  }
}