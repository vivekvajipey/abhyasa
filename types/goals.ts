// Goal-related types for the expanded Abhyasa platform

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';
export type PhaseStatus = 'not_started' | 'in_progress' | 'completed';
export type ResourceType = 'textbook' | 'reading' | 'practice_exam' | 'problem_set' | 'video' | 'reference' | 'website' | 'other';
export type ActivityType = 'read' | 'watch' | 'practice' | 'exam' | 'review' | 'assess' | 'other';
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

export interface Phase {
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
  metadata?: any; // Resource-specific data
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
  target_score?: number;
  pages_to_read?: number;
  problems_to_solve?: number;
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
  phases: Phase[];
}

export interface PhaseWithActivities extends Phase {
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

// Practice Exam specific types
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'competition';
export type ExamStatus = 'in_progress' | 'completed' | 'abandoned';

export interface PracticeExam {
  id: string;
  resource_id: string;
  total_questions: number;
  time_limit_minutes?: number;
  passing_score?: number;
  topics?: string[];
  difficulty_level?: DifficultyLevel;
  source_year?: number;
  created_at: string;
  updated_at: string;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  practice_exam_id: string;
  score?: number;
  time_taken_minutes?: number;
  started_at: string;
  completed_at?: string;
  status: ExamStatus;
  answers?: any; // JSON with question answers
  created_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  resource_id: string;
  current_page: number;
  total_pages?: number;
  reading_time_minutes: number;
  completed: boolean;
  notes?: string;
  bookmarks?: any; // JSON with page bookmarks
  last_read_at?: string;
  created_at: string;
  updated_at: string;
}

export type ResourceLinkType = 'prerequisite' | 'supplement' | 'solution' | 'related';

export interface ResourceLink {
  id: string;
  source_resource_id: string;
  target_resource_id: string;
  link_type: ResourceLinkType;
  notes?: string;
  created_at: string;
}