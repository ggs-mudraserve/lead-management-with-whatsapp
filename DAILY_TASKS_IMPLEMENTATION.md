# Daily Tasks Feature Implementation

## Overview
This document provides a complete implementation of the Daily Tasks feature for the lead and bank application management system. The feature automatically creates tasks from missed opportunities with specific reasons and provides comprehensive task management capabilities.

## Key Features Implemented

### 1. Automated Task Creation
- **Daily cron job** runs at 8 PM IST (2:30 PM UTC)
- **Automatic task generation** for leads with 'Ringing' or 'Doc Pending' missed opportunity reasons
- **One task per lead per date** - prevents duplicates even if both reasons are selected
- **Assignment to lead owner** - tasks are automatically assigned to the lead's current owner

### 2. Task Management Interface
- **Complete task lifecycle management** - open, closed, rescheduled
- **Close reasons dropdown** - Customer NI, Low Sal, More than 3 days follow, Docs Received, Cibil Related
- **Scheduler functionality** - reschedule tasks to future dates
- **Task visibility** - tasks show on scheduled date only if status is 'open'
- **Independent operation** - closing tasks has NO effect on missed opportunity data

### 3. Role-Based Access Control
- **Agent/Team Leader** - View and manage assigned tasks for current date
- **Admin** - Advanced filtering and management capabilities
- **Security** - All access controlled via RLS policies following existing patterns

### 4. Admin Advanced Features
- **Agent-wise view** - Filter tasks by specific agents
- **Segment-wise view** - Filter by PL, BL, PL_DIGITAL, BL_DIGITAL
- **Team-wise view** - Filter by team membership
- **Date-wise view** - Custom date ranges and quick filters
- **Status-wise view** - Filter by open/closed status
- **Export functionality** - Excel export for data analysis

## Database Schema

### Tables Created

#### 1. `daily_tasks` Table
```sql
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profile(id),
  created_by UUID REFERENCES profile(id),
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  original_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status task_status_enum NOT NULL DEFAULT 'open',
  close_reason close_reason_enum NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ NULL,
  
  -- Ensure one task per lead per original date
  UNIQUE(lead_id, original_date)
);
```

#### 2. Enums Created
```sql
CREATE TYPE task_status_enum AS ENUM ('open', 'closed');
CREATE TYPE close_reason_enum AS ENUM ('customer_ni', 'low_sal', 'more_than_3_days_follow', 'docs_received', 'cibil_related');
```

### Functions Created

#### 1. Daily Task Creation Function
```sql
CREATE OR REPLACE FUNCTION create_daily_tasks_for_date(target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
-- Creates tasks for leads with 'Ringing' or 'Doc Pending' reasons on target_date
-- Returns count of tasks created
$$;
```

#### 2. Date Range Processing Function
```sql
CREATE OR REPLACE FUNCTION create_daily_tasks_for_date_range(start_date DATE, end_date DATE DEFAULT NULL)
RETURNS TABLE(process_date DATE, tasks_created INTEGER) AS $$
-- Bulk creates tasks for date range - useful for initial setup
$$;
```

### Cron Job Setup
```sql
SELECT cron.schedule(
    'daily-task-creation',
    '30 14 * * *',  -- 2:30 PM UTC = 8:00 PM IST
    'SELECT create_daily_tasks_for_date();'
);
```

### RLS Policies
- **Select Policy** - Users can view tasks assigned to them or accessible through lead access
- **Insert Policy** - Only admins or system can create tasks
- **Update Policy** - Users can update tasks for leads they can access
- **Delete Policy** - Only admins can delete tasks

## Frontend Implementation

### Files Created/Modified

#### New Files
- `src/app/daily-tasks/page.tsx` - Main daily tasks page
- `src/app/daily-tasks/_components/daily-tasks-table.tsx` - Main data table component
- `src/app/daily-tasks/_components/admin-task-filters.tsx` - Admin advanced filtering
- `src/lib/supabase/queries/daily-tasks.ts` - Database query functions

#### Modified Files
- `src/lib/supabase/database.types.ts` - Added new table and enum types
- `src/components/layout/header.tsx` - Added navigation link for Daily Tasks

#### Database Migration Files
- `migrations/001_create_daily_tasks_schema.sql` - Table and enum creation
- `migrations/002_create_daily_task_function.sql` - Functions and cron job
- `migrations/003_create_daily_tasks_rls.sql` - Security policies

## Installation Instructions

### Step 1: Database Setup
Run the following SQL files in order in your Supabase SQL Editor:

1. **Execute `migrations/001_create_daily_tasks_schema.sql`**
   - Creates daily_tasks table
   - Creates task_status_enum and close_reason_enum
   - Creates indexes and triggers

2. **Execute `migrations/002_create_daily_task_function.sql`**
   - Creates task creation functions
   - Sets up cron job (requires pg_cron extension)

3. **Execute `migrations/003_create_daily_tasks_rls.sql`**
   - Enables RLS on daily_tasks table
   - Creates security policies
   - Grants permissions

### Step 2: Enable pg_cron Extension
In Supabase dashboard, enable the pg_cron extension:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Step 3: Schedule Cron Job
After enabling pg_cron, run:
```sql
SELECT cron.schedule(
    'daily-task-creation',
    '30 14 * * *',  -- 2:30 PM UTC = 8:00 PM IST
    'SELECT create_daily_tasks_for_date();'
);
```

### Step 4: Initial Data Processing (Optional)
To create tasks for historical data:
```sql
-- Create tasks for past 30 days (example)
SELECT create_daily_tasks_for_date_range(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day');
```

### Step 5: Deploy Frontend Code
The frontend code is already implemented and will be deployed with your next application deployment.

## Business Logic

### Task Creation Rules
1. **Timing** - Daily at 8 PM IST
2. **Criteria** - Leads with 'Ringing' OR 'Doc Pending' missed opportunity reason added that day
3. **Deduplication** - One task per lead per date maximum
4. **Assignment** - Tasks assigned to current lead owner
5. **Requirement** - Lead must have an assigned owner

### Task Lifecycle
1. **Creation** - Automatic via cron job
2. **Visibility** - Shows on scheduled_date if status = 'open'
3. **Closing** - User selects close reason, status becomes 'closed'
4. **Rescheduling** - User picks new date, task moves to that date
5. **Independence** - Task operations don't affect missed opportunity data

### Access Control
- **Agents** - See tasks assigned to them
- **Team Leaders** - See tasks for their team members
- **Admins** - See all tasks with advanced filtering
- **Backend** - See tasks with export capabilities

## API Endpoints

### Query Functions
- `fetchDailyTasks(filters)` - Get tasks for regular users
- `fetchAdminDailyTasks(filters)` - Get tasks with admin filters
- `closeTask(taskId, closeReason, notes?)` - Close a task
- `rescheduleTask(taskId, newDate, notes?)` - Reschedule a task
- `updateTaskNotes(taskId, notes)` - Update task notes
- `getTaskStatistics(dateRange?)` - Get task analytics

### Filter Options
- **segments** - Filter by lead segments
- **ownerIds** - Filter by task assignees
- **teamIds** - Filter by team membership
- **scheduledDate** - Filter by specific date
- **status** - Filter by task status
- **dateRange** - Admin date range filtering
- **viewType** - Admin view type (agent/segment/team/date/status)

## Security Considerations

### Data Protection
- All database queries use RLS policies
- Task access follows existing lead access patterns
- No sensitive data exposed in task records
- Audit trail maintained for all operations

### Performance Optimization
- Indexed queries on key columns
- Pagination for large datasets
- Debounced filter updates
- Optimistic UI updates

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Graceful degradation on failures
- Retry mechanisms for cron jobs

## Monitoring and Maintenance

### Cron Job Monitoring
```sql
-- Check cron job status
SELECT * FROM cron.job WHERE jobname = 'daily-task-creation';

-- Check cron job run history
SELECT * FROM cron.job_run_details WHERE jobid = (
    SELECT jobid FROM cron.job WHERE jobname = 'daily-task-creation'
) ORDER BY start_time DESC LIMIT 10;
```

### Task Statistics
```sql
-- Daily task creation stats
SELECT 
    original_date,
    COUNT(*) as tasks_created,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as tasks_completed
FROM daily_tasks 
WHERE original_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY original_date 
ORDER BY original_date DESC;
```

### Performance Monitoring
- Monitor query performance on daily_tasks table
- Track cron job execution times
- Monitor user interface response times
- Track task completion rates by agent/team

## Future Enhancements

### Potential Improvements
1. **Notifications** - Email/SMS reminders for pending tasks
2. **Analytics Dashboard** - Advanced reporting and metrics
3. **Task Templates** - Predefined task types and workflows
4. **Integration** - Connect with external CRM systems
5. **Mobile App** - Mobile interface for field agents
6. **AI Insights** - Predictive analytics for task prioritization

### Scalability Considerations
- Database partitioning for large task volumes
- Caching strategies for frequent queries
- Background job optimization
- Real-time updates via WebSocket connections

## Support and Troubleshooting

### Common Issues
1. **Cron job not running** - Check pg_cron extension and permissions
2. **Tasks not appearing** - Verify lead owner assignments and RLS policies
3. **Performance issues** - Check indexes and query optimization
4. **Permission errors** - Review RLS policies and user roles

### Debug Queries
```sql
-- Check recent task creation
SELECT * FROM daily_tasks WHERE created_at >= CURRENT_DATE ORDER BY created_at DESC;

-- Check missed opportunities for today
SELECT l.id, l.first_name, l.last_name, mo.reason 
FROM leads l
JOIN lead_missed_reasons lmr ON l.id = lmr.lead_id
JOIN missed_opportunity mo ON lmr.reason_id = mo.id
WHERE DATE(lmr.created_at) = CURRENT_DATE 
AND mo.reason IN ('Ringing', 'Doc Pending');
```

## Conclusion

The Daily Tasks feature provides a comprehensive solution for automated task management based on missed opportunities. It follows the application's existing patterns for security, UI/UX, and data handling while providing powerful new capabilities for task tracking and management.

The implementation is production-ready and includes all necessary security, performance, and monitoring considerations. The feature seamlessly integrates with the existing application architecture and provides a solid foundation for future enhancements.