import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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
  private logEntries: GeminiLogEntry[] = []
  private startTime: number
  private logDir: string
  
  constructor(sessionId?: string) {
    this.sessionId = sessionId || uuidv4()
    this.startTime = Date.now()
    this.logDir = path.join(process.cwd(), 'logs', 'gemini')
  }
  
  async init() {
    // Ensure log directory exists
    await fs.mkdir(this.logDir, { recursive: true })
  }
  
  async logRequest(model: string, prompt: string, metadata?: Record<string, any>) {
    const entry: GeminiLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'request',
      model,
      prompt,
      metadata
    }
    
    this.logEntries.push(entry)
    await this.saveToFile()
    
    return entry.id
  }
  
  async logResponse(requestId: string, response: string, toolCalls?: any[], duration?: number) {
    const entry: GeminiLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'response',
      response,
      toolCalls,
      duration,
      metadata: { requestId }
    }
    
    this.logEntries.push(entry)
    await this.saveToFile()
  }
  
  async logToolCall(toolName: string, args: any, result: any, duration?: number) {
    const entry: GeminiLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'tool_call',
      metadata: {
        toolName,
        args,
        result,
        duration
      }
    }
    
    this.logEntries.push(entry)
    await this.saveToFile()
  }
  
  async logError(error: any, context?: string) {
    const entry: GeminiLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'error',
      error: {
        message: error.message || String(error),
        stack: error.stack,
        context
      }
    }
    
    this.logEntries.push(entry)
    await this.saveToFile()
  }
  
  async logInfo(message: string, metadata?: Record<string, any>) {
    const entry: GeminiLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'info',
      metadata: {
        message,
        ...metadata
      }
    }
    
    this.logEntries.push(entry)
    await this.saveToFile()
  }
  
  private async saveToFile() {
    const filename = `gemini-session-${this.sessionId}.json`
    const filepath = path.join(this.logDir, filename)
    
    const logData = {
      sessionId: this.sessionId,
      startTime: new Date(this.startTime).toISOString(),
      duration: Date.now() - this.startTime,
      entryCount: this.logEntries.length,
      entries: this.logEntries
    }
    
    await fs.writeFile(filepath, JSON.stringify(logData, null, 2))
  }
  
  getSessionId() {
    return this.sessionId
  }
  
  getLogPath() {
    return path.join(this.logDir, `gemini-session-${this.sessionId}.json`)
  }
  
  getSummary() {
    const requestCount = this.logEntries.filter(e => e.type === 'request').length
    const responseCount = this.logEntries.filter(e => e.type === 'response').length
    const toolCallCount = this.logEntries.filter(e => e.type === 'tool_call').length
    const errorCount = this.logEntries.filter(e => e.type === 'error').length
    
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      requests: requestCount,
      responses: responseCount,
      toolCalls: toolCallCount,
      errors: errorCount,
      totalEntries: this.logEntries.length
    }
  }
}