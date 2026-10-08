import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_BEFORE = 5 * 60 * 1000; // warn 5 min before

// Backup of the refresh token in a long-lived cookie, used only when the user
// ticked "Angemeldet bleiben". Mobile WebViews may clear localStorage but keep cookies.
const BACKUP_COOKIE = "rondo_admin_rt";
const readBackupToken = (): string | null => {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${BACKUP_COOKIE}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
  } catch { return null; }
};
const writeBackupToken = (token: string | undefined) => {
  if (!token) return;
  try {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${BACKUP_COOKIE}=${encodeURIComponent(token)}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${secure}`;
  } catch { /* ignore */ }
};
const clearBackupToken = () => {
  try { document.cookie = `${BACKUP_COOKIE}=; Max-Age=0; Path=/`; } catch { /* ignore */ }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionWarning: boolean;
  dismissWarning: () => void;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: string | null }>;
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
  const [keepLoggedIn, setKeepLoggedIn] = useState<boolean>(() => {
    try { return localStorage.getItem("admin_keep_logged_in") === "1"; } catch { return false; }
  });
  // True until the very first getSession()/refreshSession() pass is done.
  // During this window we ignore transient SIGNED_OUT events from
  // onAuthStateChange that fire *before* the persisted session has been
  // restored — otherwise a reload briefly looks like a logout.
  const initializing = useRef(true);

  // Track user activity
  useEffect(() => {
    if (!user) return;
    // When the user opted into "Angemeldet bleiben", skip the inactivity auto-logout entirely.
    if (keepLoggedIn) {
      setSessionWarning(false);
      clearTimeout(warningTimer.current);
      clearTimeout(logoutTimer.current);
      return;
    }

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
  }, [user, keepLoggedIn]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      let { data: { session: initial } } = await supabase.auth.getSession();

      const wantsPersistent = (() => {
        try { return localStorage.getItem("admin_keep_logged_in") === "1"; } catch { return false; }
      })() || Boolean(readBackupToken());

      // Mobile WebViews (median.co, iOS home-screen apps) sometimes wipe
      // localStorage. Restore from the backup cookie if that happened.
      if (!initial && wantsPersistent) {
        const backup = readBackupToken();
        if (backup) {
          try {
            const { data, error } = await supabase.auth.refreshSession({ refresh_token: backup });
            if (!error && data.session) {
              initial = data.session;
              try { localStorage.setItem("admin_keep_logged_in", "1"); } catch { /* ignore */ }
              setKeepLoggedIn(true);
            }
          } catch { /* offline — keep trying on next open */ }
        }
      }

      if (initial) {
        setSession(initial);
        setUser(initial.user ?? null);
      }

      if (wantsPersistent && initial?.refresh_token) {
        try {
          const { data, error } = await supabase.auth.refreshSession({ refresh_token: initial.refresh_token });
          if (!error && data.session) {
            setSession(data.session);
            setUser(data.session.user);
            writeBackupToken(data.session.refresh_token);
          }
        } catch { /* keep hydrated session */ }
      }

      initializing.current = false;
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
        } else if (session) {
          setSession(session);
          setUser(session.user);
          if (readBackupToken() || localStorage.getItem("admin_keep_logged_in") === "1") {
            writeBackupToken(session.refresh_token);
          }
        }
        setLoading(false);
      });

      // Refresh silently whenever the app comes back to the foreground.
      const onVisible = () => {
        if (document.visibilityState === "visible") {
          supabase.auth.startAutoRefresh?.();
          supabase.auth.getSession().catch(() => {});
        } else {
          supabase.auth.stopAutoRefresh?.();
        }
      };
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", onVisible);

      unsub = () => {
        subscription.unsubscribe();
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", onVisible);
      };
    })();
    return () => unsub?.();
  }, []);

  const signIn = useCallback(async (email: string, password: string, rememberMe = false) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error: "E-Mail oder Passwort falsch" };
    if (authData.session) {
      setSession(authData.session);
      setUser(authData.user);
    }
    lastActivity.current = Date.now();
    try {
      if (rememberMe) localStorage.setItem("admin_keep_logged_in", "1");
      else localStorage.removeItem("admin_keep_logged_in");
    } catch { /* ignore */ }
    setKeepLoggedIn(rememberMe);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSessionWarning(false);
    try { localStorage.removeItem("admin_keep_logged_in"); } catch { /* ignore */ }
    setKeepLoggedIn(false);
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

// Safe variant: returns null instead of throwing when no provider is mounted
// (e.g. during hot reloads). Use in optional UI like the session warning modal.
export const useAuthOptional = () => useContext(AuthContext) ?? null;

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
