import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_BEFORE = 5 * 60 * 1000; // warn 5 min before

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionWarning: boolean;
  dismissWarning: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const lastActivity = useRef(Date.now());
  const warningTimer = useRef<ReturnType<typeof setTimeout>>();
  const logoutTimer = useRef<ReturnType<typeof setTimeout>>();

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const resetTimers = () => {
      lastActivity.current = Date.now();
      setSessionWarning(false);

      clearTimeout(warningTimer.current);
      clearTimeout(logoutTimer.current);

      warningTimer.current = setTimeout(() => {
        setSessionWarning(true);
      }, INACTIVITY_LIMIT - WARNING_BEFORE);

      logoutTimer.current = setTimeout(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
      }, INACTIVITY_LIMIT);
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
    // Throttle activity tracking
    let throttled = false;
    const handler = () => {
      if (throttled) return;
      throttled = true;
      setTimeout(() => { throttled = false; }, 30000); // check every 30s
      resetTimers();
    };

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimers();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearTimeout(warningTimer.current);
      clearTimeout(logoutTimer.current);
    };
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Check brute-force lockout first (no logging yet)
    try {
      const checkRes = await supabase.functions.invoke("admin-actions", {
        body: { action: "check_login_attempts", email },
      });
      if (checkRes.data?.locked) {
        const mins = checkRes.data.minutes_remaining || 30;
        return { error: `Konto gesperrt. Bitte warten Sie ${mins} Minuten.` };
      }
    } catch { /* proceed if check fails */ }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    // Log this attempt (server-side, via the same public action so it cannot
    // be invoked independently to spam fake failures).
    try {
      await supabase.functions.invoke("admin-actions", {
        body: {
          action: "check_login_attempts",
          email,
          log_attempt: true,
          success: !error,
        },
      });
    } catch { /* non-blocking */ }

    if (error) return { error: "E-Mail oder Passwort falsch" };
    lastActivity.current = Date.now();
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSessionWarning(false);
  }, []);

  const dismissWarning = useCallback(() => {
    setSessionWarning(false);
    lastActivity.current = Date.now();
    // Reset timers
    clearTimeout(warningTimer.current);
    clearTimeout(logoutTimer.current);
    warningTimer.current = setTimeout(() => setSessionWarning(true), INACTIVITY_LIMIT - WARNING_BEFORE);
    logoutTimer.current = setTimeout(async () => {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    }, INACTIVITY_LIMIT);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, sessionWarning, dismissWarning, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
