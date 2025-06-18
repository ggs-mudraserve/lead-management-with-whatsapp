import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/database.types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean value' },
        { status: 400 }
      );
    }

    // Get the Supabase URL and service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Service role key is required' },
        { status: 500 }
      );
    }

    // Create an admin client with the service role key
    const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey);

    let updatedLeadsCount = 0;

    // If setting user to inactive, we need to update leads
    if (!is_active) {
      // First update the user status
      const { error: profileError } = await adminClient
        .from('profile')
        .update({ is_active })
        .eq('id', userId);

      if (profileError) {
        console.error("Error updating user status:", profileError);
        return NextResponse.json(
          { error: profileError.message || 'Failed to update user status' },
          { status: 500 }
        );
      }

      // Then update all leads where this user is the lead_owner
      const { data: updatedLeads, error: leadsError } = await adminClient
        .from('leads')
        .update({ lead_owner: null })
        .eq('lead_owner', userId)
        .select('id');

      if (leadsError) {
        console.error("Error updating leads ownership:", leadsError);
        return NextResponse.json(
          { error: leadsError.message || 'Failed to update leads ownership' },
          { status: 500 }
        );
      }

      updatedLeadsCount = updatedLeads?.length || 0;
    } else {
      // Just update the user status if activating the user
      const { error: profileError } = await adminClient
        .from('profile')
        .update({ is_active })
        .eq('id', userId);

      if (profileError) {
        console.error("Error updating user status:", profileError);
        return NextResponse.json(
          { error: profileError.message || 'Failed to update user status' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      is_active,
      updatedLeadsCount
    });
  } catch (error) {
    console.error('API route: Unexpected error updating user status:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}