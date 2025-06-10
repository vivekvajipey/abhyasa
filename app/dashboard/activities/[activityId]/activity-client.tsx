'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { updatePhaseStatus } from '@/app/dashboard/goals/[goalId]/phases/[phaseId]/update-phase-status'
import { deleteActivity } from '@/app/actions/delete-actions'

interface ActivityClientProps {
  activity: any
  progress: any
  userId: string
}

export default function ActivityClient({ activity, progress, userId }: ActivityClientProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(progress)
  const [notes, setNotes] = useState(progress?.notes || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const goalId = activity.phases.goals.id
  const phaseId = activity.phases.id
  
  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true)
    const supabase = createClient()
    
    const updateData: any = {
      status: newStatus,
      notes: notes || null
    }
    
    if (newStatus === 'in_progress' && !currentProgress?.started_at) {
      updateData.started_at = new Date().toISOString()
    }
    
    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.progress_percentage = 100
    }
    
    if (!currentProgress) {
      // Create new progress
      const { data, error } = await supabase
        .from('activity_progress')
        .insert({
          user_id: userId,
          activity_id: activity.id,
          ...updateData
        })
        .select()
        .single()
      
      if (!error) {
        setCurrentProgress(data)
        // Update phase status after activity progress change
        await updatePhaseStatus(phaseId)
      }
    } else {
      // Update existing progress
      const { data, error } = await supabase
        .from('activity_progress')
        .update(updateData)
        .eq('id', currentProgress.id)
        .select()
        .single()
      
      if (!error) {
        setCurrentProgress(data)
        // Update phase status after activity progress change
        await updatePhaseStatus(phaseId)
      }
    }
    
    setIsUpdating(false)
  }
  
  const handleTimeUpdate = async (minutes: number) => {
    const supabase = createClient()
    const newTime = (currentProgress?.time_spent_minutes || 0) + minutes
    
    const { data, error } = await supabase
      .from('activity_progress')
      .update({ time_spent_minutes: newTime })
      .eq('id', currentProgress.id)
      .select()
      .single()
    
    if (!error) {
      setCurrentProgress(data)
    }
  }
  
  const navigateToResource = () => {
    if (!activity.resources) return
    
    const resource = activity.resources
    if (activity.type === 'exam' && resource.type === 'practice_exam') {
      router.push(`/dashboard/resources/${resource.id}/practice-exam`)
    } else if (activity.type === 'practice' && resource.type === 'problem_set') {
      router.push(`/dashboard/resources/${resource.id}/problem-set`)
    } else if (activity.type === 'read' && ['reading', 'textbook', 'reference'].includes(resource.type)) {
      router.push(`/dashboard/resources/${resource.id}/reading`)
    } else if (resource.url) {
      window.open(resource.url, '_blank')
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-sky/20 text-sky-dark'
      case 'in_progress': return 'bg-sage/20 text-sage-dark'
      default: return 'bg-gray-200 text-gray-600'
    }
  }
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'read': return '📖'
      case 'watch': return '🎥'
      case 'practice': return '✏️'
      case 'exam': return '📝'
      case 'review': return '🔍'
      case 'assess': return '📊'
      default: return '📋'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href={`/dashboard/goals/${goalId}/phases/${phaseId}`}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Phase</span>
          </Link>
        </div>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl">{getActivityIcon(activity.type)}</span>
              <h1 className="text-4xl font-bold gradient-text" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                {activity.title}
              </h1>
            </div>
            
            {activity.description && (
              <p className="text-gray-700 text-lg mt-2">{activity.description}</p>
            )}
            
            <div className="flex items-center space-x-4 mt-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(currentProgress?.status || 'not_started')}`}>
                {(currentProgress?.status || 'not_started').replace('_', ' ')}
              </span>
              
              {activity.estimated_hours && (
                <span className="text-gray-600">
                  Estimated: {activity.estimated_hours}h
                </span>
              )}
              
              {currentProgress?.time_spent_minutes > 0 && (
                <span className="text-gray-600">
                  Time spent: {Math.floor(currentProgress.time_spent_minutes / 60)}h {currentProgress.time_spent_minutes % 60}m
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 md:grid-cols-3">
        {/* Activity Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Resource Card */}
          {activity.resources ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Associated Resource</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800">{activity.resources.title}</h4>
                  {activity.resources.author && (
                    <p className="text-sm text-gray-600">by {activity.resources.author}</p>
                  )}
                  {activity.resources.description && (
                    <p className="text-gray-600 mt-2">{activity.resources.description}</p>
                  )}
                </div>
                
                <button
                  onClick={navigateToResource}
                  className="btn-primary w-full"
                >
                  Open Resource
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Details</h3>
              <p className="text-gray-600">
                This is a standalone activity without an associated resource. 
                Complete the activity based on the description and mark it as done when finished.
              </p>
            </div>
          )}

          {/* Activity Goals */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Goals</h3>
              <div className="space-y-3">
                {activity.metadata.target_score && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Score</span>
                    <span className="font-medium">{activity.metadata.target_score}%</span>
                  </div>
                )}
                {activity.metadata.pages_to_read && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pages to Read</span>
                    <span className="font-medium">{activity.metadata.pages_to_read}</span>
                  </div>
                )}
                {activity.metadata.problems_to_solve && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Problems to Solve</span>
                    <span className="font-medium">{activity.metadata.problems_to_solve}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your progress or learnings..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage focus:outline-none resize-none"
              rows={4}
            />
            <button
              onClick={() => handleStatusUpdate(currentProgress?.status || 'not_started')}
              disabled={isUpdating}
              className="btn-secondary mt-4"
            >
              Save Notes
            </button>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-4">
          {/* Status Actions */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
            <div className="space-y-3">
              {(!currentProgress || currentProgress.status === 'not_started') && (
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={isUpdating}
                  className="w-full btn-primary"
                >
                  Start Activity
                </button>
              )}
              
              {currentProgress?.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isUpdating}
                    className="w-full btn-primary"
                  >
                    Mark as Complete
                  </button>
                  
                  <button
                    onClick={() => handleStatusUpdate('not_started')}
                    disabled={isUpdating}
                    className="w-full btn-secondary"
                  >
                    Reset Progress
                  </button>
                </>
              )}
              
              {currentProgress?.status === 'completed' && (
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={isUpdating}
                  className="w-full btn-secondary"
                >
                  Reopen Activity
                </button>
              )}
            </div>
          </div>

          {/* Time Tracking */}
          {currentProgress?.status === 'in_progress' && (
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Track Time</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTimeUpdate(15)}
                  className="btn-secondary text-sm"
                >
                  +15m
                </button>
                <button
                  onClick={() => handleTimeUpdate(30)}
                  className="btn-secondary text-sm"
                >
                  +30m
                </button>
                <button
                  onClick={() => handleTimeUpdate(60)}
                  className="btn-secondary text-sm"
                >
                  +1h
                </button>
                <button
                  onClick={() => handleTimeUpdate(120)}
                  className="btn-secondary text-sm"
                >
                  +2h
                </button>
              </div>
            </div>
          )}

          {/* Progress Summary */}
          {currentProgress && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-sm text-gray-600">
              {currentProgress.started_at && (
                <p>Started: {new Date(currentProgress.started_at).toLocaleDateString()}</p>
              )}
              {currentProgress.completed_at && (
                <p>Completed: {new Date(currentProgress.completed_at).toLocaleDateString()}</p>
              )}
            </div>
          )}
          
          {/* Delete Button */}
          <div className="mt-4">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-2 text-sm text-coral-dark hover:bg-coral/10 rounded-2xl transition-colors"
            >
              Delete Activity
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Delete Activity?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{activity.title}"? This action cannot be undone.
              All progress data for this activity will be permanently deleted.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <form action={deleteActivity.bind(null, activity.id, phaseId, goalId)} className="flex-1">
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