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
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          updated_at?: string
        }
      }
      curricula: {
        Row: {
          id: string
          name: string
          description: string | null
          subject: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          subject: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          subject?: string
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          curriculum_id: string
          name: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          curriculum_id: string
          name: string
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          curriculum_id?: string
          name?: string
          order_index?: number
          updated_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          chapter_id: string
          name: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          name: string
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          name?: string
          order_index?: number
          updated_at?: string
        }
      }
      problems: {
        Row: {
          id: string
          section_id: string
          problem_number: number
          content: string
          solution: string | null
          skills: string[] | null
          generated: boolean
          parent_problem_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          section_id: string
          problem_number: number
          content: string
          solution?: string | null
          skills?: string[] | null
          generated?: boolean
          parent_problem_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          section_id?: string
          problem_number?: number
          content?: string
          solution?: string | null
          skills?: string[] | null
          generated?: boolean
          parent_problem_id?: string | null
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          problem_id: string
          completed: boolean
          time_spent_seconds: number | null
          hints_used: number
          flagged_for_review: boolean
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
          time_spent_seconds?: number | null
          hints_used?: number
          flagged_for_review?: boolean
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          time_spent_seconds?: number | null
          hints_used?: number
          flagged_for_review?: boolean
          started_at?: string | null
          completed_at?: string | null
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
          problem_id?: string
          user_id?: string
          hint_number?: number
          content?: string
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