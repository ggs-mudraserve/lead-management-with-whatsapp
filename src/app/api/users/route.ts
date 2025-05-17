import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/database.types';

export async function POST(request: NextRequest) {
  try {
    console.log('API route: User creation request received');

    // Get the request body
    const body = await request.json();
    const { email, password, first_name, last_name, role, segment } = body;
    console.log('API route: Request body parsed', { email, first_name, last_name, role, segment });

    // Validate required fields
    if (!email || !password || !first_name || !role) {
      console.log('API route: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the Supabase URL and service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      console.log('API route: No service role key found in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Service role key is required' },
        { status: 500 }
      );
    }

    console.log('API route: Service role key is available');

    // Create an admin client with the service role key
    const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey);
    console.log('API route: Admin client created');

    console.log('API route: Attempting to create user in Supabase Auth');

    try {
      // Create the user with the admin client
      console.log('API route: Using admin client to create user');
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm the email
      });

      if (authError || !authData.user) {
        console.error('API route: Error creating user:', authError);
        return NextResponse.json(
          { error: authError?.message || 'Failed to create user' },
          { status: 500 }
        );
      }
      console.log('API route: User created successfully in Auth', { userId: authData.user.id });

      const userId = authData.user.id;

      // Update the profile with additional information
      // Note: A profile record is automatically created by Supabase when a user is created
      console.log('API route: Updating profile with additional information');

      // Update the profile with the admin client
      console.log('API route: Using admin client to update profile');
      const { error: profileError } = await adminClient
        .from('profile')
        .update({
          first_name,
          last_name: last_name || null,
          role,
          segment, // Add the segment field
          // email is automatically set by trigger/auth
          // is_active defaults to true
        })
        .eq('id', userId);

      if (profileError) {
        console.error('API route: Error updating profile:', profileError);
        // Consider deleting the auth user if profile update fails
        // This would require another admin call
        return NextResponse.json(
          { error: profileError.message || 'Failed to update user profile' },
          { status: 500 }
        );
      }

      console.log('API route: User creation completed successfully');
      // Return success response with the created user ID
      return NextResponse.json({ userId, success: true });
    } catch (error) {
      console.error('API route: Error during user creation:', error);
      return NextResponse.json(
        { error: 'An error occurred during user creation' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API route: Unexpected error creating user:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
