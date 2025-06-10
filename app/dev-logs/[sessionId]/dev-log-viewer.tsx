'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LogEntry {
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

interface LogData {
  sessionId: string
  startTime: string
  duration: number
  entryCount: number
  entries: LogEntry[]
}

export default function DevLogViewer({ sessionId }: { sessionId: string }) {
  const [logData, setLogData] = useState<LogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchLogData()
  }, [sessionId])

  async function fetchLogData() {
    try {
      const response = await fetch(`/api/dev-logs/${sessionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch log data')
      }
      const data = await response.json()
      setLogData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  const toggleEntry = (entryId: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'request': return '📤'
      case 'response': return '📥'
      case 'tool_call': return '🔧'
      case 'error': return '❌'
      case 'info': return 'ℹ️'
      default: return '📝'
    }
  }

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'request': return 'bg-blue-50 border-blue-200'
      case 'response': return 'bg-green-50 border-green-200'
      case 'tool_call': return 'bg-purple-50 border-purple-200'
      case 'error': return 'bg-red-50 border-red-200'
      case 'info': return 'bg-gray-50 border-gray-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dev logs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!logData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Gemini API Dev Log</h1>
            <p className="mt-1 text-sm text-gray-600">Session: {sessionId}</p>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Start Time:</span>
                <p className="font-medium">{new Date(logData.startTime).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Duration:</span>
                <p className="font-medium">{(logData.duration / 1000).toFixed(2)}s</p>
              </div>
              <div>
                <span className="text-gray-500">Total Entries:</span>
                <p className="font-medium">{logData.entryCount}</p>
              </div>
              <div>
                <span className="text-gray-500">API Calls:</span>
                <p className="font-medium">
                  {logData.entries.filter(e => e.type === 'request').length} requests,
                  {' '}{logData.entries.filter(e => e.type === 'tool_call').length} tool calls
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Log Entries */}
        <div className="space-y-4">
          {logData.entries.map((entry) => (
            <div
              key={entry.id}
              className={`bg-white shadow rounded-lg border-2 ${getEntryColor(entry.type)}`}
            >
              <div
                className="px-6 py-4 cursor-pointer"
                onClick={() => toggleEntry(entry.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getEntryIcon(entry.type)}</span>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {entry.type.replace('_', ' ')}
                        {entry.type === 'tool_call' && entry.metadata?.toolName && (
                          <span className="ml-2 text-purple-600">- {entry.metadata.toolName}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                        {entry.duration && (
                          <span className="ml-2">({(entry.duration / 1000).toFixed(3)}s)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      expandedEntries.has(entry.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expandedEntries.has(entry.id) && (
                <div className="px-6 pb-4 border-t border-gray-200">
                  {/* Request Details */}
                  {entry.type === 'request' && entry.prompt && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Prompt:</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                        {entry.prompt}
                      </pre>
                    </div>
                  )}

                  {/* Response Details */}
                  {entry.type === 'response' && (
                    <>
                      {entry.response && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Response Text:</h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                            {entry.response}
                          </pre>
                        </div>
                      )}
                      {entry.toolCalls && entry.toolCalls.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Function Calls:</h4>
                          <div className="space-y-2">
                            {entry.toolCalls.map((call, idx) => (
                              <div key={idx} className="bg-gray-100 p-3 rounded text-xs">
                                <p className="font-medium">{call.name}</p>
                                <pre className="mt-1 overflow-x-auto">
                                  {JSON.stringify(call.args, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Tool Call Details */}
                  {entry.type === 'tool_call' && entry.metadata && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Arguments:</h4>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(entry.metadata.args, null, 2)}
                        </pre>
                      </div>
                      {entry.metadata.result && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Result:</h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(entry.metadata.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Details */}
                  {entry.type === 'error' && entry.error && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-red-700 mb-2">Error:</h4>
                      <pre className="bg-red-100 p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(entry.error, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Info Details */}
                  {entry.type === 'info' && entry.metadata && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Information:</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}