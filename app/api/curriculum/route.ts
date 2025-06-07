import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Save a new curriculum
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const curriculum = await request.json()

    // Start a transaction to insert all related data
    // First, insert the curriculum
    const { data: curriculumData, error: curriculumError } = await supabase
      .from('curricula')
      .insert({
        name: curriculum.name,
        subject: curriculum.subject,
        description: curriculum.description || null
      })
      .select()
      .single()

    if (curriculumError) {
      console.error('Error inserting curriculum:', curriculumError)
      return NextResponse.json({ error: 'Failed to save curriculum' }, { status: 500 })
    }

    // Insert chapters with their sections and problems
    for (const chapter of curriculum.chapters) {
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          curriculum_id: curriculumData.id,
          name: chapter.name,
          order_index: chapter.order
        })
        .select()
        .single()

      if (chapterError) {
        console.error('Error inserting chapter:', chapterError)
        continue
      }

      // Insert sections for this chapter
      for (let sectionIndex = 0; sectionIndex < chapter.sections.length; sectionIndex++) {
        const section = chapter.sections[sectionIndex]
        const { data: sectionData, error: sectionError } = await supabase
          .from('sections')
          .insert({
            chapter_id: chapterData.id,
            name: section.name,
            order_index: sectionIndex + 1  // Use sequential integers for section ordering
          })
          .select()
          .single()

        if (sectionError) {
          console.error('Error inserting section:', sectionError)
          continue
        }

        // Insert problems for this section
        const problemsToInsert = section.problems.map((problem: any) => ({
          section_id: sectionData.id,
          problem_number: problem.number,
          content: problem.content,
          solution: problem.solution || null,
          skills: problem.skills || null,
          generated: problem.generated || false
        }))

        const { error: problemsError } = await supabase
          .from('problems')
          .insert(problemsToInsert)

        if (problemsError) {
          console.error('Error inserting problems:', problemsError)
        }
      }
    }

    // Ensure user exists in the users table
    // First check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      // User doesn't exist, create them
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!
        })

      if (userError) {
        console.error('Error creating user:', userError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      curriculumId: curriculumData.id 
    })
  } catch (error) {
    console.error('Error in curriculum POST:', error)
    return NextResponse.json(
      { error: 'Failed to save curriculum' },
      { status: 500 }
    )
  }
}

// GET - Fetch user's curricula
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all curricula with their chapters
    const { data: curricula, error } = await supabase
      .from('curricula')
      .select(`
        *,
        chapters (
          id,
          name,
          order_index,
          sections: sections(count)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching curricula:', error)
      return NextResponse.json({ error: 'Failed to fetch curricula' }, { status: 500 })
    }

    // Transform the data to match our expected format
    const formattedCurricula = curricula?.map(curriculum => ({
      id: curriculum.id,
      name: curriculum.name,
      subject: curriculum.subject,
      description: curriculum.description,
      chapters: curriculum.chapters
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((chapter: any) => ({
          id: chapter.id,
          name: chapter.name,
          sections: chapter.sections[0]?.count || 0
        }))
    }))

    return NextResponse.json({ curricula: formattedCurricula || [] })
  } catch (error) {
    console.error('Error in curriculum GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch curricula' },
      { status: 500 }
    )
  }
}