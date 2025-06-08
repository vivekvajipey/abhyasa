// Goal-related types for the expanded Abhyasa platform

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';
export type PhaseStatus = 'not_started' | 'in_progress' | 'completed';
export type ResourceType = 'textbook' | 'video' | 'practice_exam' | 'article' | 'website' | 'other';
export type ActivityType = 'read' | 'practice' | 'review' | 'assess' | 'other';
export type ActivityStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';
export type Priority = 'high' | 'medium' | 'low';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface GoalPhase {
  id: string;
  goal_id: string;
  name: string;
  description?: string;
  order_index: number;
  target_start_date?: string;
  target_end_date?: string;
  status: PhaseStatus;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  user_id: string;
  type: ResourceType;
  title: string;
  author?: string;
  url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalResource {
  id: string;
  goal_id: string;
  resource_id: string;
  phase_id?: string;
  priority: Priority;
  notes?: string;
  created_at: string;
  resource?: Resource; // For joins
}

export interface Activity {
  id: string;
  phase_id: string;
  resource_id?: string;
  type: ActivityType;
  title: string;
  description?: string;
  estimated_hours?: number;
  order_index: number;
  prerequisite_activity_id?: string;
  created_at: string;
  updated_at: string;
  resource?: Resource; // For joins
}

export interface ActivityProgress {
  id: string;
  user_id: string;
  activity_id: string;
  status: ActivityStatus;
  progress_percentage: number;
  time_spent_minutes: number;
  notes?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Composite types for UI
export interface GoalWithPhases extends Goal {
  phases: GoalPhase[];
}

export interface PhaseWithActivities extends GoalPhase {
  activities: Activity[];
}

export interface ActivityWithProgress extends Activity {
  progress?: ActivityProgress;
}

export interface GoalWithFullDetails extends Goal {
  phases: (PhaseWithActivities & {
    activities: ActivityWithProgress[];
  })[];
  resources: GoalResource[];
}