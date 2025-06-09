import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PDFDocument } from 'pdf-lib'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Schema for problem extraction
const problemExtractionSchema = {
  type: "object",
  properties: {
    problems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          number: { type: "number" },
          content: { type: "string" },
          solution: { type: "string" },
          skills: {
            type: "array",
            items: { type: "string" }
          },
          topic: { type: "string" }
        },
        required: ["number", "content"]
      }
    }
  },
  required: ["problems"]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const resourceId = formData.get('resourceId') as string
    const resourceName = formData.get('resourceName') as string
    const startPage = formData.get('startPage') as string | null
    const endPage = formData.get('endPage') as string | null

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Please provide a valid PDF file' },
        { status: 400 }
      )
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    // Convert file to bytes
    const bytes = await file.arrayBuffer()
    let pdfData = new Uint8Array(bytes)

    // Extract specific pages if range is provided
    if (startPage && endPage) {
      const pdfDoc = await PDFDocument.load(pdfData)
      const totalPages = pdfDoc.getPageCount()
      const start = parseInt(startPage)
      const end = parseInt(endPage)
      
      // Validate page range
      if (start < 1 || end > totalPages || start > end) {
        return NextResponse.json(
          { error: `Invalid page range. PDF has ${totalPages} pages.` },
          { status: 400 }
        )
      }

      // Create new PDF with only selected pages
      const newPdfDoc = await PDFDocument.create()
      const pagesToCopy = []
      for (let i = start - 1; i < end; i++) {
        pagesToCopy.push(i)
      }
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToCopy)
      copiedPages.forEach(page => newPdfDoc.addPage(page))
      
      // Get the new PDF data
      pdfData = Buffer.from(await newPdfDoc.save())
    }

    // Check size after extraction (20MB limit for Gemini)
    if (pdfData.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'PDF content exceeds 20MB. Please select fewer pages.' },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-preview-05-20',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: problemExtractionSchema as any,
      }
    })

    const prompt = `Extract practice problems from this PDF for "${resourceName}". 
    
    For each problem, extract:
    1. The problem number (if present, otherwise assign sequential numbers)
    2. The complete problem text exactly as written
    3. The solution if provided
    4. Key skills or concepts being tested
    5. The topic or category the problem belongs to
    
    Important instructions:
    - Extract problems exactly as written, preserving all mathematical notation
    - If a problem has multiple parts (a, b, c), include them all in the content
    - Number problems sequentially starting from the existing count
    - If solutions are shown separately, match them to their problems
    - Identify the topic based on the problem content (e.g., "Stoichiometry", "Thermodynamics", etc.)
    - For skills, identify 2-4 key concepts being tested`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: Buffer.from(pdfData).toString('base64')
        }
      },
      prompt
    ])

    const response = await result.response
    const extractedData = JSON.parse(response.text())

    // Get existing problem count for this resource
    const { data: existingProblems } = await supabase
      .from('problems')
      .select('problem_number')
      .eq('resource_id', resourceId)
      .order('problem_number', { ascending: false })
      .limit(1)

    const startNumber = existingProblems?.[0]?.problem_number ? existingProblems[0].problem_number + 1 : 1

    // Insert problems into database
    const problemsToInsert = extractedData.problems.map((problem: any, index: number) => ({
      resource_id: resourceId,
      problem_number: startNumber + index,
      content: problem.content,
      solution: problem.solution || null,
      skills: problem.skills || [],
      generated: false
    }))

    const { data: insertedProblems, error } = await supabase
      .from('problems')
      .insert(problemsToInsert)
      .select()

    if (error) {
      console.error('Error inserting problems:', error)
      return NextResponse.json(
        { error: 'Failed to save problems' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      problemsAdded: insertedProblems.length,
      problems: insertedProblems 
    })
  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF. Please try again.' },
      { status: 500 }
    )
  }
}