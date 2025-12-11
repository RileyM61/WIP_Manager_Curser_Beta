import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface ProfileRow {
  user_id: string;
  company_id: string | null;
  role: string;
  onboarding_state?: any; // JSONB
  companies?: {
    id: string;
    name: string;
  };
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  companyId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Initialize session + auth listener
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      const { data, error } = await supabase?.auth.getSession();
      if (error) {
        console.error('[AuthContext] Error fetching session', error);
      }
      if (isMounted) {
        setSession(data?.session ?? null);
        setLoadingSession(false);
      }
    };

    initSession();

    const { data: listener } = supabase!.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    setLoadingProfile(true);
    const { data, error } = await supabase!
      .from('profiles')
      .select('user_id, company_id, role, onboarding_state, companies:company_id ( id, name )')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('[AuthContext] Error loading profile', error);
    }
    setProfile(data ?? null);
    setLoadingProfile(false);
  }, [session?.user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    companyId: profile?.company_id ?? null,
    loading: loadingSession || loadingProfile,
    signOut,
    refreshProfile: fetchProfile,
  }), [session, profile, loadingSession, loadingProfile, signOut, fetchProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

