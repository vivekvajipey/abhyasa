-- Enhanced Resources Schema for Abhyasa
-- This extends the goals schema to support comprehensive resource types

-- Update resource types to include all the categories
ALTER TABLE public.resources 
DROP CONSTRAINT resources_type_check;

ALTER TABLE public.resources 
ADD CONSTRAINT resources_type_check 
CHECK (type IN ('textbook', 'reading', 'practice_exam', 'problem_set', 'video', 'reference', 'website', 'other'));

-- Add metadata column for resource-specific data
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Practice Exams table - Special handling for timed assessments
CREATE TABLE public.practice_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL,
  time_limit_minutes INTEGER,
  passing_score INTEGER,
  topics TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'competition')),
  source_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practice Exam Attempts - Track each attempt at an exam
CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  practice_exam_id UUID NOT NULL REFERENCES public.practice_exams(id) ON DELETE CASCADE,
  score INTEGER,
  time_taken_minutes INTEGER,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  answers JSONB, -- Store question answers and correctness
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading Progress - Track progress through reading materials
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  pages_read INTEGER DEFAULT 0,
  total_pages INTEGER,
  reading_time_minutes INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  bookmarks JSONB, -- Store page numbers and notes
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- Resource Links - Allow resources to reference each other
CREATE TABLE public.resource_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  target_resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('prerequisite', 'supplement', 'solution', 'related')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_resource_id, target_resource_id, link_type)
);

-- Activity types need to be expanded
ALTER TABLE public.activities 
DROP CONSTRAINT activities_type_check;

ALTER TABLE public.activities 
ADD CONSTRAINT activities_type_check 
CHECK (type IN ('read', 'watch', 'practice', 'exam', 'review', 'assess', 'other'));

-- Add columns to activities for better tracking
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS target_score INTEGER,
ADD COLUMN IF NOT EXISTS pages_to_read INTEGER,
ADD COLUMN IF NOT EXISTS problems_to_solve INTEGER;

-- Indexes for new tables
CREATE INDEX idx_practice_exams_resource_id ON public.practice_exams(resource_id);
CREATE INDEX idx_exam_attempts_user_id ON public.exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_exam_id ON public.exam_attempts(practice_exam_id);
CREATE INDEX idx_reading_progress_user_id ON public.reading_progress(user_id);
CREATE INDEX idx_reading_progress_resource_id ON public.reading_progress(resource_id);
CREATE INDEX idx_resource_links_source ON public.resource_links(source_resource_id);
CREATE INDEX idx_resource_links_target ON public.resource_links(target_resource_id);

-- RLS policies for new tables
ALTER TABLE public.practice_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_links ENABLE ROW LEVEL SECURITY;

-- Practice exams are viewable by all authenticated users
CREATE POLICY "Users can view all practice exams" ON public.practice_exams
  FOR SELECT USING (true);

-- Users can only manage practice exams for their resources
CREATE POLICY "Users can manage practice exams for own resources" ON public.practice_exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.resources 
      WHERE resources.id = practice_exams.resource_id 
      AND resources.user_id = auth.uid()
    )
  );

-- Users can only see their own exam attempts
CREATE POLICY "Users can manage own exam attempts" ON public.exam_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own reading progress
CREATE POLICY "Users can manage own reading progress" ON public.reading_progress
  FOR ALL USING (auth.uid() = user_id);

-- Resource links are viewable by all authenticated users
CREATE POLICY "Users can view all resource links" ON public.resource_links
  FOR SELECT USING (true);

-- Users can only manage links for their resources
CREATE POLICY "Users can manage links for own resources" ON public.resource_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.resources 
      WHERE resources.id IN (resource_links.source_resource_id, resource_links.target_resource_id)
      AND resources.user_id = auth.uid()
    )
  );

-- Update triggers for new tables
CREATE TRIGGER update_practice_exams_updated_at BEFORE UPDATE ON public.practice_exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_progress_updated_at BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();