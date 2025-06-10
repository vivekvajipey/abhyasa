import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    
    // Validate session ID format
    if (!sessionId || !/^[a-f0-9-]+$/i.test(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      )
    }
    
    // Construct log file path
    const logDir = path.join(process.cwd(), 'logs', 'gemini')
    const logPath = path.join(logDir, `gemini-session-${sessionId}.json`)
    
    // Check if file exists
    try {
      await fs.access(logPath)
    } catch {
      return NextResponse.json(
        { error: 'Log file not found' },
        { status: 404 }
      )
    }
    
    // Read log file
    const logContent = await fs.readFile(logPath, 'utf-8')
    const logData = JSON.parse(logContent)
    
    return NextResponse.json(logData)
  } catch (error) {
    console.error('Error reading dev log:', error)
    return NextResponse.json(
      { error: 'Failed to read log file' },
      { status: 500 }
    )
  }
}