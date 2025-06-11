import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    
    // Validate session ID format (UUID)
    if (!sessionId || !/^[a-f0-9-]+$/i.test(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      )
    }
    
    // Get current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Fetch logs from database
    const { data: logs, error } = await supabase
      .from('developer_logs')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: true })
    
    if (error) {
      console.error('Error fetching dev logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch logs' },
        { status: 500 }
      )
    }
    
    if (!logs || logs.length === 0) {
      return NextResponse.json(
        { error: 'Log session not found' },
        { status: 404 }
      )
    }
    
    // Calculate summary statistics
    const startTime = new Date(logs[0].timestamp).getTime()
    const endTime = new Date(logs[logs.length - 1].timestamp).getTime()
    const duration = endTime - startTime
    
    const counts = logs.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Format response similar to original structure
    const logData = {
      sessionId,
      startTime: logs[0].timestamp,
      duration,
      entryCount: logs.length,
      entries: logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        type: log.type,
        model: log.model,
        prompt: log.prompt,
        response: log.response,
        toolCalls: log.tool_calls,
        error: log.error,
        metadata: log.metadata,
        duration: log.duration
      }))
    }
    
    return NextResponse.json(logData)
  } catch (error) {
    console.error('Error reading dev log:', error)
    return NextResponse.json(
      { error: 'Failed to read log data' },
      { status: 500 }
    )
  }
}