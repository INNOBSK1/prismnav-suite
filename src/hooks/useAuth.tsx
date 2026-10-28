import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { accountCanAccess } from '@/lib/account-access';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  registrationLoading: boolean;
  approved: boolean;
  consented: boolean;
  canAccess: boolean;
  accountError: string;
  refreshRegistration: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  registrationLoading: true,
  approved: false,
  consented: false,
  canAccess: false,
  accountError: '',
  refreshRegistration: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationLoading, setRegistrationLoading] = useState(true);
  const [approved, setApproved] = useState(false);
  const [consented, setConsented] = useState(false);
  const [accountError, setAccountError] = useState('');

  const refreshRegistration = async () => {
    if (!user) return;
    setRegistrationLoading(true);
    setAccountError('');
    try {
      const [profile, consent] = await Promise.all([
        supabase.from('profiles').select('is_approved').eq('id', user.id).single(),
        supabase.from('consents').select('user_id').eq('user_id', user.id).maybeSingle(),
      ]);
      if (profile.error) throw profile.error;
      if (consent.error) throw consent.error;
      setApproved(profile.data.is_approved === true);
      setConsented(Boolean(consent.data));
    } catch {
      setApproved(false);
      setConsented(false);
      setAccountError('Unable to check your account. Please try again.');
    } finally {
      setRegistrationLoading(false);
    }
  };

  useEffect(() => {
    setApproved(false);
    setConsented(false);
    if (user) void refreshRegistration();
    else setRegistrationLoading(false);
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const validateUser = async (nextSession?: Session | null) => {
      const current = ++revision;
      const { data, error } = await supabase.auth.getUser();
      if (!active || current !== revision) return;
      setUser(error ? null : data.user);
      if (nextSession !== undefined) setSession(nextSession);
      setLoading(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setLoading(true);
      // Keep network validation outside the auth listener's internal lock.
      window.setTimeout(() => { if (active) void validateUser(nextSession); }, 0);
    });
    void validateUser();
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, registrationLoading, approved, consented, canAccess: accountCanAccess(approved, consented), accountError, refreshRegistration }}>
      {children}
    </AuthContext.Provider>
  );
}
