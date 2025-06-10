'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { examplePlans } from './example-plans';
import { simpleTestPlan, minimalTestPlan } from './simple-test-plan';

interface StudyPlanEvent {
  type: 'start' | 'thinking' | 'creating' | 'created' | 'error' | 'complete';
  entity?: 'goal' | 'phase' | 'resource' | 'activity';
  data?: any;
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
}

interface EventLog {
  id: string;
  event: StudyPlanEvent;
  timestamp: Date;
}

export default function ImportStudyPlanClient() {
  const [studyPlan, setStudyPlan] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [enableDevLogging, setEnableDevLogging] = useState(false);
  const [devLogInfo, setDevLogInfo] = useState<{path?: string, sessionId?: string} | null>(null);
  const router = useRouter();

  const handleImport = useCallback(async () => {
    if (!studyPlan.trim()) {
      setError('Please enter a study plan');
      return;
    }

    setIsImporting(true);
    setError(null);
    setEvents([]);
    setGoalId(null);

    try {
      const response = await fetch('/api/study-plan/import-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studyPlan, enableDevLogging }),
      });

      if (!response.ok) {
        throw new Error('Failed to start import');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              const logEntry: EventLog = {
                id: Math.random().toString(36).substr(2, 9),
                event,
                timestamp: new Date(),
              };
              
              setEvents(prev => [...prev, logEntry]);

              // If goal was created, save its ID
              if (event.type === 'created' && event.entity === 'goal') {
                setGoalId(event.data.id);
              }

              // Handle errors
              if (event.type === 'error') {
                setError(event.message || 'Import failed');
                setIsImporting(false);
              }

              // Handle completion
              if (event.type === 'complete') {
                setIsImporting(false);
                // Extract dev log info if available
                if (event.data?.devLogPath || event.data?.devLogSessionId) {
                  setDevLogInfo({
                    path: event.data.devLogPath,
                    sessionId: event.data.devLogSessionId
                  });
                }
              }
            } catch (e) {
              console.error('Failed to parse event:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import study plan');
      setIsImporting(false);
    }
  }, [studyPlan]);

  const getEntityIcon = (entity?: string) => {
    switch (entity) {
      case 'goal': return '🎯';
      case 'phase': return '📅';
      case 'resource': return '📚';
      case 'activity': return '✅';
      default: return '💭';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created': return 'text-green-600';
      case 'creating': return 'text-blue-600';
      case 'error': return 'text-red-600';
      case 'thinking': return 'text-gray-600';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Import Study Plan</h1>
            <p className="mt-2 text-sm text-gray-600">
              Paste your study plan and watch as AI creates a structured learning path
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="study-plan" className="block text-sm font-medium text-gray-700 mb-2">
                Study Plan Description
              </label>
              <textarea
                id="study-plan"
                placeholder="Example: I want to prepare for the USNCO Local Exam by March 2026..."
                value={studyPlan}
                onChange={(e) => setStudyPlan(e.target.value)}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={isImporting}
              />
            </div>
            
            {/* Dev Mode Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dev-logging"
                checked={enableDevLogging}
                onChange={(e) => setEnableDevLogging(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isImporting}
              />
              <label htmlFor="dev-logging" className="text-sm text-gray-700">
                Enable developer logging (creates detailed API logs)
              </label>
            </div>
            
            {/* Example Plans */}
            {!studyPlan && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Try an example:</p>
                <div className="space-y-2">
                  {/* Test Plans - Simpler for debugging */}
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">🧪 Test Plans (for debugging):</p>
                    <button
                      onClick={() => setStudyPlan(simpleTestPlan.content)}
                      className="w-full text-left p-3 border border-purple-200 rounded-md hover:bg-purple-50 transition-colors mb-1"
                    >
                      <div className="font-medium text-sm">{simpleTestPlan.title}</div>
                      <div className="text-xs text-gray-500">{simpleTestPlan.description}</div>
                    </button>
                    <button
                      onClick={() => setStudyPlan(minimalTestPlan.content)}
                      className="w-full text-left p-3 border border-purple-200 rounded-md hover:bg-purple-50 transition-colors"
                    >
                      <div className="font-medium text-sm">{minimalTestPlan.title}</div>
                      <div className="text-xs text-gray-500">{minimalTestPlan.description}</div>
                    </button>
                  </div>
                  
                  {/* Original Example Plans */}
                  <p className="text-xs text-gray-500 mb-1">📚 Full Examples:</p>
                  {examplePlans.map((plan, index) => (
                    <button
                      key={index}
                      onClick={() => setStudyPlan(plan.content)}
                      className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-sm">{plan.title}</div>
                      <div className="text-xs text-gray-500">{plan.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              {!isImporting && !goalId && (
                <button
                  onClick={handleImport}
                  disabled={!studyPlan.trim()}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Import
                </button>
              )}
              
              {isImporting && (
                <div className="flex-1 px-4 py-2 bg-gray-100 rounded-md text-center text-sm text-gray-600">
                  <span className="inline-block animate-spin mr-2">⚙️</span>
                  Importing... Please wait
                </div>
              )}
              
              {goalId && !isImporting && (
                <button
                  onClick={() => router.push(`/dashboard/goals/${goalId}`)}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  View Created Goal →
                </button>
              )}
              
              <Link
                href="/dashboard/goals"
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
            <h2 className="text-xl font-bold text-gray-900">Import Progress</h2>
            <p className="mt-1 text-sm text-gray-600">
              Real-time updates from the AI agent
            </p>
          </div>
          
          <div className="p-6">
            {events.length === 0 && !isImporting && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">🤖</div>
                <p>AI agent is ready to process your study plan</p>
                <p className="text-sm mt-2">Events will appear here in real-time</p>
              </div>
            )}
            
            {events.length > 0 && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {events.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border ${
                      log.event.type === 'error' ? 'border-red-200 bg-red-50' : 
                      log.event.type === 'created' ? 'border-green-200 bg-green-50' :
                      'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getEntityIcon(log.event.entity)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${getEventColor(log.event.type)}`}>
                          {log.event.message}
                        </p>
                        {log.event.progress && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>{log.event.entity} progress</span>
                              <span>{log.event.progress.current} / {log.event.progress.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${(log.event.progress.current / log.event.progress.total) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        )}
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
                    <span className="text-gray-600">Goals created:</span>
                    <span className="ml-2 font-semibold">
                      {events.filter(e => e.event.type === 'created' && e.event.entity === 'goal').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phases created:</span>
                    <span className="ml-2 font-semibold">
                      {events.filter(e => e.event.type === 'created' && e.event.entity === 'phase').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Resources created:</span>
                    <span className="ml-2 font-semibold">
                      {events.filter(e => e.event.type === 'created' && e.event.entity === 'resource').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Activities created:</span>
                    <span className="ml-2 font-semibold">
                      {events.filter(e => e.event.type === 'created' && e.event.entity === 'activity').length}
                    </span>
                  </div>
                </div>
                
                {/* Dev Log Info */}
                {devLogInfo && devLogInfo.sessionId && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <p className="font-semibold text-sm mb-2">Developer Log Created</p>
                    <p className="text-xs text-gray-600 mb-2">
                      Detailed API logs have been saved for debugging purposes.
                    </p>
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
          </div>
        </div>
      </div>
    </div>
  );
}