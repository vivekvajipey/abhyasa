-- Goals and Achievement Platform Schema
-- This extends the existing schema to support goal-oriented learning

-- Learning Goals table - The primary organizing entity
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal Phases table - Phases/steps within a goal (e.g., Foundation, Advanced, Practice)
CREATE TABLE public.goal_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  target_start_date DATE,
  target_end_date DATE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources table - Generic resources (textbooks, videos, practice exams, etc.)
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('textbook', 'video', 'practice_exam', 'article', 'website', 'other')),
  title TEXT NOT NULL,
  author TEXT,
  url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal Resources table - Links resources to goals
CREATE TABLE public.goal_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.goal_phases(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, resource_id)
);

-- Activities table - Specific learning activities within phases
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID NOT NULL REFERENCES public.goal_phases(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('read', 'practice', 'review', 'assess', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  estimated_hours DECIMAL(4,2),
  order_index INTEGER NOT NULL,
  prerequisite_activity_id UUID REFERENCES public.activities(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Progress table - Track progress on activities
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

-- Link existing curricula to resources
ALTER TABLE public.curricula ADD COLUMN resource_id UUID REFERENCES public.resources(id);

-- Link existing problems to activities (optional)
ALTER TABLE public.problems ADD COLUMN activity_id UUID REFERENCES public.activities(id);

-- Indexes for performance
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goal_phases_goal_id ON public.goal_phases(goal_id);
CREATE INDEX idx_resources_user_id ON public.resources(user_id);
CREATE INDEX idx_goal_resources_goal_id ON public.goal_resources(goal_id);
CREATE INDEX idx_goal_resources_resource_id ON public.goal_resources(resource_id);
CREATE INDEX idx_activities_phase_id ON public.activities(phase_id);
CREATE INDEX idx_activity_progress_user_id ON public.activity_progress(user_id);
CREATE INDEX idx_activity_progress_activity_id ON public.activity_progress(activity_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_progress ENABLE ROW LEVEL SECURITY;

-- Goals policies - Users can only see/modify their own goals
CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

-- Goal phases policies - Users can manage phases for their goals
CREATE POLICY "Users can manage phases for own goals" ON public.goal_phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.goals 
      WHERE goals.id = goal_phases.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

-- Resources policies - Users can only see/modify their own resources
CREATE POLICY "Users can manage own resources" ON public.resources
  FOR ALL USING (auth.uid() = user_id);

-- Goal resources policies - Users can manage resource links for their goals
CREATE POLICY "Users can manage resources for own goals" ON public.goal_resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.goals 
      WHERE goals.id = goal_resources.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

-- Activities policies - Users can manage activities for their goal phases
CREATE POLICY "Users can manage activities for own goal phases" ON public.activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.goal_phases
      JOIN public.goals ON goals.id = goal_phases.goal_id
      WHERE goal_phases.id = activities.phase_id
      AND goals.user_id = auth.uid()
    )
  );

-- Activity progress policies - Users can only see/modify their own progress
CREATE POLICY "Users can manage own activity progress" ON public.activity_progress
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_phases_updated_at BEFORE UPDATE ON public.goal_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_progress_updated_at BEFORE UPDATE ON public.activity_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();