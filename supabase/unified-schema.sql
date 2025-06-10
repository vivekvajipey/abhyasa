-- Abhyasa Learning Platform - Unified Schema
-- Goal-oriented learning platform for ambitious students
-- Based on the vision in CLAUDE.md

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful in production!)
-- Uncomment these lines to reset the database
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- =====================================================
-- CORE USER MANAGEMENT
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GOAL MANAGEMENT (Primary organizing principle)
-- =====================================================

-- Learning Goals - The main entity students create
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  target_date DATE NOT NULL,
  daily_commitment_hours DECIMAL(3,1),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phases - Time-bound stages within a goal
CREATE TABLE public.phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, order_index)
);

-- =====================================================
-- RESOURCE MANAGEMENT
-- =====================================================

-- Resources - All learning materials (textbooks, videos, websites, etc.)
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'textbook', 'reading', 'practice_exam', 'problem_set', 
    'video', 'reference', 'website', 'other'
  )),
  title TEXT NOT NULL,
  author TEXT,
  url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Flexible storage for type-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link resources to goals
CREATE TABLE public.goal_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, resource_id)
);

-- =====================================================
-- ACTIVITY MANAGEMENT
-- =====================================================

-- Activities - Specific tasks within phases
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'read', 'watch', 'practice', 'exam', 'review', 'assess', 'other'
  )),
  order_index INTEGER NOT NULL,
  estimated_hours DECIMAL(4,2),
  prerequisite_activity_id UUID REFERENCES public.activities(id),
  metadata JSONB DEFAULT '{}', -- For type-specific data (pages, problems count, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phase_id, order_index)
);

-- Activity Progress - Track user progress on activities
CREATE TABLE public.activity_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- =====================================================
-- PROBLEM TRACKING (From original vision)
-- =====================================================

-- Problems within resources
CREATE TABLE public.resource_problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  problem_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  solution TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'competition')),
  skills TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource_id, problem_number)
);

-- Problem Progress
CREATE TABLE public.problem_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.resource_problems(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER,
  hints_used INTEGER DEFAULT 0,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, problem_id)
);

-- Generated Hints
CREATE TABLE public.problem_hints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES public.resource_problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hint_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(problem_id, user_id, hint_number)
);

-- =====================================================
-- ASSESSMENT & PROGRESS TRACKING
-- =====================================================

-- Practice Exam Attempts
CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  score INTEGER,
  total_questions INTEGER,
  time_taken_minutes INTEGER,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  answers JSONB DEFAULT '[]', -- Array of {question_id, answer, correct}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading Progress
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER,
  reading_time_minutes INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  bookmarks JSONB DEFAULT '[]', -- Array of {page, note, created_at}
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- =====================================================
-- ANALYTICS & INSIGHTS
-- =====================================================

-- Study Sessions
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  session_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_email ON public.users(email);

-- Goal indexes
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_target_date ON public.goals(target_date);

-- Phase indexes
CREATE INDEX idx_phases_goal_id ON public.phases(goal_id);
CREATE INDEX idx_phases_status ON public.phases(status);

-- Resource indexes
CREATE INDEX idx_resources_user_id ON public.resources(user_id);
CREATE INDEX idx_resources_type ON public.resources(type);

-- Activity indexes
CREATE INDEX idx_activities_phase_id ON public.activities(phase_id);
CREATE INDEX idx_activities_resource_id ON public.activities(resource_id);
CREATE INDEX idx_activities_type ON public.activities(activity_type);

-- Progress indexes
CREATE INDEX idx_activity_progress_user_id ON public.activity_progress(user_id);
CREATE INDEX idx_activity_progress_activity_id ON public.activity_progress(activity_id);
CREATE INDEX idx_problem_progress_user_id ON public.problem_progress(user_id);
CREATE INDEX idx_reading_progress_user_id ON public.reading_progress(user_id);

-- Session indexes
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_date ON public.study_sessions(session_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Goal policies
CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

-- Phase policies (users can manage phases for their goals)
CREATE POLICY "Users can manage phases for own goals" ON public.phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.goals 
      WHERE goals.id = phases.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

-- Resource policies
CREATE POLICY "Users can manage own resources" ON public.resources
  FOR ALL USING (auth.uid() = user_id);

-- Goal resource policies
CREATE POLICY "Users can manage goal resources for own goals" ON public.goal_resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.goals 
      WHERE goals.id = goal_resources.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

-- Activity policies
CREATE POLICY "Users can manage activities for own goals" ON public.activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.phases
      JOIN public.goals ON goals.id = phases.goal_id
      WHERE phases.id = activities.phase_id
      AND goals.user_id = auth.uid()
    )
  );

-- Progress policies (all progress tables)
CREATE POLICY "Users can manage own activity progress" ON public.activity_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own problem progress" ON public.problem_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading progress" ON public.reading_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own exam attempts" ON public.exam_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Resource problems policies
CREATE POLICY "Users can manage problems for own resources" ON public.resource_problems
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.resources 
      WHERE resources.id = resource_problems.resource_id 
      AND resources.user_id = auth.uid()
    )
  );

-- Hints policies
CREATE POLICY "Users can manage own hints" ON public.problem_hints
  FOR ALL USING (auth.uid() = user_id);

-- Study session policies
CREATE POLICY "Users can manage own study sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phases_updated_at BEFORE UPDATE ON public.phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_progress_updated_at BEFORE UPDATE ON public.activity_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_problems_updated_at BEFORE UPDATE ON public.resource_problems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_progress_updated_at BEFORE UPDATE ON public.problem_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_progress_updated_at BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();