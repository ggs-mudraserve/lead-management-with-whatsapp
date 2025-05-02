import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * POST handler for saving a message to Supabase
 * This endpoint bypasses RLS policies by using the service role key
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { session_id, message, timestamp } = body;
    
    // Validate required parameters
    if (!session_id || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters: session_id and message are required' },
        { status: 400 }
      );
    }
    
    console.log('Server: Saving message to Supabase:', {
      session_id,
      message_type: message.type,
      content: message.content
    });
    
    // Insert the message into Supabase using the admin client
    const { data, error } = await supabaseAdmin
      .from('n8n_chat')
      .insert({
        session_id,
        message,
        timestamp: timestamp || new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Server: Error saving message to Supabase:', error);
      return NextResponse.json(
        { error: `Failed to save message to Supabase: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('Server: Message successfully saved to Supabase:', data);
    
    // Return the result
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Server: Exception during message save:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
