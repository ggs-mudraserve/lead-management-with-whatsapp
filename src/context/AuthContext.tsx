'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { InactivityWarning } from '@/components/InactivityWarning';
import { useRouter } from 'next/navigation';

// Define the structure of the profile data we expect
interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  is_active: boolean;
  segment: 'PL' | 'BL' | 'PL_DIGITAL' | 'BL_DIGITAL' | null;
  present_today: boolean;
  device_id?: string | null;
  android_login?: boolean;
  bank_account_no?: string | null;
  bank_ifsc?: string | null;
  bank_name?: string | null;
  emp_code?: string;
  salary_current?: number | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  // Add UUID validation to prevent "undefined" errors
  if (!userId || userId === 'undefined' || userId === 'null') {
    console.error('Invalid userId provided to fetchProfile:', userId);
    return null;
  }

  try {
    const { data, error, status } = await supabase
      .from('profile')
      .select('id, email, first_name, last_name, role, is_active, segment, present_today')
      .eq('id', userId)
      .single();

    if (error && status !== 406) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (data) {
      const { error: updateError } = await supabase
        .from('profile')
        .update({ present_today: true })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating present_today flag:', updateError);
      } else {
        data.present_today = true;
      }
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Exception fetching profile:', error);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    let profileFetchTimeout: NodeJS.Timeout | null = null;

    // Debounced profile fetching to prevent multiple rapid calls
    const debouncedFetchProfile = (userId: string) => {
      if (profileFetchTimeout) {
        clearTimeout(profileFetchTimeout);
      }
      profileFetchTimeout = setTimeout(async () => {
        if (!ignore) {
          const profile = await fetchProfile(userId);
          if (!ignore) {
            setProfile(profile);
            setLoading(false);
          }
        }
      }, 300); // 300ms debounce
    };

    async function getInitialSession() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!ignore) {
          setSession(session);
          if (session?.user?.id) {
            debouncedFetchProfile(session.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    return () => {
      ignore = true;
      if (profileFetchTimeout) {
        clearTimeout(profileFetchTimeout);
      }
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    let authStateTimeout: NodeJS.Timeout | null = null;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (ignore) return;

        // Clear any pending auth state changes
        if (authStateTimeout) {
          clearTimeout(authStateTimeout);
        }

        // Debounce auth state changes to prevent rapid fire
        authStateTimeout = setTimeout(async () => {
          if (ignore) return;

          setSession(session);
          
          if (event === 'SIGNED_OUT') {
            setProfile(null);
            setLoading(false);
          } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (session?.user?.id) {
              setLoading(true);
              const profile = await fetchProfile(session.user.id);
              if (!ignore) {
                setProfile(profile);
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          } else if (event === 'TOKEN_REFRESHED') {
            // For token refresh, just update session but keep existing profile
            setLoading(false);
          }
        }, 100); // Shorter debounce for auth state changes
      }
    );

    return () => {
      ignore = true;
      if (authStateTimeout) {
        clearTimeout(authStateTimeout);
      }
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <InactivityWarning timeoutMinutes={10} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
