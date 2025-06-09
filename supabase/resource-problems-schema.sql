-- Migration to link problems with resources (practice exams and problem sets)
-- This allows problems to be associated with resources instead of just sections

-- Add resource_id to problems table
ALTER TABLE public.problems 
ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_problems_resource_id ON public.problems(resource_id);

-- Update RLS policies to allow users to view problems for their resources
CREATE POLICY "Users can manage problems for own resources" ON public.problems
  FOR ALL USING (
    resource_id IS NULL OR EXISTS (
      SELECT 1 FROM public.resources 
      WHERE resources.id = problems.resource_id 
      AND resources.user_id = auth.uid()
    )
  );

-- Create a table to track topic-wise performance in exams
CREATE TABLE IF NOT EXISTS public.exam_topic_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_attempt_id, topic)
);

-- Add RLS for exam topic performance
ALTER TABLE public.exam_topic_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exam topic performance" ON public.exam_topic_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts 
      WHERE exam_attempts.id = exam_topic_performance.exam_attempt_id 
      AND exam_attempts.user_id = auth.uid()
    )
  );

-- Add index for performance
CREATE INDEX idx_exam_topic_performance_attempt ON public.exam_topic_performance(exam_attempt_id);