import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/supabase/database.types';
import { SupabaseClient } from '@supabase/supabase-js';
import { Dayjs } from 'dayjs';

// Interface for disbursed application data
export interface DisbursedApplicationData {
  id: string;
  segment: string | null;
  first_name: string | null;
  last_name: string | null;
  loan_app_number: string | null;
  approved_amount: number | null;
  bank_name: string | null;
  lead_stage: string | null;
  disburse_date: string | null;
  owner_id: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  team_id: string | null;
  team_name: string | null;
}

// Interface for filters
export interface DisbursedFilters {
  segments: string[];
  ownerIds: string[];
  teamIds: string[];
  bankNames: string[];
  disburseDateStart: Dayjs | null;
  disburseDateEnd: Dayjs | null;
}

// Interface for sorting
export interface DisbursedSortState {
  column: keyof DisbursedApplicationData | null;
  direction: 'asc' | 'desc';
}

/**
 * Fetches disbursed applications with bank name filtering
 * This is a new function that doesn't replace the existing implementation
 */
export async function fetchDisbursedApplicationsWithBankFilter(
  filters: DisbursedFilters,
  sort: DisbursedSortState
): Promise<DisbursedApplicationData[]> {
  // Create a supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Create a base query
  let query = supabase
    .from('bank_application')
    .select(`
      id, lead_id, loan_app_number, approved_amount, bank_name, lead_stage, disburse_date,
      leads!inner ( segment, first_name, last_name, lead_owner, profile!left ( id, first_name, last_name, team_members!left( team!left( id, name ) ) ) )
    `, { count: 'exact' })
    .eq('lead_stage', 'Disbursed');

  // Apply Segment Filter
  if (filters.segments.length > 0) {
    query = query.in('leads.segment', filters.segments);
  }

  // Apply Bank Filter - This is the new filter
  if (filters.bankNames.length > 0) {
    query = query.in('bank_name', filters.bankNames);
  }

  // Apply Date Filters
  if (filters.disburseDateStart) {
    query = query.gte('disburse_date', filters.disburseDateStart.format('YYYY-MM-DD'));
  }
  if (filters.disburseDateEnd) {
    query = query.lte('disburse_date', filters.disburseDateEnd.format('YYYY-MM-DD'));
  }

  // Apply Sorting
  if (sort.column && sort.column === 'disburse_date') {
    query = query.order(sort.column, { ascending: sort.direction === 'asc' });
  } else {
    query = query.order('disburse_date', { ascending: false });
  }

  // Execute the query
  const { data, error, count } = await query;
  if (error) {
    console.error('Error fetching disbursed applications:', error);
    throw new Error('Failed to fetch disbursed applications.');
  }

  console.log(`Fetched ${count} disbursed applications with filters:`, filters);

  // Process data with careful handling of nested objects
  let processedData = data.map((app: any) => {
    // Ensure leads data exists and handle it properly
    const leads = app.leads || {};

    return {
      id: app.id,
      segment: leads.segment || null,
      first_name: leads.first_name || null,
      last_name: leads.last_name || null,
      loan_app_number: app.loan_app_number || null,
      approved_amount: app.approved_amount || null,
      bank_name: app.bank_name || null,
      lead_stage: app.lead_stage || null,
      disburse_date: app.disburse_date || null,
      owner_id: leads.profile?.id || null,
      owner_first_name: leads.profile?.first_name || null,
      owner_last_name: leads.profile?.last_name || null,
      team_id: leads.profile?.team_members?.[0]?.team?.id || null,
      team_name: leads.profile?.team_members?.[0]?.team?.name || null,
    };
  });

  // Apply Client-Side Filters for owner and team
  if (filters.ownerIds.length > 0) {
    processedData = processedData.filter(app => app.owner_id && filters.ownerIds.includes(app.owner_id));
  }
  if (filters.teamIds.length > 0) {
    processedData = processedData.filter(app => app.team_id && filters.teamIds.includes(app.team_id));
  }

  return processedData;
}
