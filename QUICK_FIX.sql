-- ============================
-- QUICK FIX - RUN THESE TWO COMMANDS
-- ============================

-- 1. Transfer all open tasks to today RIGHT NOW
SELECT carryover_uncompleted_tasks(CURRENT_DATE);

-- 2. Create cron job for 8 PM IST daily transfers
SELECT cron.schedule(
    'transfer-open-tasks-8pm-ist',
    '30 14 * * *',  -- 8:00 PM IST
    'SELECT carryover_uncompleted_tasks(CURRENT_DATE + INTERVAL ''1 day'');'
);