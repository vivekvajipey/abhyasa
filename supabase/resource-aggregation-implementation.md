# Resource Aggregation Implementation Guide

## Overview

This implementation provides automatic aggregation of resources from activities up to their parent phases and goals using database views and functions. Resources associated with activities will now automatically appear in the resource counts and lists for their containing phases and goals.

## Database Changes

### New Views

1. **`phase_resources_view`** - Aggregates all resources from activities within a phase
2. **`goal_resources_view`** - Aggregates all resources from:
   - Direct goal-resource associations (via `goal_resources` table)
   - All activities within all phases of the goal

### New Functions

- `get_goal_resources(goal_id)` - Returns all unique resources for a goal with association types
- `get_phase_resources(phase_id)` - Returns all unique resources for a phase with activity count
- `count_goal_resources(goal_id)` - Returns the total count of unique resources for a goal
- `count_phase_resources(phase_id)` - Returns the total count of unique resources for a phase

## Implementation Steps

### 1. Apply the Database Migration

Run the SQL file to create the views and functions:

```bash
supabase db push --file supabase/resource-aggregation-views.sql
```

### 2. Update TypeScript Types

Add these types to your `types/goals.ts` or create a new file:

```typescript
// Resource view types
export interface PhaseResourceView {
  phase_id: string;
  goal_id: string;
  resource_id: string;
  type: string;
  title: string;
  author?: string;
  url?: string;
  description?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  association_type: 'activity';
  activity_id: string;
  activity_title: string;
}

export interface GoalResourceView {
  goal_id: string;
  resource_id: string;
  type: string;
  title: string;
  author?: string;
  url?: string;
  description?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  association_type: 'direct' | 'activity';
  phase_id?: string;
  phase_name?: string;
  activity_id?: string;
  activity_title?: string;
}

export interface AggregatedResource {
  resource_id: string;
  type: string;
  title: string;
  author?: string;
  url?: string;
  description?: string;
  metadata?: any;
  association_types?: string[];
  activity_count?: number;
}
```

### 3. Update Goal Resource Queries

Replace direct queries to `goal_resources` with the new view:

```typescript
// Old approach
const { data: goalResources } = await supabase
  .from('goal_resources')
  .select('*, resources(*)')
  .eq('goal_id', goalId);

// New approach - gets ALL resources including from activities
const { data: resources } = await supabase
  .rpc('get_goal_resources', { p_goal_id: goalId });

// Or use the view directly for more details
const { data: resourceDetails } = await supabase
  .from('goal_resources_view')
  .select('*')
  .eq('goal_id', goalId);
```

### 4. Update Phase Resource Queries

For phase resources:

```typescript
// Get all resources for a phase
const { data: resources } = await supabase
  .rpc('get_phase_resources', { p_phase_id: phaseId });

// Or use the view directly
const { data: resourceDetails } = await supabase
  .from('phase_resources_view')
  .select('*')
  .eq('phase_id', phaseId);
```

### 5. Update Resource Counts

Replace manual counting with the new functions:

```typescript
// For goals
const { data: count } = await supabase
  .rpc('count_goal_resources', { p_goal_id: goalId });

// For phases
const { data: count } = await supabase
  .rpc('count_phase_resources', { p_phase_id: phaseId });
```

### 6. Update UI Components

Update components that display resource counts and lists:

```tsx
// Example: Goal resources tab
export async function GoalResourcesTab({ goalId }: { goalId: string }) {
  const { data: resources } = await supabase
    .rpc('get_goal_resources', { p_goal_id: goalId });

  const directResources = resources?.filter(r => 
    r.association_types?.includes('direct')
  );
  
  const activityResources = resources?.filter(r => 
    r.association_types?.includes('activity') && 
    !r.association_types?.includes('direct')
  );

  return (
    <div>
      <h3>Resources ({resources?.length || 0})</h3>
      
      {directResources?.length > 0 && (
        <section>
          <h4>Direct Resources</h4>
          {/* Render direct resources */}
        </section>
      )}
      
      {activityResources?.length > 0 && (
        <section>
          <h4>Resources from Activities</h4>
          {/* Render activity resources */}
        </section>
      )}
    </div>
  );
}
```

## Benefits

1. **Automatic Propagation**: Resources added to activities automatically appear in phase and goal resource lists
2. **No Duplication**: Uses views instead of duplicating data
3. **Performance**: Indexed queries ensure fast lookups
4. **Transparency**: Can distinguish between direct and activity-based associations
5. **Backwards Compatible**: Existing `goal_resources` table remains unchanged

## Testing

Test the implementation with these queries:

```sql
-- Check resources for a specific goal
SELECT * FROM get_goal_resources('your-goal-id');

-- Check resource count
SELECT count_goal_resources('your-goal-id');

-- See detailed associations
SELECT * FROM goal_resources_view WHERE goal_id = 'your-goal-id';
```

## Notes

- The views automatically respect RLS policies from the underlying tables
- Resources are deduplicated - each unique resource appears only once in the aggregated results
- The `association_types` array shows how a resource is connected (e.g., `['direct', 'activity']` if linked both ways)