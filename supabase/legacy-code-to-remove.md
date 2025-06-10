# Legacy Code to Remove from Abhyasa

This document lists all the legacy curriculum-based code that should be removed from the application to complete the transition to the goal-based architecture.

## API Routes to Delete

### Curriculum Management
- `/app/api/curriculum/route.ts` - Creates and fetches curricula
- `/app/api/curriculum/[curriculumId]/route.ts` - Individual curriculum operations

### Legacy Problem Management
- `/app/api/generate-problem/route.ts` - Generates problems for sections (legacy structure)
- `/app/api/hint/route.ts` - Legacy hint generation endpoint

### Legacy Progress Tracking
- `/app/api/progress/route.ts` - Progress tracking for curriculum-based structure

### PDF Processing (Legacy)
- `/app/api/process-pdf/route.ts` - Extracts entire curriculum structure from PDFs
- This should be replaced with the resource-based extraction in `/app/api/problems/extract/route.ts`

## Pages to Delete

### Dashboard Pages
- `/app/dashboard/curriculum/` - Entire directory and all subdirectories
- `/app/dashboard/chapter/[chapterId]/page.tsx` - Chapter view page
- `/app/dashboard/section/[sectionId]/` - Entire section directory
- `/app/dashboard/upload/page.tsx` - PDF upload for curriculum extraction

## Components to Update

### Dashboard Main Page
- `/app/dashboard/page.tsx` - Remove the curriculum/chapter/section navigation
- Keep only the goals-based navigation

## Type Definitions to Clean

### Database Types
- `/lib/database.types.ts` - Remove all curriculum, chapter, section type definitions
- Keep only goal-based types

### Gemini Schemas
- `/lib/gemini-schemas.ts` - Remove curriculum extraction schemas
- Keep only problem extraction and hint generation schemas

## Database Tables to Drop

```sql
-- Drop foreign key constraints first
ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_section_id_fkey;
ALTER TABLE public.curricula DROP COLUMN IF EXISTS resource_id;

-- Drop the legacy tables
DROP TABLE IF EXISTS public.sections CASCADE;
DROP TABLE IF EXISTS public.chapters CASCADE;
DROP TABLE IF EXISTS public.curricula CASCADE;

-- Remove the section_id column from problems table
ALTER TABLE public.problems DROP COLUMN IF EXISTS section_id;
```

## Migration Steps

1. **Update all problem references** - Ensure all problems are linked to resources, not sections
2. **Export any curriculum data** - If needed, create a migration script to convert curricula to goals
3. **Update navigation** - Remove all curriculum-based navigation from the UI
4. **Clean imports** - Remove unused imports related to curriculum structure
5. **Update tests** - Remove or update any tests that rely on the curriculum structure

## Post-Cleanup Tasks

1. Update the main dashboard to focus on goals
2. Ensure all problem-related features work with resources
3. Update documentation to reflect the new structure
4. Test the PDF extraction to ensure it works with resources only