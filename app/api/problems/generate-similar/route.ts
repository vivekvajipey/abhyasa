import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { problemId, resourceId } = await request.json()

    if (!problemId || !resourceId) {
      return NextResponse.json(
        { error: 'Problem ID and Resource ID are required' },
        { status: 400 }
      )
    }

    // Fetch the original problem
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

    // Generate similar problem using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro-latest' })

    const prompt = `You are helping a student practice by generating a similar problem to the one below.

Original Problem:
${problem.content}

${problem.solution ? `Original Solution:\n${problem.solution}\n` : ''}

Generate a new problem that:
1. Tests the same core concepts and skills
2. Has a similar structure and difficulty level
3. Uses different numbers, scenarios, or contexts
4. Is clearly distinct from the original

Provide:
1. The new problem text
2. A complete solution
3. The specific skills being tested (2-4 skills)

Format your response as JSON with this structure:
{
  "problem": "The complete problem text",
  "solution": "The step-by-step solution",
  "skills": ["skill1", "skill2", "skill3"]
}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse the JSON response
    let generatedData
    try {
      // Extract JSON from the response (in case it's wrapped in markdown or other text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        generatedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse generated problem' },
        { status: 500 }
      )
    }

    // Get the highest problem number for this resource
    const { data: lastProblem } = await supabase
      .from('problems')
      .select('problem_number')
      .eq('resource_id', resourceId)
      .order('problem_number', { ascending: false })
      .limit(1)

    const newProblemNumber = lastProblem?.[0]?.problem_number ? lastProblem[0].problem_number + 1 : 1

    // Insert the new problem
    const { data: newProblem, error: insertError } = await supabase
      .from('problems')
      .insert({
        resource_id: resourceId,
        problem_number: newProblemNumber,
        content: generatedData.problem,
        solution: generatedData.solution,
        skills: generatedData.skills,
        generated: true,
        parent_problem_id: problemId
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting problem:', insertError)
      return NextResponse.json(
        { error: 'Failed to save generated problem' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      problem: newProblem
    })
  } catch (error) {
    console.error('Error generating similar problem:', error)
    return NextResponse.json(
      { error: 'Failed to generate similar problem' },
      { status: 500 }
    )
  }
}