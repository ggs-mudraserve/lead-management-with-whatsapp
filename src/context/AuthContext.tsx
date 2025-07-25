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
    async function getInitialSession() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!ignore) {
        setSession(session);
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        }
        setLoading(false);
      }
    }

    getInitialSession();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (event === 'SIGNED_OUT') {
          setProfile(null);
        } else if (event === 'SIGNED_IN') {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            setProfile(profile);
          }
        }
      }
    );

    return () => {
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
