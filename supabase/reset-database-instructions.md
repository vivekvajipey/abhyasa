# How to Wipe and Reinitialize Supabase Database

Follow these steps to completely reset your Supabase database with the new schema.

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor (usually in the left sidebar)
3. Create a new query

## Step 2: Drop All Existing Tables

Run this SQL to completely remove all existing tables:

```sql
-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Drop all tables in public schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restore default privileges
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';
```

## Step 3: Apply the New Schema

1. Copy the entire contents of `/supabase/final-schema.sql`
2. Paste it into a new query in the SQL Editor
3. Run the query

## Step 4: Verify the Installation

Run these queries to verify everything was created correctly:

```sql
-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check all indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

## Step 5: Test Authentication

Create a test user to ensure auth is working:

```sql
-- This will be done through your app's signup flow
-- Just verify that the users table accepts inserts
```

## Important Notes

- **This will delete ALL data** - Make sure you have backups if needed
- The schema includes all necessary RLS policies
- All tables have proper indexes for performance
- The `uuid-ossp` extension is automatically enabled
- Triggers for `updated_at` timestamps are included

## Post-Reset Checklist

1. ✓ All tables created successfully
2. ✓ RLS enabled on all tables
3. ✓ All indexes created
4. ✓ Test user signup works
5. ✓ Test goal creation works
6. ✓ Update your `.env` files if needed
7. ✓ Clear any local caches

## Troubleshooting

If you encounter errors:

1. **Extension not found**: The `uuid-ossp` extension should be available by default, but if not, enable it in the Extensions section of Supabase dashboard

2. **Permission errors**: Make sure you're running the queries as the postgres user

3. **Foreign key violations**: If the complete drop fails, you may need to drop tables individually in reverse dependency order

## Next Steps

After successfully resetting the database:

1. Update your application code to use the new schema
2. Remove all legacy curriculum-related code
3. Test the goal import functionality
4. Implement the new goal-based UI