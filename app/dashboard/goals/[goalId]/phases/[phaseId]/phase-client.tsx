'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ProblemTracker } from '@/components/problem-tracker'
import { ActivityType, ResourceType } from '@/types/goals'
import { deletePhase } from '@/app/actions/delete-actions'

interface PhaseClientProps {
  phase: any
  phaseResources: any[]
  activityProgress: any
  goalId: string
  userId: string
}

export default function PhaseClient({ 
  phase, 
  phaseResources, 
  activityProgress, 
  goalId,
  userId
}: PhaseClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'resources'>('overview')
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Calculate phase progress
  const totalActivities = phase.activities?.length || 0
  const completedActivities = Object.values(activityProgress).filter(
    (p: any) => p.status === 'completed'
  ).length
  const progressPercentage = totalActivities > 0 
    ? (completedActivities / totalActivities) * 100 
    : 0

  // Group resources by type
  const resourcesByType = phaseResources.reduce((acc: any, pr: any) => {
    const type = pr.resources?.type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(pr)
    return acc
  }, {})

  const resourceTypeIcons: Record<string, string> = {
    textbook: '📚',
    reading: '📖',
    practice_exam: '📝',
    problem_set: '🧮',
    video: '🎥',
    reference: '📋',
    website: '🌐',
    other: '📁'
  }

  const handleCreateActivity = () => {
    // Navigate to activity creation
    window.location.href = `/dashboard/goals/${goalId}/phases/${phase.id}/activities/new`
  }

  const handleStartExam = async (resourceId: string) => {
    // Navigate to exam taking interface
    window.location.href = `/dashboard/resources/${resourceId}/practice-exam`
  }

  const handleViewProblemSet = (resourceId: string) => {
    // Navigate to problem set view
    window.location.href = `/dashboard/resources/${resourceId}/problem-set`
  }

  const handleReadingProgress = (resourceId: string) => {
    // Navigate to reading tracker
    window.location.href = `/dashboard/resources/${resourceId}/reading`
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <Link
              href={`/dashboard/goals/${goalId}`}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Goal</span>
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold gradient-text mb-3" style={{ fontFamily: 'Quicksand, sans-serif' }}>
            {phase.name}
          </h1>
          
          {phase.description && (
            <p className="text-gray-700 text-lg">{phase.description}</p>
          )}
          
          <div className="flex items-center space-x-6 mt-4">
            {phase.start_date && (
              <div className="flex items-center space-x-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {new Date(phase.start_date).toLocaleDateString()} - 
                  {phase.end_date ? new Date(phase.end_date).toLocaleDateString() : 'Ongoing'}
                </span>
              </div>
            )}
            
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              phase.status === 'completed' ? 'bg-sky/20 text-sky-dark' :
              phase.status === 'in_progress' ? 'bg-sage/20 text-sage-dark' :
              'bg-gray-200 text-gray-600'
            }`}>
              {phase.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/goals/${goalId}/phases/${phase.id}/edit`}
            className="btn-secondary text-sm"
          >
            Edit Phase
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-sm text-coral-dark hover:bg-coral/10 rounded-2xl transition-colors"
          >
            Delete Phase
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      {totalActivities > 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Phase Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Completed {completedActivities} of {totalActivities} activities</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000"
                style={{ 
                  background: 'linear-gradient(to right, var(--color-sage), var(--color-sky))',
                  width: `${progressPercentage}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-sage text-sage-dark'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'activities'
                ? 'border-sage text-sage-dark'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Activities ({totalActivities})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'resources'
                ? 'border-sage text-sage-dark'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Resources ({phaseResources.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <button
                  onClick={handleCreateActivity}
                  className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-sage to-sage-dark text-white rounded-2xl hover:from-sage-dark hover:to-sage transition-all duration-300 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-semibold">Add Activity</span>
                </button>
                
                {/* Show quick actions based on resource types */}
                {resourcesByType.practice_exam && (
                  <button
                    onClick={() => handleStartExam(resourcesByType.practice_exam[0].resources.id)}
                    className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-br from-coral/10 to-coral/5 rounded-2xl hover:from-coral/20 hover:to-coral/10 transition-all"
                  >
                    <span className="text-2xl">📝</span>
                    <span className="text-coral-dark font-medium">Take Practice Exam</span>
                  </button>
                )}
                
                {resourcesByType.reading && (
                  <button
                    onClick={() => handleReadingProgress(resourcesByType.reading[0].resources.id)}
                    className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-br from-lavender/10 to-lavender/5 rounded-2xl hover:from-lavender/20 hover:to-lavender/10 transition-all"
                  >
                    <span className="text-2xl">📖</span>
                    <span className="text-lavender-dark font-medium">Continue Reading</span>
                  </button>
                )}
              </div>
            </div>

            {/* Resource Summary by Type */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resources Overview</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(resourcesByType).map(([type, resources]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{resourceTypeIcons[type as ResourceType]}</span>
                      <div>
                        <p className="font-medium text-gray-800 capitalize">
                          {type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600">{(resources as any[]).length} resource{(resources as any[]).length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-4">
            {phase.activities && phase.activities.length > 0 ? (
              phase.activities.map((activity: any, index: number) => {
                const progress = activityProgress[activity.id]
                const isCompleted = progress?.status === 'completed'
                
                const handleActivityClick = (e?: React.MouseEvent) => {
                  if (e) e.stopPropagation()
                  // Navigate to the activity page
                  window.location.href = `/dashboard/activities/${activity.id}`
                }
                
                return (
                  <div
                    key={activity.id}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 hover:shadow-medium transition-all animate-slide-up cursor-pointer"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={handleActivityClick}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">Activity {index + 1}</span>
                          <h4 className="text-lg font-semibold text-gray-800">{activity.title}</h4>
                          {isCompleted && (
                            <svg className="w-5 h-5 text-sage" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        
                        {activity.description && (
                          <p className="text-gray-600 mb-3">{activity.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                            {activity.type}
                          </span>
                          {activity.estimated_hours && (
                            <span>~{activity.estimated_hours}h</span>
                          )}
                          {activity.resources && (
                            <span className="flex items-center space-x-1">
                              <span>{resourceTypeIcons[activity.resources.type]}</span>
                              <span>{activity.resources.title}</span>
                            </span>
                          )}
                          {activity.metadata?.target_score && (
                            <span>Target: {activity.metadata.target_score}%</span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleActivityClick(e)
                        }}
                        className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                          isCompleted 
                            ? 'bg-gray-100 text-gray-500' 
                            : 'bg-sage/10 text-sage-dark hover:bg-sage/20'
                        }`}
                      >
                        {isCompleted ? 'Review' : 'Start'}
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No activities created yet</p>
                <button
                  onClick={handleCreateActivity}
                  className="btn-primary inline-block"
                >
                  Create First Activity
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            {Object.entries(resourcesByType).map(([type, resources]) => (
              <div key={type} className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <span>{resourceTypeIcons[type as ResourceType]}</span>
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                </h4>
                
                {(resources as any[]).map((pr: any, index: number) => {
                  const resource = pr.resources
                  
                  return (
                    <div
                      key={pr.id}
                      className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 animate-slide-up hover:shadow-medium transition-all cursor-pointer"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => {
                        if (resource.type === 'practice_exam') {
                          handleStartExam(resource.id)
                        } else if (resource.type === 'problem_set') {
                          handleViewProblemSet(resource.id)
                        } else if (resource.type === 'reading' || resource.type === 'textbook' || resource.type === 'reference') {
                          handleReadingProgress(resource.id)
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="text-lg font-semibold text-gray-800 mb-2">
                            {resource.title}
                          </h5>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            {resource.author && (
                              <span>by {resource.author}</span>
                            )}
                            {resource.metadata?.total_pages && (
                              <span>{resource.metadata.total_pages} pages</span>
                            )}
                            {resource.metadata?.total_questions && (
                              <span>{resource.metadata.total_questions} questions</span>
                            )}
                            {resource.metadata?.time_limit_minutes && (
                              <span>{resource.metadata.time_limit_minutes} min time limit</span>
                            )}
                            {resource.metadata?.difficulty_level && (
                              <span className="capitalize">{resource.metadata.difficulty_level}</span>
                            )}
                          </div>
                          
                          {resource.description && (
                            <p className="text-gray-600 mt-2 text-sm">{resource.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            
            {phaseResources.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No resources assigned to this phase</p>
                <Link
                  href={`/dashboard/goals/${goalId}/resources/add`}
                  className="btn-primary inline-block"
                >
                  Add Resources
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Delete Phase?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{phase.name}"? This action cannot be undone.
              All activities and progress data in this phase will be permanently deleted.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <form action={deletePhase.bind(null, phase.id, goalId)} className="flex-1">
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-coral text-white rounded-2xl hover:bg-coral-dark transition-colors"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}