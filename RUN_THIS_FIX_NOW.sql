-- ========================================
-- DAILY TASK TRANSFER FIX - RUN THIS NOW
-- ========================================
-- This script will:
-- 1. Transfer all open tasks to today
-- 2. Fix the cron job to run at 8 PM IST
-- ========================================

-- STEP 1: Check current task distribution BEFORE transfer
SELECT 
    '=== BEFORE TRANSFER ===' as step,
    scheduled_date,
    status,
    COUNT(*) as task_count
FROM daily_tasks 
WHERE scheduled_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY scheduled_date, status
ORDER BY scheduled_date DESC, status;

-- STEP 2: Transfer all open tasks from previous days to TODAY
SELECT 
    '=== TRANSFERRING TASKS ===' as step,
    carryover_uncompleted_tasks(CURRENT_DATE) as tasks_transferred;

-- STEP 3: Check task distribution AFTER transfer
SELECT 
    '=== AFTER TRANSFER ===' as step,
    scheduled_date,
    status,
    COUNT(*) as task_count
FROM daily_tasks 
WHERE scheduled_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY scheduled_date, status
ORDER BY scheduled_date DESC, status;

-- STEP 4: Remove any existing 8 PM transfer cron jobs
SELECT cron.unschedule(jobname) 
FROM cron.job 
WHERE jobname IN ('transfer-open-tasks-8pm-ist', 'transfer-daily-tasks-8pm');

-- STEP 5: Create the CORRECT cron job for 8 PM IST
-- IMPORTANT: 8 PM IST = 14:30 UTC (IST is UTC+5:30)
SELECT 
    '=== CREATING 8 PM IST CRON JOB ===' as step,
    cron.schedule(
        'transfer-open-tasks-8pm-ist',
        '30 14 * * *',  -- 14:30 UTC = 8:00 PM IST
        'SELECT carryover_uncompleted_tasks(CURRENT_DATE + INTERVAL ''1 day'');'
    ) as new_cron_job_id;

-- STEP 6: Verify all cron jobs
SELECT 
    '=== ALL CRON JOBS ===' as step,
    jobid,
    jobname,
    schedule,
    command,
    active,
    CASE 
        WHEN schedule = '30 14 * * *' THEN '8:00 PM IST (14:30 UTC)'
        WHEN schedule = '30 9 * * *' THEN '3:00 PM IST (09:30 UTC)'
        ELSE schedule 
    END as schedule_time
FROM cron.job 
WHERE jobname LIKE '%task%' OR jobname LIKE '%daily%'
ORDER BY jobname;

-- STEP 7: Show summary
SELECT 
    '=== SUMMARY ===' as step,
    'Tasks have been transferred to today. ' ||
    'Cron job set to run daily at 8 PM IST.' ||
    ' Next run: Today at 8 PM IST.' as message;

-- STEP 8: Optional - Check last few cron job executions
SELECT 
    '=== RECENT CRON EXECUTIONS ===' as step,
    job.jobname,
    run.job_pid,
    run.database,
    run.username,
    run.command,
    run.status,
    run.return_message,
    run.start_time,
    run.end_time
FROM cron.job_run_details run
JOIN cron.job job ON job.jobid = run.jobid
WHERE job.jobname LIKE '%task%'
ORDER BY run.start_time DESC
LIMIT 10;