import { createBrowserClient } from '@supabase/ssr';
// import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'; // Removed unused import

// This client instance is for browser-side usage in client components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Interface for the flattened data structure expected by the table
// Matches the v_all_applications VIEW columns
export interface BankApplicationRow {
  id: string; // from ba
  bank_name: string | null;
  approved_amount: number | null;
  lead_stage: string | null;
  login_date: string | null; // Comes as string from JSON
  lead_id: string; // from l (useful for RLS checks in function)
  lead_segment: string | null; // from l
  lead_first_name: string | null; // from l
  lead_last_name: string | null; // from l
  lead_owner_id: string | null; // from p
  lead_owner_name: string | null; // Combined name from view
  owner_is_active: boolean | null; // from p
  team_id: string | null; // from t_info
  team_name: string | null; // from t_info
}

// Define SortDirection locally
type SortDirection = 'asc' | 'desc';
// Adjust SortState to use potentially different keys if sorting was based on removed aliases
// Removed unused SortState interface
// interface SortState {
//     // Use the actual column names from the view for sorting
//     column: keyof BankApplicationRow | null;
//     direction: SortDirection;
// }

// Interface for the filter state managed in the page component
export interface BankApplicationFilters {
  segments?: string[];
  stages?: string[];
  owners?: string[]; // These are UUIDs (lead_owner_id)
  teams?: string[]; // These are UUIDs (team_id)
  loginDateStart?: string | null; // YYYY-MM-DD format
  loginDateEnd?: string | null;   // YYYY-MM-DD format
  page?: number;
  rowsPerPage?: number;
  // Use the actual column names from the view for sorting
  sortColumn?: keyof BankApplicationRow | null;
  sortDirection?: SortDirection;
}

// Define a type for the return value including data and count
export interface PaginatedBankApplicationsResponse {
    data: BankApplicationRow[];
    count: number;
    error?: string | null; // Optional error field from RPC
}

/**
 * Fetches multiple bank applications by calling the RPC function.
 */
export async function getBankApplications(
  filters: BankApplicationFilters
): Promise<PaginatedBankApplicationsResponse> {

  const params = {
    p_segments: filters.segments,
    p_stages: filters.stages,
    p_owner_ids: filters.owners,
    p_team_ids: filters.teams,
    p_login_start: filters.loginDateStart,
    p_login_end: filters.loginDateEnd,
    p_sort_column: filters.sortColumn || 'login_date',
    p_sort_direction: filters.sortDirection || 'desc',
    p_page: filters.page ?? 0,
    p_rows_per_page: filters.rowsPerPage ?? 10,
  };

  console.log('Calling RPC get_all_filtered_applications with params:', params);

  const { data: rpcResponse, error } = await supabase
    .rpc('get_all_filtered_applications', params);

  if (error) {
    console.error('RPC Error fetching bank applications:', error);
    throw new Error('Could not fetch bank applications: ' + error.message);
  }

  if (rpcResponse?.error) {
      console.error('RPC Function Error:', rpcResponse.error);
      throw new Error('Error within RPC function: ' + rpcResponse.error);
  }

  // The RPC returns { data: BankApplicationRow[], count: number }
  // Ensure we handle potential null/undefined data array
  const responseData = rpcResponse?.data ?? [];
  const responseCount = rpcResponse?.count ?? 0;

  console.log('RPC Response: data count:', responseData.length, 'total count:', responseCount);

  return {
      data: responseData as BankApplicationRow[], // Cast data array
      count: responseCount
  };
}

// Function to fetch ALL filtered data for export (no pagination)
export async function getAllFilteredBankApplications(
  filters: Omit<BankApplicationFilters, 'page' | 'rowsPerPage'>
): Promise<BankApplicationRow[]> {

    const params = {
        p_segments: filters.segments,
        p_stages: filters.stages,
        p_owner_ids: filters.owners,
        p_team_ids: filters.teams,
        p_login_start: filters.loginDateStart,
        p_login_end: filters.loginDateEnd,
        p_sort_column: filters.sortColumn || 'login_date',
        p_sort_direction: filters.sortDirection || 'desc',
        p_page: 0,
        p_rows_per_page: 2000000000
    };

    console.log('Calling RPC for export with params:', params);

    const { data: rpcResponse, error } = await supabase
        .rpc('get_all_filtered_applications', params);

    if (error) {
        console.error('RPC Error fetching all bank applications for export:', error);
        throw new Error('Could not fetch all bank applications: ' + error.message);
    }

    if (rpcResponse?.error) {
        console.error('RPC Function Error during export fetch:', rpcResponse.error);
        throw new Error('Error within RPC function during export fetch: ' + rpcResponse.error);
    }

    const responseData = rpcResponse?.data ?? [];
    console.log('RPC Response for export: data count:', responseData.length);

    return responseData as BankApplicationRow[];
} 