import { SupabaseClient } from '@supabase/supabase-js';
// Adjust path based on actual location of database.types.ts relative to this file
import { Database } from '../database.types';

// Removed unused browserClient
// const browserClient = createBrowserClient<Database>(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// Keep only the types and functions relevant to single bank application operations

// Re-import Database type if needed by other functions in this file
// import { Database } from '../database.types';

// Example: Keep BankApplicationDetails if used by fetchBankApplicationById
// export type BankApplicationDetails = Database['public']['Tables']['bank_application']['Row'];
// export type Bank = Database['public']['Tables']['bank']['Row'];
// export type BankApplicationUpdatePayload = { ... };

// Keep functions like fetchBankApplicationById, fetchBanks, updateBankApplication, note functions, delete functions

// Restore necessary type exports
export type BankApplicationDetails = Database['public']['Tables']['bank_application']['Row'];
// Define Bank type based on what fetchBanks selects
export type BankName = Pick<Database['public']['Tables']['bank']['Row'], 'name'>;
export type BankApplicationUpdatePayload = {
  bank_name?: string | null;
  loan_app_number?: string | null;
  applied_amount?: number | null;
  approved_amount?: number | null;
  cashback?: number | null;
  lead_stage?: Database['public']['Enums']['lead_stage'] | null;
  login_date?: string | null;
  disburse_date?: string | null;
};

// Restore fetchBankApplicationById function
export async function fetchBankApplicationById(
  supabase: SupabaseClient<Database>, // Accept client instance
  id: string
): Promise<BankApplicationDetails | null> {
  const { data, error } = await supabase
    .from('bank_application')
    .select('*') // Select all columns needed for the edit form
    .eq('id', id)
    .single(); // Expect only one row

  if (error) {
    console.error('Error fetching bank application by ID:', error);
    if (error.code === 'PGRST116') { // PGRST116: Row not found or RLS denied
      // Return null instead of throwing error, page component can handle 'not found'
      return null;
      // throw new Error('Bank application not found or access denied.');
    }
    // For other errors, re-throw to be caught by useQuery
    throw new Error(error.message || 'Failed to fetch bank application data.');
  }
  return data;
}

// Restore fetchBanks function
export async function fetchBanks(
  supabase: SupabaseClient<Database>
): Promise<BankName[]> {
    const { data, error } = await supabase
        .from('bank')
        .select('name')
        .order('name');

    if (error) {
        console.error('Error fetching banks:', error);
        throw new Error(error.message || 'Failed to fetch banks.');
    }
    // Ensure the returned data matches the BankName type
    return (data || []) as BankName[];
}

// Restore updateBankApplication function (using RPC)
export async function updateBankApplication(
  supabase: SupabaseClient<Database>,
  id: string,
  payload: BankApplicationUpdatePayload
): Promise<{ id: string }> { // Return type from RPC function expected
    console.log("Calling update_bank_application RPC with:", { id, payload });

    const formatDate = (dateString: string | null | undefined): string | null => {
        if (!dateString) return null;
        try {
             // Allow ISO string directly if already formatted
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(dateString)) {
                return dateString;
            }
            return new Date(dateString).toISOString();
        } catch (error) {
            console.warn(`Invalid date string provided: ${dateString}`, error);
            return null;
        }
    };

    // Handle approved_amount specially to avoid check constraint violation
    // If approved_amount is null or undefined, we need to pass null to the database
    // The database has a check constraint that requires approved_amount to be either NULL or between 49,000 and 5,000,000
    const approvedAmount = payload.approved_amount === null || payload.approved_amount === undefined ? null : payload.approved_amount;

    const { data, error } = await supabase.rpc('update_bank_application', {
        p_id: id,
        p_bank_name: payload.bank_name ?? '', // Use empty string if null/undefined
        p_loan_app_number: payload.loan_app_number ?? '', // Use empty string if null/undefined
        p_applied_amount: payload.applied_amount ?? 0, // Use 0 if null/undefined
        p_approved_amount: approvedAmount, // Pass null if null/undefined
        p_cashback: payload.cashback ?? null, // Pass null if null/undefined
        p_lead_stage: payload.lead_stage ?? 'New',
        p_login_date: formatDate(payload.login_date) ?? new Date().toISOString(),
        p_disburse_date: formatDate(payload.disburse_date) ?? new Date().toISOString(),
    });

    console.log("RPC response:", { data, error });

    if (error) {
        console.error('Error calling update_bank_application RPC:', error);
        try {
            const errorMessage = error.message || 'Unknown RPC error';
            if (errorMessage.includes('errorCode') && errorMessage.includes('message')) {
                 const jsonErrorMatch = errorMessage.match(/DETAIL:\s*(\{.*\})/);
                 if (jsonErrorMatch && jsonErrorMatch[1]) {
                    const parsedError = JSON.parse(jsonErrorMatch[1]);
                    // Throw the user-friendly message from the DB function
                    throw new Error(parsedError.message || 'Failed to update bank application.');
                 }
            }
             throw new Error(errorMessage); // Throw original technical message if no structure found
        } catch (parseOrDbError) {
            // Catch errors from JSON.parse or the explicit throw above
            throw parseOrDbError instanceof Error ? parseOrDbError : new Error('Failed to update bank application.');
        }
    }

    // Check if the returned data has an ID (success case defined in RPC function)
    if (data && typeof data === 'object' && 'id' in data && typeof data.id === 'string') {
        return { id: data.id };
    } else {
         // This case indicates an issue where the RPC didn't return the expected structure on success
         console.error('Update bank application RPC returned unexpected data:', data);
         throw new Error('Update operation may have succeeded but returned unexpected confirmation.');
    }
}

// ================= Application Notes =================

export type AppNoteWithCreator = Database['public']['Tables']['app_notes']['Row'] & {
    profile: Pick<Database['public']['Tables']['profile']['Row'], 'first_name' | 'last_name'> | null;
};

export async function fetchAppNotes(
  supabase: SupabaseClient<Database>,
  bankApplicationId: string
): Promise<AppNoteWithCreator[]> {
    const { data, error } = await supabase
        .from('app_notes')
        .select(`
            *,
            profile ( first_name, last_name )
        `)
        .eq('bank_application_id', bankApplicationId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching application notes:', error);
        throw new Error(error.message || 'Failed to fetch application notes.');
    }
    return data || [];
}

export async function addAppNote(
  supabase: SupabaseClient<Database>,
  bankApplicationId: string,
  note: string
): Promise<Database['public']['Tables']['app_notes']['Row']> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error('Error fetching user for adding note:', userError);
        throw new Error('Could not identify user to add note.');
    }

    const userId = user.id;

    const { data, error } = await supabase
        .from('app_notes')
        .insert({
            bank_application_id: bankApplicationId,
            note: note,
            created_by_user_id: userId,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding application note:', error);
        if (error.code === '42501') { // RLS policy violation
            throw new Error('Permission denied to add note to this application.');
        }
        throw new Error(error.message || 'Failed to add application note.');
    }
    if (!data) {
        throw new Error('Failed to add application note, no data returned.');
    }
    return data;
}

export async function deleteAppNote(
  supabase: SupabaseClient<Database>,
  noteId: string
): Promise<void> {
    const { error } = await supabase
        .from('app_notes')
        .delete()
        .eq('id', noteId);

    if (error) {
        console.error('Error deleting application note:', error);
        if (error.code === '42501') { // RLS policy violation
             throw new Error('Permission denied to delete this note (Admin only).');
        }
        throw new Error(error.message || 'Failed to delete application note.');
    }
}

// ================= Delete Bank Application =================

export async function deleteBankApplication(
  supabase: SupabaseClient<Database>,
  bankApplicationId: string
): Promise<void> {
    const { error } = await supabase
        .from('bank_application')
        .delete()
        .eq('id', bankApplicationId);

    if (error) {
        console.error('Error deleting bank application:', error);
        if (error.code === '42501') { // RLS policy violation
             throw new Error('Permission denied to delete this bank application (Admin only).');
        }
        throw new Error(error.message || 'Failed to delete bank application.');
    }
}