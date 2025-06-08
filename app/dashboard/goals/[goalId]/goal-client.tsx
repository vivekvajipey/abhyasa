'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GoalWithFullDetails } from '@/types/goals'

interface GoalClientProps {
  goal: any // TODO: Use proper type after database is set up
}

export default function GoalClient({ goal }: GoalClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'resources'>('overview')
  
  const completedPhases = goal.goal_phases?.filter((p: any) => p.status === 'completed').length || 0
  const totalPhases = goal.goal_phases?.length || 0
  const progressPercentage = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Dashboard</span>
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold gradient-text mb-3" style={{ fontFamily: 'Quicksand, sans-serif' }}>
            {goal.title}
          </h1>
          
          {goal.description && (
            <p className="text-gray-700 text-lg">{goal.description}</p>
          )}
          
          <div className="flex items-center space-x-6 mt-4">
            {goal.target_date && (
              <div className="flex items-center space-x-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
              </div>
            )}
            
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              goal.status === 'active' ? 'bg-sage/20 text-sage-dark' :
              goal.status === 'completed' ? 'bg-sky/20 text-sky-dark' :
              'bg-gray-200 text-gray-600'
            }`}>
              {goal.status}
            </span>
          </div>
        </div>
        
        <Link
          href={`/dashboard/goals/${goal.id}/edit`}
          className="btn-secondary text-sm"
        >
          Edit Goal
        </Link>
      </div>

      {/* Progress Overview */}
      {totalPhases > 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-light p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Completed {completedPhases} of {totalPhases} phases</span>
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
            onClick={() => setActiveTab('phases')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'phases'
                ? 'border-sage text-sage-dark'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Phases ({totalPhases})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'resources'
                ? 'border-sage text-sage-dark'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Resources ({goal.goal_resources?.length || 0})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Link
                  href={`/dashboard/goals/${goal.id}/phases/new`}
                  className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-sage-light rounded-2xl hover:border-sage hover:bg-sage/5 transition-all"
                >
                  <svg className="w-5 h-5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sage-dark font-medium">Add Phase</span>
                </Link>
                
                <Link
                  href={`/dashboard/goals/${goal.id}/resources/add`}
                  className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-sky-light rounded-2xl hover:border-sky hover:bg-sky/5 transition-all"
                >
                  <svg className="w-5 h-5 text-sky" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-sky-dark font-medium">Add Resource</span>
                </Link>
              </div>
            </div>
            
            {goal.goal_phases && goal.goal_phases.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <p className="text-gray-600">No recent activity to show</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'phases' && (
          <div className="space-y-4">
            {goal.goal_phases && goal.goal_phases.length > 0 ? (
              goal.goal_phases.map((phase: any, index: number) => (
                <Link
                  key={phase.id}
                  href={`/dashboard/goals/${goal.id}/phases/${phase.id}`}
                  className="block bg-white/60 backdrop-blur-sm rounded-2xl p-6 hover:shadow-medium transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">Phase {index + 1}</span>
                        <h4 className="text-lg font-semibold text-gray-800">{phase.name}</h4>
                      </div>
                      
                      {phase.description && (
                        <p className="text-gray-600 mb-3">{phase.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {phase.target_start_date && (
                          <span>Start: {new Date(phase.target_start_date).toLocaleDateString()}</span>
                        )}
                        {phase.target_end_date && (
                          <span>End: {new Date(phase.target_end_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      phase.status === 'completed' ? 'bg-sky/20 text-sky-dark' :
                      phase.status === 'in_progress' ? 'bg-sage/20 text-sage-dark' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {phase.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No phases created yet</p>
                <Link
                  href={`/dashboard/goals/${goal.id}/phases/new`}
                  className="btn-primary inline-block"
                >
                  Create First Phase
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-4">
            {goal.goal_resources && goal.goal_resources.length > 0 ? (
              goal.goal_resources.map((goalResource: any, index: number) => (
                <div
                  key={goalResource.id}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        {goalResource.resources?.title || 'Untitled Resource'}
                      </h4>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="capitalize">{goalResource.resources?.type || 'unknown'}</span>
                        {goalResource.resources?.author && (
                          <span>by {goalResource.resources.author}</span>
                        )}
                      </div>
                      
                      {goalResource.notes && (
                        <p className="text-gray-600 mt-2">{goalResource.notes}</p>
                      )}
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      goalResource.priority === 'high' ? 'bg-coral/20 text-coral-dark' :
                      goalResource.priority === 'medium' ? 'bg-sage/20 text-sage-dark' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {goalResource.priority} priority
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No resources added yet</p>
                <Link
                  href={`/dashboard/goals/${goal.id}/resources/add`}
                  className="btn-primary inline-block"
                >
                  Add First Resource
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}