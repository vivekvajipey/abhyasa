export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_date: string | null
          target_date: string
          daily_commitment_hours: number | null
          status: 'active' | 'completed' | 'paused' | 'archived'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_date?: string | null
          target_date: string
          daily_commitment_hours?: number | null
          status?: 'active' | 'completed' | 'paused' | 'archived'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_date?: string | null
          target_date?: string
          daily_commitment_hours?: number | null
          status?: 'active' | 'completed' | 'paused' | 'archived'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      phases: {
        Row: {
          id: string
          goal_id: string
          name: string
          description: string | null
          order_index: number
          start_date: string | null
          end_date: string | null
          status: 'not_started' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          name: string
          description?: string | null
          order_index: number
          start_date?: string | null
          end_date?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          name?: string
          description?: string | null
          order_index?: number
          start_date?: string | null
          end_date?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          user_id: string
          type: 'textbook' | 'reading' | 'practice_exam' | 'problem_set' | 'video' | 'reference' | 'website' | 'other'
          title: string
          author: string | null
          url: string | null
          description: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'textbook' | 'reading' | 'practice_exam' | 'problem_set' | 'video' | 'reference' | 'website' | 'other'
          title: string
          author?: string | null
          url?: string | null
          description?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'textbook' | 'reading' | 'practice_exam' | 'problem_set' | 'video' | 'reference' | 'website' | 'other'
          title?: string
          author?: string | null
          url?: string | null
          description?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      goal_resources: {
        Row: {
          id: string
          goal_id: string
          resource_id: string
          created_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          resource_id: string
          created_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          resource_id?: string
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          phase_id: string
          resource_id: string | null
          title: string
          description: string | null
          type: 'read' | 'watch' | 'practice' | 'exam' | 'review' | 'assess' | 'other'
          order_index: number
          estimated_hours: number | null
          prerequisite_activity_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phase_id: string
          resource_id?: string | null
          title: string
          description?: string | null
          type: 'read' | 'watch' | 'practice' | 'exam' | 'review' | 'assess' | 'other'
          order_index: number
          estimated_hours?: number | null
          prerequisite_activity_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phase_id?: string
          resource_id?: string | null
          title?: string
          description?: string | null
          type?: 'read' | 'watch' | 'practice' | 'exam' | 'review' | 'assess' | 'other'
          order_index?: number
          estimated_hours?: number | null
          prerequisite_activity_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      activity_progress: {
        Row: {
          id: string
          user_id: string
          activity_id: string
          status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
          progress_percentage: number
          time_spent_minutes: number
          notes: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_id: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'skipped'
          progress_percentage?: number
          time_spent_minutes?: number
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_id?: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'skipped'
          progress_percentage?: number
          time_spent_minutes?: number
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      problems: {
        Row: {
          id: string
          resource_id: string
          problem_number: number
          content: string
          solution: string | null
          topic: string | null
          difficulty: 'easy' | 'medium' | 'hard' | 'competition' | null
          skills: string[] | null
          generated: boolean
          parent_problem_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resource_id: string
          problem_number: number
          content: string
          solution?: string | null
          topic?: string | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'competition' | null
          skills?: string[] | null
          generated?: boolean
          parent_problem_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resource_id?: string
          problem_number?: number
          content?: string
          solution?: string | null
          topic?: string | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'competition' | null
          skills?: string[] | null
          generated?: boolean
          parent_problem_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          problem_id: string
          completed: boolean
          time_spent_seconds: number
          hints_used: number
          flagged_for_review: boolean
          notes: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          problem_id: string
          completed?: boolean
          time_spent_seconds?: number
          hints_used?: number
          flagged_for_review?: boolean
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          problem_id?: string
          completed?: boolean
          time_spent_seconds?: number
          hints_used?: number
          flagged_for_review?: boolean
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hints: {
        Row: {
          id: string
          problem_id: string
          user_id: string
          hint_number: number
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          user_id: string
          hint_number: number
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          user_id?: string
          hint_number?: number
          content?: string
          created_at?: string
        }
      }
      practice_exams: {
        Row: {
          id: string
          resource_id: string
          total_questions: number
          time_limit_minutes: number | null
          passing_score: number | null
          topics: string[] | null
          difficulty_level: 'easy' | 'medium' | 'hard' | 'competition' | null
          source_year: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resource_id: string
          total_questions: number
          time_limit_minutes?: number | null
          passing_score?: number | null
          topics?: string[] | null
          difficulty_level?: 'easy' | 'medium' | 'hard' | 'competition' | null
          source_year?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resource_id?: string
          total_questions?: number
          time_limit_minutes?: number | null
          passing_score?: number | null
          topics?: string[] | null
          difficulty_level?: 'easy' | 'medium' | 'hard' | 'competition' | null
          source_year?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      exam_attempts: {
        Row: {
          id: string
          user_id: string
          practice_exam_id: string
          score: number | null
          time_taken_minutes: number | null
          started_at: string
          completed_at: string | null
          status: 'in_progress' | 'completed' | 'abandoned'
          answers: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          practice_exam_id: string
          score?: number | null
          time_taken_minutes?: number | null
          started_at: string
          completed_at?: string | null
          status?: 'in_progress' | 'completed' | 'abandoned'
          answers?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          practice_exam_id?: string
          score?: number | null
          time_taken_minutes?: number | null
          started_at?: string
          completed_at?: string | null
          status?: 'in_progress' | 'completed' | 'abandoned'
          answers?: Json
          created_at?: string
        }
      }
      reading_progress: {
        Row: {
          id: string
          user_id: string
          resource_id: string
          current_page: number
          total_pages: number | null
          reading_time_minutes: number
          completed: boolean
          notes: string | null
          bookmarks: Json
          last_read_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resource_id: string
          current_page?: number
          total_pages?: number | null
          reading_time_minutes?: number
          completed?: boolean
          notes?: string | null
          bookmarks?: Json
          last_read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resource_id?: string
          current_page?: number
          total_pages?: number | null
          reading_time_minutes?: number
          completed?: boolean
          notes?: string | null
          bookmarks?: Json
          last_read_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          activity_id: string | null
          resource_id: string | null
          duration_minutes: number
          session_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          activity_id?: string | null
          resource_id?: string | null
          duration_minutes: number
          session_date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          activity_id?: string | null
          resource_id?: string | null
          duration_minutes?: number
          session_date?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}