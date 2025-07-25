import { supabase } from '@/lib/supabase/client';

export interface MonthlyComparisonData {
  agent_id: string | null;
  agent_name: string;
  team_id: string | null;
  team_name: string;
  segment: string;
  current_month_count: number;
  current_month_amount: number;
  previous_month_count: number;
  previous_month_amount: number;
  count_change: number;
  amount_change: number;
  count_change_percent: number;
  amount_change_percent: number;
}

export interface SegmentComparisonData {
  segment: string;
  current_month_count: number;
  current_month_amount: number;
  previous_month_count: number;
  previous_month_amount: number;
  count_change: number;
  amount_change: number;
  count_change_percent: number;
  amount_change_percent: number;
}

export interface MonthlyComparisonFilters {
  compareDate?: string; // Format: 'YYYY-MM-DD' - defaults to current date
  segments?: string[];
  teamIds?: string[];
}

export async function getMonthlyComparisonData(
  filters: MonthlyComparisonFilters = {}
): Promise<MonthlyComparisonData[]> {
  const { compareDate, segments, teamIds } = filters;
  
  // Default to current date if not provided
  const targetDate = compareDate || new Date().toISOString().split('T')[0];
  
  // Extract day from target date to compare same day in previous month
  const targetDay = new Date(targetDate).getDate();
  
  // Get current month and previous month strings
  const currentDate = new Date(targetDate);
  const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM
  
  // Calculate previous month properly
  const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15); // Use 15th to avoid timezone issues
  const previousMonth = previousDate.toISOString().slice(0, 7); // YYYY-MM

  try {
    const { data, error } = await supabase.rpc('get_monthly_comparison_data', {
      p_current_month: currentMonth,
      p_previous_month: previousMonth,
      p_compare_day: targetDay,
      p_segments: segments && segments.length > 0 ? segments : null,
      p_team_ids: teamIds && teamIds.length > 0 ? teamIds : null
    });

    if (error) {
      console.error('Error fetching monthly comparison data:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch monthly comparison data:', err);
    throw err;
  }
}

export async function getSegmentComparisonData(
  filters: MonthlyComparisonFilters = {}
): Promise<SegmentComparisonData[]> {
  const { compareDate } = filters;
  
  // Default to current date if not provided
  const targetDate = compareDate || new Date().toISOString().split('T')[0];
  
  // Extract day from target date to compare same day in previous month
  const targetDay = new Date(targetDate).getDate();
  
  // Get current month and previous month strings
  const currentDate = new Date(targetDate);
  const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM
  
  // Calculate previous month properly
  const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15); // Use 15th to avoid timezone issues
  const previousMonth = previousDate.toISOString().slice(0, 7); // YYYY-MM

  try {
    const { data, error } = await supabase.rpc('get_segment_comparison_data', {
      p_current_month: currentMonth,
      p_previous_month: previousMonth,
      p_compare_day: targetDay
    });

    if (error) {
      console.error('Error fetching segment comparison data:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch segment comparison data:', err);
    throw err;
  }
}

export async function getMonthlyTrendsSummary(filters: MonthlyComparisonFilters = {}) {
  const { compareDate } = filters;
  
  // Default to current date if not provided
  const targetDate = compareDate || new Date().toISOString().split('T')[0];
  
  // Extract day from target date
  const targetDay = new Date(targetDate).getDate();
  
  // Get current month and previous month strings
  const currentDate = new Date(targetDate);
  const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM
  
  // Calculate previous month properly
  const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15); // Use 15th to avoid timezone issues
  const previousMonth = previousDate.toISOString().slice(0, 7); // YYYY-MM

  try {
    const { data, error } = await supabase.rpc('get_monthly_trends_summary', {
      p_current_month: currentMonth,
      p_previous_month: previousMonth,
      p_compare_day: targetDay
    });

    if (error) {
      console.error('Error fetching monthly trends summary:', error);
      throw new Error(error.message);
    }

    return data || {};
  } catch (err) {
    console.error('Failed to fetch monthly trends summary:', err);
    throw err;
  }
}