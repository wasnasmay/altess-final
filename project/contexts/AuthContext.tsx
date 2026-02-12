'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getRoleRedirectPath } from '@/lib/auth-utils';

type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  avatar_url: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; role?: string }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, retries = 3): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        if (retries > 0) {
          console.log(`Retrying fetchProfile... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }
        throw error;
      }

      if (!data) {
        console.error('Profile not found for user:', userId);
        if (retries > 0) {
          console.log(`Retrying fetchProfile... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }
        setProfile(null);
        return null;
      }

      console.log('Profile loaded:', data);
      setProfile(data);
      return data;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      throw error;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user returned after sign in');
        return { error: new Error('No user found') };
      }

      console.log('User signed in:', user.id);

      const profileData = await fetchProfile(user.id);

      if (profileData) {
        return { error: null, role: profileData.role };
      } else {
        console.error('Profile not found after sign in');
        return { error: new Error('Profile not found') };
      }
    } catch (error: any) {
      console.error('Unexpected sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/login`,
        data: {
          email_confirmed: true
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
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
