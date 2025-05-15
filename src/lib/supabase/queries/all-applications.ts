import { createBrowserClient } from '@supabase/ssr';

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

  // Create a new supabase client for this request
  const supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get the user's role from the auth context
  const { data: { user } } = await supabaseClient.auth.getUser();
  const { data: profile } = await supabaseClient
    .from('profile')
    .select('role')
    .eq('id', user?.id)
    .single();

  const userRole = profile?.role;

  // For non-admin users, exclude NULL lead owners at the database level
  const excludeNullOwners = userRole && ['agent', 'team_leader', 'backend'].includes(userRole);

  // Convert owner IDs to handle the special 'unassigned' value
  let ownerIds = filters.owners;
  let includeUnassigned = false;

  // Check if we need to handle the special 'unassigned' value
  if (filters.owners && filters.owners.length > 0) {
    // Check if 'unassigned' is in the array
    if (filters.owners.includes('unassigned')) {
      includeUnassigned = true;
      // Remove 'unassigned' from the array and keep only valid UUIDs
      ownerIds = filters.owners.filter(id => id !== 'unassigned');
    }
  }

  // If includeUnassigned is true, we want to show unassigned leads
  // For non-admin users, we still exclude NULL lead owners unless they specifically asked for unassigned
  const shouldExcludeNullOwners = excludeNullOwners && !includeUnassigned;

  const params = {
    p_segments: filters.segments || null,
    p_stages: filters.stages || null,
    p_owner_ids: ownerIds && ownerIds.length > 0 ? ownerIds : null,
    p_team_ids: filters.teams || null,
    p_login_start: filters.loginDateStart || null,
    p_login_end: filters.loginDateEnd || null,
    p_sort_column: filters.sortColumn || 'login_date',
    p_sort_direction: filters.sortDirection || 'desc',
    p_page: filters.page ?? 0,
    p_rows_per_page: filters.rowsPerPage ?? 10,
    p_exclude_null_owners: shouldExcludeNullOwners
  };

  // Note: Special case for unassigned leads with no other owner IDs is handled in the database function

  console.log('Calling RPC get_all_filtered_applications with params:', JSON.stringify(params, null, 2));

  try {
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

    console.log('RPC Response: data count:', responseData.length, 'total count:', responseCount, 'page:', params.p_page, 'rowsPerPage:', params.p_rows_per_page);

    return {
      data: responseData as BankApplicationRow[], // Cast data array
      count: responseCount
    };
  } catch (err) {
    console.error('Exception in getBankApplications:', err);
    throw new Error('Failed to fetch bank applications: ' + (err instanceof Error ? err.message : String(err)));
  }
}

// Function to fetch ALL filtered data for export (no pagination)
export async function getAllFilteredBankApplications(
  filters: Omit<BankApplicationFilters, 'page' | 'rowsPerPage'>
): Promise<BankApplicationRow[]> {

    // Create a new supabase client for this request
    const supabaseClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the user's role from the auth context
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data: profile } = await supabaseClient
        .from('profile')
        .select('role')
        .eq('id', user?.id)
        .single();

    const userRole = profile?.role;

    // For non-admin users, exclude NULL lead owners at the database level
    const excludeNullOwners = userRole && ['agent', 'team_leader', 'backend'].includes(userRole);

    // Convert owner IDs to handle the special 'unassigned' value
    let ownerIds = filters.owners;
    let includeUnassigned = false;

    // Check if we need to handle the special 'unassigned' value
    if (filters.owners && filters.owners.length > 0) {
      // Check if 'unassigned' is in the array
      if (filters.owners.includes('unassigned')) {
        includeUnassigned = true;
        // Remove 'unassigned' from the array and keep only valid UUIDs
        ownerIds = filters.owners.filter(id => id !== 'unassigned');
      }
    }

    // If includeUnassigned is true, we want to show unassigned leads
    // For non-admin users, we still exclude NULL lead owners unless they specifically asked for unassigned
    const shouldExcludeNullOwners = excludeNullOwners && !includeUnassigned;

    const params = {
        p_segments: filters.segments || null,
        p_stages: filters.stages || null,
        p_owner_ids: ownerIds && ownerIds.length > 0 ? ownerIds : null,
        p_team_ids: filters.teams || null,
        p_login_start: filters.loginDateStart || null,
        p_login_end: filters.loginDateEnd || null,
        p_sort_column: filters.sortColumn || 'login_date',
        p_sort_direction: filters.sortDirection || 'desc',
        p_page: 0,
        p_rows_per_page: 2000000000,
        p_exclude_null_owners: shouldExcludeNullOwners
    };

    console.log('Calling RPC for export with params:', JSON.stringify(params, null, 2));

    try {
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
    } catch (err) {
        console.error('Exception in getAllFilteredBankApplications:', err);
        throw new Error('Failed to fetch bank applications for export: ' + (err instanceof Error ? err.message : String(err)));
    }
}