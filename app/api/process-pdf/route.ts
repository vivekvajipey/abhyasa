import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { curriculumExtractionSchema } from '@/lib/gemini-schemas'
import { PDFDocument } from 'pdf-lib'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const pageRangeStr = formData.get('pageRange') as string | null

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Please provide a valid PDF file' },
        { status: 400 }
      )
    }

    // Convert file to bytes
    const bytes = await file.arrayBuffer()
    let pdfData = new Uint8Array(bytes)

    // Extract specific pages if range is provided
    if (pageRangeStr) {
      const pageRange = JSON.parse(pageRangeStr)
      const pdfDoc = await PDFDocument.load(pdfData)
      const totalPages = pdfDoc.getPageCount()
      
      // Validate page range
      if (pageRange.start < 1 || pageRange.end > totalPages || pageRange.start > pageRange.end) {
        return NextResponse.json(
          { error: `Invalid page range. PDF has ${totalPages} pages.` },
          { status: 400 }
        )
      }

      // Create new PDF with only selected pages
      const newPdfDoc = await PDFDocument.create()
      const pagesToCopy = []
      for (let i = pageRange.start - 1; i < pageRange.end; i++) {
        pagesToCopy.push(i)
      }
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToCopy)
      copiedPages.forEach(page => newPdfDoc.addPage(page))
      
      // Get the new PDF data
      pdfData = await newPdfDoc.save()
    }

    // Check size after extraction (20MB limit for Gemini)
    if (pdfData.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Extracted PDF content exceeds 20MB. Please select fewer pages.' },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-preview-05-20',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: curriculumExtractionSchema,
      }
    })

    const prompt = `Extract the curriculum structure from this educational PDF. 
    
    For each chapter and section, extract:
    1. The chapter/section names and their order
    2. All problems with their exact text
    3. Solutions if they are provided
    4. Identify the key skills or concepts each problem tests
    
    Important instructions:
    - Extract problems exactly as written, preserving all mathematical notation
    - If a problem has multiple parts (a, b, c), include them all in the content
    - For the curriculum name, use the textbook title if visible, otherwise infer from content
    - For subject, identify the main subject area (Mathematics, Physics, etc.)
    - Number problems sequentially within each section
    - If solutions are shown separately (like in an answer key), match them to their problems`

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

    // Add IDs and ensure proper data structure
    const curriculumWithIds = {
      ...extractedData.curriculum,
      id: crypto.randomUUID(),
      chapters: extractedData.curriculum.chapters.map((chapter: any, chapterIndex: number) => ({
        ...chapter,
        id: crypto.randomUUID(),
        order: chapterIndex + 1, // Ensure order is a number
        sections: chapter.sections.map((section: any, sectionIndex: number) => ({
          ...section,
          id: crypto.randomUUID(),
          order: sectionIndex + 1, // Ensure order is a number
          problems: section.problems.map((problem: any) => ({
            ...problem,
            id: crypto.randomUUID(),
            number: parseInt(problem.number) || 0, // Ensure number is numeric
            generated: false
          }))
        }))
      }))
    }

    return NextResponse.json({ curriculum: curriculumWithIds })
  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF. Please try again.' },
      { status: 500 }
    )
  }
}