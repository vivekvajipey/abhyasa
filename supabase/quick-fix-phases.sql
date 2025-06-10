-- Quick fix for phases table naming issue
-- The code expects 'phases' but the database has 'goal_phases'

-- Option 1: Create an alias view (recommended for immediate fix)
CREATE OR REPLACE VIEW public.phases AS
SELECT * FROM public.goal_phases;

-- Grant same permissions on the view
GRANT ALL ON public.phases TO authenticated;

-- Option 2: Rename the table (use with caution - may break other code)
-- ALTER TABLE public.goal_phases RENAME TO phases;
-- Don't forget to update all foreign key references if you use this option!