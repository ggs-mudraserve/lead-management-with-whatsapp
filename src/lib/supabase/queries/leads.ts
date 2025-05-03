import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

// Define Lead type based on database schema
export type LeadDetails = Database['public']['Tables']['leads']['Row'];

/**
 * Deletes a lead from the database
 * @param supabase Supabase client instance
 * @param leadId ID of the lead to delete
 * @returns Promise that resolves when the lead is deleted
 * @throws Error if the deletion fails or if the user doesn't have permission
 */
export async function deleteLead(
  supabase: SupabaseClient<Database>,
  leadId: string
): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);

  if (error) {
    console.error('Error deleting lead:', error);
    if (error.code === '42501') { // RLS policy violation
      throw new Error('Permission denied to delete this lead (Admin only).');
    }
    throw new Error(error.message || 'Failed to delete lead.');
  }
}
