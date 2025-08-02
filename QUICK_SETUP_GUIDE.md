# 🚀 Daily Tasks - Quick Setup Guide

## Current Issue
You're seeing "Error fetching daily tasks count" because the `daily_tasks` table doesn't exist yet in your database. This is expected - we need to run the database migrations first.

## ⚡ Quick Setup (5 minutes)

### Step 1: Run Database Migrations
Go to your **Supabase Dashboard → SQL Editor** and run these files **in order**:

#### 1️⃣ First Migration - Create Tables and Enums
```sql
-- Copy and paste the contents of: migrations/001_create_daily_tasks_schema.sql
```

#### 2️⃣ Second Migration - Create Functions
```sql
-- Copy and paste the contents of: migrations/002_create_daily_task_function.sql
```

#### 3️⃣ Third Migration - Setup Security
```sql
-- Copy and paste the contents of: migrations/003_create_daily_tasks_rls.sql
```

### Step 2: Enable pg_cron Extension
In Supabase SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Step 3: Schedule the Cron Job
```sql
SELECT cron.schedule(
    'daily-task-creation',
    '30 14 * * *',  -- 2:30 PM UTC = 8:00 PM IST
    'SELECT create_daily_tasks_for_date();'
);
```

### Step 4: Verify Setup (Optional)
Run the verification script:
```sql
-- Copy and paste the contents of: migrations/000_verify_setup.sql
```

### Step 5: Test the Frontend
1. Refresh your browser on the daily-tasks page
2. You should now see the Daily Tasks interface (might be empty initially)

## 🔧 Troubleshooting

### If you still see errors:

#### ❌ "Table doesn't exist"
- Make sure you ran migration 001 first
- Check Supabase logs for any SQL errors

#### ❌ "Permission denied"
- Make sure you ran migration 003 (RLS policies)
- Verify your user has the correct role in the database

#### ❌ "Function doesn't exist"
- Make sure you ran migration 002
- Check if functions were created successfully

#### ❌ "Cron job not working"
- Verify pg_cron extension is installed
- Check cron job was scheduled correctly

## 📋 Migration File Contents

### migrations/001_create_daily_tasks_schema.sql
- Creates `daily_tasks` table
- Creates `task_status_enum` and `close_reason_enum` 
- Adds indexes and triggers
- Sets up table structure

### migrations/002_create_daily_task_function.sql
- Creates `create_daily_tasks_for_date()` function
- Creates `create_daily_tasks_for_date_range()` function
- Sets up cron job scheduling

### migrations/003_create_daily_tasks_rls.sql
- Enables Row Level Security
- Creates access policies
- Grants proper permissions

## 🎯 Expected Result
After running all migrations, you should see:
- Daily Tasks page loads without errors
- Empty table with proper column headers
- Filter controls working
- No data initially (tasks are created by cron job)

## 📞 Need Help?
If you encounter any issues:
1. Check the Supabase logs for detailed error messages
2. Run the verification script to see what's missing
3. Make sure all migrations ran successfully
4. Verify your user has admin/agent role in the profile table

## 🎉 Once Setup is Complete
- The page will work immediately
- Tasks will be automatically created daily at 8 PM IST
- You can manually create test tasks using the functions
- All role-based permissions will work correctly

---

**Next:** Once setup is complete, the Daily Tasks feature will be fully functional and ready for production use!