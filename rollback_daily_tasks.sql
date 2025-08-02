-- ROLLBACK SCRIPT for Daily Tasks Migrations
-- Run this if you need to completely remove the daily tasks feature
-- WARNING: This will delete all daily tasks data permanently

-- Step 1: Remove cron job (if exists)
SELECT cron.unschedule('daily-task-creation');

-- Step 2: Drop RLS policies
DROP POLICY IF EXISTS "daily_tasks_select_policy" ON daily_tasks;
DROP POLICY IF EXISTS "daily_tasks_insert_policy" ON daily_tasks;
DROP POLICY IF EXISTS "daily_tasks_update_policy" ON daily_tasks;
DROP POLICY IF EXISTS "daily_tasks_delete_policy" ON daily_tasks;

-- Step 3: Drop functions
DROP FUNCTION IF EXISTS create_daily_tasks_for_date_range(DATE, DATE);
DROP FUNCTION IF EXISTS create_daily_tasks_for_date(DATE);

-- Step 4: Drop table (this will cascade and drop all data)
DROP TABLE IF EXISTS daily_tasks CASCADE;

-- Step 5: Drop custom types
DROP TYPE IF EXISTS close_reason_enum CASCADE;
DROP TYPE IF EXISTS task_status_enum CASCADE;

-- Step 6: Drop trigger function if no other tables use it
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
-- Note: Commented out as other tables might use this function

SELECT 'Daily tasks feature has been completely removed' as status;