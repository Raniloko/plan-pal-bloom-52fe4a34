import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AdminLoading = () => (
  <div style={{
    position: "fixed", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", background: "#0a0a0a",
    fontFamily: "'DM Sans', sans-serif",
  }}>
    <img src="/images/rondo-logo.png" alt="Rondo" style={{
      height: 48, filter: "brightness(0) invert(1)", opacity: 0.8,
      animation: "pulse 2s ease-in-out infinite",
    }} />
    <span style={{ fontSize: 13, color: "#555", marginTop: 16 }}>Wird geladen...</span>
    <style>{`@keyframes pulse { 0%,100% { opacity: 0.8 } 50% { opacity: 0.4 } }`}</style>
  </div>
);

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [roleChecked, setRoleChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setRoleChecked(true); setIsAdmin(false); return; }
    setRoleChecked(false);
    setCheckFailed(false);
    (async () => {
      // Try up to 2x — the first call after a reload can race with the token
      // refresh and come back 401 even though the user is a valid admin.
      let success = false;
      let transient = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await supabase.functions.invoke("admin-actions", {
            body: { action: "check_admin" },
          });
          if (cancelled) return;
          if (!res.error && res.data?.success === true) {
            success = true;
            transient = false;
            break;
          }
          const msg = String(res.error?.message || "");
          transient = /401|non-2xx|network|fetch/i.test(msg);
          if (!transient) break;
          // Give the AuthContext a moment to refresh the token.
          await new Promise(r => setTimeout(r, 600));
        } catch (err) {
          if (cancelled) return;
          transient = true;
          await new Promise(r => setTimeout(r, 600));
        }
      }
      if (cancelled) return;
      setIsAdmin(success);
      // Only treat as a hard failure (-> redirect) when it's NOT a transient
      // network/401 issue. Otherwise keep showing the loader so a brief
      // backend hiccup on reload doesn't bounce the user to /login.
      setCheckFailed(!success && !transient);
      setRoleChecked(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || (user && !roleChecked)) return <AdminLoading />;
  if (!user) return <Navigate to="/backstage/login" replace />;
  if (!isAdmin && checkFailed) return <Navigate to="/backstage/login" replace />;
  if (!isAdmin) return <AdminLoading />;

  return <>{children}</>;
};
