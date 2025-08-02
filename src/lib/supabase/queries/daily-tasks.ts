import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

// Type definitions
export type DailyTask = Database['public']['Tables']['daily_tasks']['Row'];
export type DailyTaskInsert = Database['public']['Tables']['daily_tasks']['Insert'];
export type DailyTaskUpdate = Database['public']['Tables']['daily_tasks']['Update'];
export type TaskStatus = Database['public']['Enums']['task_status_enum'];
export type CloseReason = Database['public']['Enums']['close_reason_enum'];

// Extended type with lead and profile information
export interface DailyTaskWithDetails extends DailyTask {
  lead?: {
    id: string;
    segment: string | null;
    first_name: string | null;
    last_name: string | null;
    created_at: string | null;
  };
  assigned_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    role: string | null;
  };
  team_info?: {
    team_id: string | null;
    team_name: string | null;
  };
}

// Filter interface for queries
export interface DailyTaskFilters {
  segments?: string[];
  ownerIds?: string[];
  teamIds?: string[];
  scheduledDate?: string;
  status?: TaskStatus[];
  userRole?: string | null;
  page?: number;
  rowsPerPage?: number;
}

// Admin filter interface with additional options
export interface AdminDailyTaskFilters extends DailyTaskFilters {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  viewType?: 'agent' | 'segment' | 'team' | 'date' | 'status';
}

// Response interface for paginated results
export interface PaginatedDailyTasksResponse {
  data: DailyTaskWithDetails[];
  count: number;
}

/**
 * Fetch daily tasks with filters for regular users
 */
export const fetchDailyTasks = async (filters: DailyTaskFilters): Promise<PaginatedDailyTasksResponse> => {
  const {
    segments = [],
    ownerIds = [],
    teamIds = [],
    scheduledDate,
    status = ['open'],
    page = 0,
    rowsPerPage = 10,
  } = filters;

  let query = supabase
    .from('daily_tasks')
    .select(
      `
      *,
      lead:leads!daily_tasks_lead_id_fkey(
        id,
        segment,
        first_name,
        last_name,
        created_at
      ),
      assigned_user:profile!daily_tasks_assigned_to_fkey(
        id,
        first_name,
        last_name,
        role,
        team_members!left(
          team!left(
            id,
            name
          )
        )
      )
      `,
      { count: 'exact' }
    );

  console.log('Daily tasks query filters:', { segments, status, scheduledDate });

  // Filter by scheduled date (default to today)
  const targetDate = scheduledDate || new Date().toISOString().split('T')[0];
  query = query.eq('scheduled_date', targetDate);

  // Filter by status
  if (status.length > 0) {
    query = query.in('status', status);
  }

  // Filter by segments - PostgREST doesn't support filtering on nested relations with .in()
  // So we need to filter after the query execution on the client side
  // Remove this server-side filter and handle it client-side below

  // Filter by owner IDs
  if (ownerIds.length > 0) {
    query = query.in('assigned_to', ownerIds);
  }

  // Order by created_at desc
  query = query.order('created_at', { ascending: false });

  // For segment filtering, we need to fetch all data first then filter
  // This is because PostgREST doesn't support nested relation filtering with .in()
  let queryForData = query;
  
  // If segments are specified, fetch ALL records for the target date to ensure accurate filtering
  if (segments.length > 0) {
    // Don't apply pagination limits when segment filtering - fetch all records for the date
    // We'll apply pagination after client-side filtering
  } else {
    // Normal pagination when no segment filter
    const from = page * rowsPerPage;
    const to = from + rowsPerPage - 1;
    queryForData = queryForData.range(from, to);
  }

  // Execute the query
  const { data, error, count } = await queryForData;

  console.log('Daily tasks query result:', { 
    dataLength: data?.length || 0, 
    count, 
    error: error?.message || null,
    segments 
  });

  if (error) {
    console.error('Error fetching daily tasks:', error);
    
    // Check if the error is due to table not existing
    if (error.code === '42P01') {
      throw new Error('Daily tasks table not found. Please run the database migrations first.');
    }
    
    throw new Error(`Failed to fetch daily tasks: ${error.message}`);
  }

  if (!data) {
    return { data: [], count: 0 };
  }

  // Process the data to include team information
  const processedData = data.map((task: any) => ({
    ...task,
    team_info: {
      team_id: task.assigned_user?.team_members?.[0]?.team?.id ?? null,
      team_name: task.assigned_user?.team_members?.[0]?.team?.name ?? null,
    },
  }));

  // Filter by team IDs and segments if specified (client-side filtering)
  let filteredData = processedData;
  
  // Apply team filter
  if (teamIds.length > 0) {
    filteredData = filteredData.filter(task => 
      task.team_info?.team_id && teamIds.includes(task.team_info.team_id)
    );
  }
  
  // Apply segment filter
  if (segments.length > 0) {
    filteredData = filteredData.filter(task => 
      task.lead?.segment && segments.includes(task.lead.segment)
    );
  }
  
  // If we did any client-side filtering (segments or teams), handle pagination
  if (segments.length > 0 || (teamIds.length > 0 && segments.length === 0)) {
    // Apply pagination after filtering
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    return {
      data: paginatedData as DailyTaskWithDetails[],
      count: filteredData.length, // Use filtered count, not total count
    };
  }

  return {
    data: filteredData as DailyTaskWithDetails[],
    count: count || 0,
  };
};

/**
 * Fetch daily tasks with advanced filters for admin users
 */
export const fetchAdminDailyTasks = async (filters: AdminDailyTaskFilters): Promise<PaginatedDailyTasksResponse> => {
  const {
    dateRange,
    ...baseFilters
  } = filters;

  // If date range is specified, apply it to base filters
  if (dateRange?.startDate && dateRange?.endDate) {
    // For date range queries, we'll modify the base function
    const modifiedFilters = {
      ...baseFilters,
      scheduledDate: undefined, // Remove single date filter when using range
    };
    
    // Call base function but override date logic
    return fetchDailyTasks(modifiedFilters);
  }

  // Apply other filters from base function
  return fetchDailyTasks(baseFilters);
};

/**
 * Update task status to closed with close reason
 */
export const closeTask = async (taskId: string, closeReason: CloseReason, notes?: string): Promise<void> => {
  const { error } = await supabase
    .from('daily_tasks')
    .update({
      status: 'closed',
      close_reason: closeReason,
      closed_at: new Date().toISOString(),
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error closing task:', error);
    throw new Error(`Failed to close task: ${error.message}`);
  }
};

/**
 * Reschedule task to a new date
 */
export const rescheduleTask = async (taskId: string, newDate: string, notes?: string): Promise<void> => {
  const { error } = await supabase
    .from('daily_tasks')
    .update({
      scheduled_date: newDate,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error rescheduling task:', error);
    throw new Error(`Failed to reschedule task: ${error.message}`);
  }
};

/**
 * Update task notes
 */
export const updateTaskNotes = async (taskId: string, notes: string): Promise<void> => {
  const { error } = await supabase
    .from('daily_tasks')
    .update({
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task notes:', error);
    throw new Error(`Failed to update task notes: ${error.message}`);
  }
};

/**
 * Get task statistics for admin dashboard
 */
export const getTaskStatistics = async (dateRange?: { startDate: string; endDate: string }) => {
  let query = supabase
    .from('daily_tasks')
    .select('status, close_reason, assigned_to, scheduled_date');

  if (dateRange) {
    query = query
      .gte('scheduled_date', dateRange.startDate)
      .lte('scheduled_date', dateRange.endDate);
  } else {
    const today = new Date().toISOString().split('T')[0];
    query = query.eq('scheduled_date', today);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching task statistics:', error);
    throw new Error('Failed to fetch task statistics.');
  }

  return data || [];
};