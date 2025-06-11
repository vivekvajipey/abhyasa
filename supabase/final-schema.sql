-- =====================================================
-- Abhyasa Learning Platform - Clean Production Schema
-- =====================================================
-- Goal-oriented learning platform that orchestrates multiple resources
-- toward meaningful learning objectives
--
-- Design Principles:
-- 1. Goals are the primary organizing entity
-- 2. Resources are reusable across goals
-- 3. Clear separation between content and progress
-- 4. Extensible via JSONB metadata fields
-- 5. Comprehensive activity and progress tracking
-- 6. NO LEGACY SUPPORT - Clean slate design
-- 7. Ready for complete database reset - no migrations needed

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE USER MANAGEMENT
-- =====================================================

-- Users table extends Supabase auth.users
-- Stores additional profile information
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GOAL HIERARCHY
-- =====================================================

-- Goals: Primary learning objectives (e.g., "Ace USNCO Local Exam")
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  target_date DATE NOT NULL,
  daily_commitment_hours DECIMAL(3,1),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  metadata JSONB DEFAULT '{}', -- For future extensions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phases: Time-bound stages within goals (e.g., "Foundation Building")
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

-- Resources: All learning materials (textbooks, videos, exams, etc.)
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
  metadata JSONB DEFAULT '{}', -- Type-specific data (e.g., {pages: 500, isbn: "..."})
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal-Resource associations
CREATE TABLE public.goal_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, resource_id)
);

-- Resource relationships (prerequisites, supplements, etc.)
CREATE TABLE public.resource_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  target_resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('prerequisite', 'supplement', 'solution', 'related')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_resource_id, target_resource_id, link_type)
);

-- =====================================================
-- ACTIVITY MANAGEMENT
-- =====================================================

-- Activities: Specific learning tasks within phases
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'read', 'watch', 'practice', 'exam', 'review', 'assess', 'other'
  )),
  order_index INTEGER NOT NULL,
  estimated_hours DECIMAL(4,2),
  prerequisite_activity_id UUID REFERENCES public.activities(id),
  metadata JSONB DEFAULT '{}', -- Type-specific data (e.g., {pages_to_read: 50, target_score: 90})
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phase_id, order_index)
);

-- Activity Progress: Track completion of activities
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
-- PROBLEM TRACKING
-- =====================================================

-- Problems: Individual problems from resources
CREATE TABLE public.problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  problem_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  solution TEXT,
  topic TEXT, -- For categorization and filtering
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'competition')),
  skills TEXT[],
  generated BOOLEAN DEFAULT FALSE,
  parent_problem_id UUID REFERENCES public.problems(id), -- For AI-generated variations
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource_id, problem_number)
);

-- User Progress: Track problem completion
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, problem_id)
);

-- Hints: AI-generated hints for problems
CREATE TABLE public.hints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hint_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(problem_id, user_id, hint_number)
);

-- =====================================================
-- SPECIALIZED PROGRESS TRACKING
-- =====================================================

-- Practice Exam Metadata
CREATE TABLE public.practice_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL,
  time_limit_minutes INTEGER,
  passing_score INTEGER,
  topics TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'competition')),
  source_year INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam Attempts: Track practice exam sessions
CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  practice_exam_id UUID NOT NULL REFERENCES public.practice_exams(id) ON DELETE CASCADE,
  score INTEGER,
  time_taken_minutes INTEGER,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  answers JSONB DEFAULT '[]', -- [{question_id, answer, correct, time_spent}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic Performance: Breakdown by topic for exam attempts
CREATE TABLE public.exam_topic_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading Progress: Track progress through reading materials
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER,
  reading_time_minutes INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  bookmarks JSONB DEFAULT '[]', -- [{page, note, created_at}]
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- =====================================================
-- ANALYTICS
-- =====================================================

-- Study Sessions: Time tracking across all activities
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

-- User-related indexes
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_resources_user_id ON public.resources(user_id);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_activity_progress_user_id ON public.activity_progress(user_id);
CREATE INDEX idx_reading_progress_user_id ON public.reading_progress(user_id);
CREATE INDEX idx_exam_attempts_user_id ON public.exam_attempts(user_id);
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);

-- Structure indexes
CREATE INDEX idx_phases_goal_id ON public.phases(goal_id);
CREATE INDEX idx_activities_phase_id ON public.activities(phase_id);
CREATE INDEX idx_activities_resource_id ON public.activities(resource_id);
CREATE INDEX idx_goal_resources_goal_id ON public.goal_resources(goal_id);
CREATE INDEX idx_goal_resources_resource_id ON public.goal_resources(resource_id);

-- Progress indexes
CREATE INDEX idx_user_progress_problem_id ON public.user_progress(problem_id);
CREATE INDEX idx_activity_progress_activity_id ON public.activity_progress(activity_id);
CREATE INDEX idx_problems_resource_id ON public.problems(resource_id);
CREATE INDEX idx_problems_topic ON public.problems(topic);
CREATE INDEX idx_practice_exams_resource_id ON public.practice_exams(resource_id);
CREATE INDEX idx_exam_attempts_exam_id ON public.exam_attempts(practice_exam_id);

-- Date-based indexes
CREATE INDEX idx_goals_target_date ON public.goals(target_date);
CREATE INDEX idx_study_sessions_date ON public.study_sessions(session_date);

-- Status indexes
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_phases_status ON public.phases(status);
CREATE INDEX idx_activity_progress_status ON public.activity_progress(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_topic_performance ENABLE ROW LEVEL SECURITY;
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

-- Phase policies
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

-- Resource link policies (viewable by all, editable by resource owner)
CREATE POLICY "Users can view all resource links" ON public.resource_links
  FOR SELECT USING (true);

CREATE POLICY "Users can manage links for own resources" ON public.resource_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resources 
      WHERE resources.id = resource_links.source_resource_id 
      AND resources.user_id = auth.uid()
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

-- Progress policies
CREATE POLICY "Users can manage own activity progress" ON public.activity_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own problem progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading progress" ON public.reading_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own exam attempts" ON public.exam_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Problem policies
CREATE POLICY "Users can view problems" ON public.problems
  FOR SELECT USING (true);

CREATE POLICY "Users can manage problems for own resources" ON public.problems
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resources 
      WHERE resources.id = problems.resource_id 
      AND resources.user_id = auth.uid()
    )
  );

-- Hint policies
CREATE POLICY "Users can manage own hints" ON public.hints
  FOR ALL USING (auth.uid() = user_id);

-- Practice exam policies
CREATE POLICY "Users can view all practice exams" ON public.practice_exams
  FOR SELECT USING (true);

CREATE POLICY "Users can manage practice exams for own resources" ON public.practice_exams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resources 
      WHERE resources.id = practice_exams.resource_id 
      AND resources.user_id = auth.uid()
    )
  );

-- Exam topic performance policies
CREATE POLICY "Users can manage own exam topic performance" ON public.exam_topic_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts
      WHERE exam_attempts.id = exam_topic_performance.exam_attempt_id
      AND exam_attempts.user_id = auth.uid()
    )
  );

-- Study session policies
CREATE POLICY "Users can manage own study sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- DEVELOPER LOGS (for debugging AI interactions)
-- =====================================================

-- Developer logs for tracking AI API interactions
CREATE TABLE public.developer_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('request', 'response', 'tool_call', 'error', 'info')),
  model TEXT,
  prompt TEXT,
  response TEXT,
  tool_calls JSONB,
  error JSONB,
  metadata JSONB DEFAULT '{}',
  duration INTEGER, -- in milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for developer logs
CREATE INDEX idx_developer_logs_session_id ON public.developer_logs(session_id);
CREATE INDEX idx_developer_logs_user_id ON public.developer_logs(user_id);
CREATE INDEX idx_developer_logs_timestamp ON public.developer_logs(timestamp);
CREATE INDEX idx_developer_logs_type ON public.developer_logs(type);

-- Enable RLS on developer logs
ALTER TABLE public.developer_logs ENABLE ROW LEVEL SECURITY;

-- Developer log policies (only accessible by the user who created them)
CREATE POLICY "Users can manage own developer logs" ON public.developer_logs
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- RESOURCE AGGREGATION VIEWS
-- =====================================================
-- These views provide automatic aggregation of resources from activities
-- up to their parent phases and goals

-- Phase resources view - aggregates resources from activities
CREATE VIEW public.phase_resources_view AS
SELECT DISTINCT
    p.id as phase_id,
    p.goal_id,
    r.id as resource_id,
    r.type,
    r.title,
    r.author,
    r.url,
    r.description,
    r.metadata,
    r.created_at,
    r.updated_at,
    'activity' as association_type,
    a.id as activity_id,
    a.title as activity_title
FROM public.phases p
INNER JOIN public.activities a ON a.phase_id = p.id
INNER JOIN public.resources r ON r.id = a.resource_id
WHERE a.resource_id IS NOT NULL;

-- Goal resources view - aggregates all resources (direct + from activities)
CREATE VIEW public.goal_resources_view AS
-- Direct goal resources
SELECT DISTINCT
    g.id as goal_id,
    r.id as resource_id,
    r.type,
    r.title,
    r.author,
    r.url,
    r.description,
    r.metadata,
    r.created_at,
    r.updated_at,
    'direct' as association_type,
    NULL::uuid as phase_id,
    NULL::text as phase_name,
    NULL::uuid as activity_id,
    NULL::text as activity_title
FROM public.goals g
INNER JOIN public.goal_resources gr ON gr.goal_id = g.id
INNER JOIN public.resources r ON r.id = gr.resource_id

UNION

-- Resources from activities in phases
SELECT DISTINCT
    g.id as goal_id,
    r.id as resource_id,
    r.type,
    r.title,
    r.author,
    r.url,
    r.description,
    r.metadata,
    r.created_at,
    r.updated_at,
    'activity' as association_type,
    p.id as phase_id,
    p.name as phase_name,
    a.id as activity_id,
    a.title as activity_title
FROM public.goals g
INNER JOIN public.phases p ON p.goal_id = g.id
INNER JOIN public.activities a ON a.phase_id = p.id
INNER JOIN public.resources r ON r.id = a.resource_id
WHERE a.resource_id IS NOT NULL;

-- Function to get all unique resources for a goal
CREATE OR REPLACE FUNCTION get_goal_resources(p_goal_id UUID)
RETURNS TABLE (
    resource_id UUID,
    type TEXT,
    title TEXT,
    author TEXT,
    url TEXT,
    description TEXT,
    metadata JSONB,
    association_types TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        grv.resource_id,
        grv.type,
        grv.title,
        grv.author,
        grv.url,
        grv.description,
        grv.metadata,
        array_agg(DISTINCT grv.association_type) as association_types
    FROM public.goal_resources_view grv
    WHERE grv.goal_id = p_goal_id
    GROUP BY 
        grv.resource_id,
        grv.type,
        grv.title,
        grv.author,
        grv.url,
        grv.description,
        grv.metadata;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to count resources for a goal
CREATE OR REPLACE FUNCTION count_goal_resources(p_goal_id UUID)
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT resource_id)
        FROM public.goal_resources_view
        WHERE goal_id = p_goal_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to count resources for a phase  
CREATE OR REPLACE FUNCTION count_phase_resources(p_phase_id UUID)
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT resource_id)
        FROM public.phase_resources_view
        WHERE phase_id = p_phase_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_goal_resources(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_goal_resources(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_phase_resources(UUID) TO authenticated;

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

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON public.problems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_progress_updated_at BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_exams_updated_at BEFORE UPDATE ON public.practice_exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

