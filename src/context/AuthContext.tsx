'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { debounce } from '@/utils/performance';
import { InactivityWarning } from '@/components/InactivityWarning';
import { useRouter } from 'next/navigation';

// Define the structure of the profile data we expect
// Align this with your actual 'profile' table columns
interface UserProfile {
  id: string; // This is the primary key that matches the auth user ID
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null; // Consider using a string literal union type if roles are fixed
  is_active: boolean;
  segment: 'PL' | 'BL' | 'PL_DIGITAL' | 'BL_DIGITAL' | null;
  present_today: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Create a debounced version of fetchProfile to prevent excessive calls
    const debouncedFetchProfile = debounce(async (userId: string) => {
      if (isMounted) {
        await fetchProfile(userId);
      }
    }, 300); // 300ms debounce time

    const initializeAuth = async () => {
      try {
        setLoading(true);
        // Fetch initial session
        const { data: { session } } = await supabase.auth.getSession();

        // Only update state if component is still mounted
        if (!isMounted) return;

        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth state
    initializeAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);

        // Only update state if component is still mounted
        if (!isMounted) return;

        setSession(session);

        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (session?.user) {
            setLoading(true);
            // Use debounced version for sign-in events
            debouncedFetchProfile(session.user.id);
          } else {
            setLoading(false);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // For token refresh events, just update the session but keep existing profile
          // No need to reload profile data
          setLoading(false);
        }
      }
    );

    // Cleanup listener and prevent state updates on unmounted component
    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Only select the fields we need to reduce payload size
      const { data, error, status } = await supabase
        .from('profile')
        .select('id, email, first_name, last_name, role, is_active, segment, present_today')
        .eq('id', userId)
        .single();

      if (error && status !== 406) {
        // 406 status means no rows found, which can be valid if profile creation is delayed
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else if (data) {
        // Cache the profile data to reduce future fetches

        // Update present_today to TRUE when user logs in
        if (data) {
          // Update the present_today flag to TRUE
          const { error: updateError } = await supabase
            .from('profile')
            .update({ present_today: true })
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating present_today flag:', updateError);
          } else {
            // Make sure the profile data reflects the updated present_today value
            data.present_today = true;
          }
        }

        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Exception fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error signing out:", error);
        }
        // State updates (session, profile to null) will be handled by onAuthStateChange

        // Redirect to login page after signout
        router.push('/login');
    } catch(error) {
        console.error("Exception during sign out:", error);
    } finally {
        // Ensure loading is set to false even if onAuthStateChange doesn't fire immediately
        // or if there was an error before signout completed.
        // Let onAuthStateChange handle setting profile to null.
        setLoading(false);
    }
  };

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signOut,
  };

  // Set up inactivity timeout (10 minutes) that will log out the user
  const INACTIVITY_TIMEOUT_MINUTES = 10;

  return (
    <AuthContext.Provider value={value}>
      {children}
      <InactivityWarning timeoutMinutes={INACTIVITY_TIMEOUT_MINUTES} />
    </AuthContext.Provider>
  );
}

// Custom hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
