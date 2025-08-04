-- Fix Daily Task Transfer - Create 8 PM IST Cron Job
-- Run this SQL in your Supabase SQL Editor

-- First, let's check the current cron jobs
SELECT 
    jobname,
    schedule,
    command,
    active
FROM cron.job 
WHERE jobname LIKE '%daily%task%' OR jobname LIKE '%task%';

-- Create the correct cron job for 8 PM IST (14:30 UTC)
-- Note: 8 PM IST = 14:30 UTC (IST is UTC+5:30)
SELECT cron.schedule(
    'transfer-open-tasks-8pm-ist',
    '30 14 * * *',  -- 8:00 PM IST (14:30 UTC)
    'SELECT carryover_uncompleted_tasks(CURRENT_DATE + INTERVAL ''1 day'');'
);

-- Verify the new cron job was created
SELECT 
    jobname,
    schedule,
    command,
    active,
    database
FROM cron.job 
WHERE jobname = 'transfer-open-tasks-8pm-ist';

-- Optional: Check if carryover function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'carryover_uncompleted_tasks';

-- Test the carryover function manually (uncomment to run)
-- SELECT carryover_uncompleted_tasks(CURRENT_DATE + INTERVAL '1 day');

-- Check recent task counts to verify the issue
SELECT 
    scheduled_date,
    status,
    COUNT(*) as task_count
FROM daily_tasks 
WHERE scheduled_date >= CURRENT_DATE - INTERVAL '3 days'
GROUP BY scheduled_date, status
ORDER BY scheduled_date DESC, status;