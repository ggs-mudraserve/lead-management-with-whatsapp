import { createBrowserClient } from '@supabase/ssr';

// Ensure these environment variables are defined in your .env.local file
// or environment configuration.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables.');
}

// Create a singleton Supabase client for browser components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    // Enable realtime by default for all channels
    autoSubscribe: true
  },
  db: {
    schema: 'public'
  }
});

// Initialize realtime subscriptions
export const initializeRealtime = async () => {
  try {
    console.log('Initializing realtime subscriptions...');

    // Connect to the realtime server
    await supabase.realtime.connect();

    console.log('Realtime connection established');

    return true;
  } catch (error) {
    console.error('Error initializing realtime:', error);
    return false;
  }
};

// Type definition for the Supabase client (optional but good practice)
export type SupabaseClientType = typeof supabase;