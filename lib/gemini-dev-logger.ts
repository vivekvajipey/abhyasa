import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

export interface GeminiLogEntry {
  id: string
  timestamp: string
  type: 'request' | 'response' | 'tool_call' | 'error' | 'info'
  model?: string
  prompt?: string
  response?: string
  toolCalls?: any[]
  error?: any
  metadata?: Record<string, any>
  duration?: number
}

export class GeminiDevLogger {
  private sessionId: string
  private userId: string
  private startTime: number
  private supabase: ReturnType<typeof createClient<Database>>
  
  constructor(userId: string, sessionId?: string) {
    this.userId = userId
    this.sessionId = sessionId || uuidv4()
    this.startTime = Date.now()
    
    // Initialize Supabase client - using service role for server-side operations
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  
  async logRequest(model: string, prompt: string, metadata?: Record<string, any>) {
    const { data, error } = await this.supabase
      .from('developer_logs')
      .insert({
        session_id: this.sessionId,
        user_id: this.userId,
        type: 'request',
        model,
        prompt,
        metadata: metadata || {}
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Failed to log request:', error)
      return null
    }
    
    return data.id
  }
  
  async logResponse(requestId: string, response: string, toolCalls?: any[], duration?: number) {
    const { error } = await this.supabase
      .from('developer_logs')
      .insert({
        session_id: this.sessionId,
        user_id: this.userId,
        type: 'response',
        response,
        tool_calls: toolCalls || null,
        duration,
        metadata: { requestId }
      })
    
    if (error) {
      console.error('Failed to log response:', error)
    }
  }
  
  async logToolCall(toolName: string, args: any, result: any, duration?: number) {
    const { error } = await this.supabase
      .from('developer_logs')
      .insert({
        session_id: this.sessionId,
        user_id: this.userId,
        type: 'tool_call',
        metadata: {
          toolName,
          args,
          result
        },
        duration
      })
    
    if (error) {
      console.error('Failed to log tool call:', error)
    }
  }
  
  async logError(error: any, context?: string) {
    const { error: dbError } = await this.supabase
      .from('developer_logs')
      .insert({
        session_id: this.sessionId,
        user_id: this.userId,
        type: 'error',
        error: {
          message: error.message || String(error),
          stack: error.stack,
          context
        }
      })
    
    if (dbError) {
      console.error('Failed to log error:', dbError)
    }
  }
  
  async logInfo(message: string, metadata?: Record<string, any>) {
    const { error } = await this.supabase
      .from('developer_logs')
      .insert({
        session_id: this.sessionId,
        user_id: this.userId,
        type: 'info',
        metadata: {
          message,
          ...metadata
        }
      })
    
    if (error) {
      console.error('Failed to log info:', error)
    }
  }
  
  getSessionId() {
    return this.sessionId
  }
  
  async getSummary() {
    const { data, error } = await this.supabase
      .from('developer_logs')
      .select('type')
      .eq('session_id', this.sessionId)
    
    if (error || !data) {
      return {
        sessionId: this.sessionId,
        duration: Date.now() - this.startTime,
        requests: 0,
        responses: 0,
        toolCalls: 0,
        errors: 0,
        totalEntries: 0
      }
    }
    
    const counts = data.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      requests: counts.request || 0,
      responses: counts.response || 0,
      toolCalls: counts.tool_call || 0,
      errors: counts.error || 0,
      totalEntries: data.length
    }
  }
}