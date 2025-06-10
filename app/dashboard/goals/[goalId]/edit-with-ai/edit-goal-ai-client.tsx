'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface StudyPlanEvent {
  type: 'start' | 'thinking' | 'creating' | 'created' | 'updating' | 'updated' | 'deleting' | 'deleted' | 'error' | 'complete' | 'question';
  entity?: 'goal' | 'phase' | 'resource' | 'activity';
  data?: any;
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
  conversationId?: string;
}

interface EventLog {
  id: string;
  event: StudyPlanEvent;
  timestamp: Date;
}

export default function EditGoalWithAI({ goal }: { goal: any }) {
  const router = useRouter()
  const [editRequest, setEditRequest] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [events, setEvents] = useState<EventLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [enableDevLogging, setEnableDevLogging] = useState(false)
  const [devLogInfo, setDevLogInfo] = useState<{path?: string, sessionId?: string} | null>(null)
  const [conversationState, setConversationState] = useState<{
    isActive: boolean;
    conversationId?: string;
    context?: any;
    currentQuestion?: string;
    userResponse: string;
  }>({
    isActive: false,
    userResponse: ''
  })
  
  const handleEdit = useCallback(async () => {
    if (!editRequest.trim()) {
      setError('Please describe what changes you want to make')
      return
    }
    
    setIsEditing(true)
    setError(null)
    setEvents([])
    setDevLogInfo(null)
    
    try {
      const response = await fetch('/api/study-plan/edit-goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          goalId: goal.id,
          editRequest,
          enableDevLogging 
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to start edit')
      }
      
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        throw new Error('No response body')
      }
      
      // Read the stream
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const text = decoder.decode(value)
        const lines = text.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))
              const logEntry: EventLog = {
                id: Math.random().toString(36).substr(2, 9),
                event,
                timestamp: new Date(),
              }
              
              setEvents(prev => [...prev, logEntry])
              
              // Handle errors
              if (event.type === 'error') {
                setError(event.message || 'Edit failed')
                setIsEditing(false)
              }
              
              // Handle completion
              if (event.type === 'complete') {
                setIsEditing(false)
                setConversationState({ isActive: false, userResponse: '' })
                // Extract dev log info if available
                if (event.data?.devLogPath || event.data?.devLogSessionId) {
                  setDevLogInfo({
                    path: event.data.devLogPath,
                    sessionId: event.data.devLogSessionId
                  })
                }
              }
              
              // Handle AI questions
              if (event.type === 'question') {
                setIsEditing(false)
                setConversationState({
                  isActive: true,
                  conversationId: event.conversationId,
                  context: event.data?.context,
                  currentQuestion: event.message,
                  userResponse: ''
                })
              }
            } catch (e) {
              console.error('Failed to parse event:', e)
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit goal')
      setIsEditing(false)
    }
  }, [editRequest, goal.id, enableDevLogging])
  
  const getEventIcon = (entity?: string, type?: string) => {
    if (type === 'question') return '❓'
    if (type === 'updating' || type === 'updated') return '✏️'
    if (type === 'deleting' || type === 'deleted') return '🗑️'
    switch (entity) {
      case 'goal': return '🎯'
      case 'phase': return '📅'
      case 'resource': return '📚'
      case 'activity': return '✅'
      default: return '💭'
    }
  }
  
  const getEventColor = (type: string) => {
    switch (type) {
      case 'created': return 'text-green-600'
      case 'updated': return 'text-blue-600'
      case 'deleted': return 'text-red-600'
      case 'creating': case 'updating': case 'deleting': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      case 'thinking': return 'text-gray-600'
      case 'question': return 'text-purple-600'
      default: return 'text-gray-700'
    }
  }
  
  const exampleRequests = [
    "Add a new phase for advanced topics at the end",
    "Split the first phase into two shorter phases",
    "Add more practice exam resources to phase 2",
    "Extend the deadline by 2 weeks and adjust all phase dates",
    "Remove the last activity from phase 3",
    "Add 5 new activities focused on problem-solving"
  ]
  
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-6">
        <Link
          href={`/dashboard/goals/${goal.id}`}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
        >
          ← Back to Goal
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Goal with AI</h1>
        <p className="text-gray-600 mt-2">Use AI to modify "{goal.title}"</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Describe Your Changes</h2>
            <p className="mt-1 text-sm text-gray-600">
              Tell the AI what modifications you want to make to your goal
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="edit-request" className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to change?
              </label>
              <textarea
                id="edit-request"
                placeholder="Example: Add a new phase for review and practice exams before the final phase..."
                value={editRequest}
                onChange={(e) => setEditRequest(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={isEditing}
              />
            </div>
            
            {/* Example Requests */}
            {!editRequest && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Try one of these examples:</p>
                <div className="space-y-2">
                  {exampleRequests.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setEditRequest(example)}
                      className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Dev Mode Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dev-logging"
                checked={enableDevLogging}
                onChange={(e) => setEnableDevLogging(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isEditing}
              />
              <label htmlFor="dev-logging" className="text-sm text-gray-700">
                Enable developer logging
              </label>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="flex gap-4">
              {!isEditing && !conversationState.isActive && (
                <button
                  onClick={handleEdit}
                  disabled={!editRequest.trim()}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Changes with AI
                </button>
              )}
              
              {isEditing && (
                <div className="flex-1 px-4 py-2 bg-gray-100 rounded-md text-center text-sm text-gray-600">
                  <span className="inline-block animate-spin mr-2">⚙️</span>
                  Processing changes...
                </div>
              )}
              
              <Link
                href={`/dashboard/goals/${goal.id}`}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
        
        {/* Right Column - Real-time Progress */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Edit Progress</h2>
            <p className="mt-1 text-sm text-gray-600">
              Real-time updates from the AI agent
            </p>
          </div>
          
          <div className="p-6">
            {events.length === 0 && !isEditing && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">🤖</div>
                <p>AI agent is ready to modify your goal</p>
                <p className="text-sm mt-2">Changes will appear here in real-time</p>
              </div>
            )}
            
            {events.length > 0 && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {events.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border ${
                      log.event.type === 'error' ? 'border-red-200 bg-red-50' : 
                      log.event.type === 'updated' || log.event.type === 'created' ? 'border-green-200 bg-green-50' :
                      log.event.type === 'deleted' ? 'border-red-200 bg-red-50' :
                      'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getEventIcon(log.event.entity, log.event.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${getEventColor(log.event.type)}`}>
                          {log.event.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {log.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Summary Stats */}
            {events.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Updates:</span>
                    <span className="ml-2 font-semibold">
                      {events.filter(e => e.event.type === 'updated').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">New items:</span>
                    <span className="ml-2 font-semibold">
                      {events.filter(e => e.event.type === 'created').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Deletions:</span>
                    <span className="ml-2 font-semibold">
                      {events.filter(e => e.event.type === 'deleted').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total changes:</span>
                    <span className="ml-2 font-semibold">
                      {events.filter(e => ['created', 'updated', 'deleted'].includes(e.event.type)).length}
                    </span>
                  </div>
                </div>
                
                {/* Dev Log Info */}
                {devLogInfo && devLogInfo.sessionId && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <p className="font-semibold text-sm mb-2">Developer Log Created</p>
                    <Link
                      href={`/dev-logs/${devLogInfo.sessionId}`}
                      target="_blank"
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Dev Logs →
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {/* Success Actions */}
            {events.some(e => e.event.type === 'complete') && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => router.push(`/dashboard/goals/${goal.id}`)}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  View Updated Goal
                </button>
                <button
                  onClick={() => {
                    setEditRequest('')
                    setEvents([])
                    setError(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Make More Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}