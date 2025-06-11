-- =====================================================
-- Resource Aggregation Views
-- =====================================================
-- These views provide automatic aggregation of resources from activities
-- up to their parent phases and goals, ensuring resources are visible
-- at all appropriate levels of the hierarchy

-- Drop existing views if they exist (for clean re-creation)
DROP VIEW IF EXISTS public.phase_resources_view CASCADE;
DROP VIEW IF EXISTS public.goal_resources_view CASCADE;

-- =====================================================
-- PHASE RESOURCES VIEW
-- =====================================================
-- Aggregates all resources associated with a phase, including:
-- 1. Resources directly linked to activities in the phase
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

-- Create an index on the underlying tables to support this view
CREATE INDEX IF NOT EXISTS idx_activities_phase_resource 
    ON public.activities(phase_id, resource_id) 
    WHERE resource_id IS NOT NULL;

-- =====================================================
-- GOAL RESOURCES VIEW
-- =====================================================
-- Aggregates all resources associated with a goal, including:
-- 1. Resources directly linked to the goal (via goal_resources)
-- 2. Resources from all activities within all phases of the goal
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

-- =====================================================
-- CONVENIENCE FUNCTIONS
-- =====================================================

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

-- Function to get all unique resources for a phase
CREATE OR REPLACE FUNCTION get_phase_resources(p_phase_id UUID)
RETURNS TABLE (
    resource_id UUID,
    type TEXT,
    title TEXT,
    author TEXT,
    url TEXT,
    description TEXT,
    metadata JSONB,
    activity_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        prv.resource_id,
        prv.type,
        prv.title,
        prv.author,
        prv.url,
        prv.description,
        prv.metadata,
        COUNT(DISTINCT prv.activity_id) as activity_count
    FROM public.phase_resources_view prv
    WHERE prv.phase_id = p_phase_id
    GROUP BY 
        prv.resource_id,
        prv.type,
        prv.title,
        prv.author,
        prv.url,
        prv.description,
        prv.metadata;
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

-- =====================================================
-- ROW LEVEL SECURITY FOR VIEWS
-- =====================================================
-- Views inherit RLS from their underlying tables, but we can add
-- explicit policies for the functions

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_goal_resources(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_phase_resources(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_goal_resources(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_phase_resources(UUID) TO authenticated;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================
-- To get all resources for a goal (including from activities):
-- SELECT * FROM goal_resources_view WHERE goal_id = 'your-goal-id';
-- or
-- SELECT * FROM get_goal_resources('your-goal-id');

-- To get resource count for a goal:
-- SELECT count_goal_resources('your-goal-id');

-- To get all resources for a phase:
-- SELECT * FROM phase_resources_view WHERE phase_id = 'your-phase-id';
-- or
-- SELECT * FROM get_phase_resources('your-phase-id');

-- To get resource count for a phase:
-- SELECT count_phase_resources('your-phase-id');