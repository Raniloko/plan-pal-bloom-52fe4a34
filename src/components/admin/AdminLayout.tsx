import { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import RealtimeToasts from "./RealtimeToasts";
import { SettingsProvider } from "@/contexts/SettingsContext";

const GoldCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ringX = 0, ringY = 0, mouseX = 0, mouseY = 0;
    const move = (e: MouseEvent) => {
      mouseX = e.clientX; mouseY = e.clientY;
      if (dotRef.current) { dotRef.current.style.left = `${mouseX}px`; dotRef.current.style.top = `${mouseY}px`; }
    };
    let raf: number;
    const animate = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      if (ringRef.current) { ringRef.current.style.left = `${ringX}px`; ringRef.current.style.top = `${ringY}px`; }
      raf = requestAnimationFrame(animate);
    };
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div ref={dotRef} className="fixed w-2 h-2 rounded-full bg-primary pointer-events-none z-[99999] -translate-x-1/2 -translate-y-1/2" />
      <div ref={ringRef} className="fixed w-7 h-7 rounded-full border border-primary/25 pointer-events-none z-[99998] -translate-x-1/2 -translate-y-1/2" />
    </>
  );
};

const AdminLayout = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin/login"); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      if (!isAdmin) { await supabase.auth.signOut(); navigate("/admin/login"); return; }
      setAuthenticated(true);
      setLoading(false);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/admin/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) return (
    <div className="admin-theme min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span className="text-muted-foreground text-sm">Dashboard wird geladen...</span>
      </div>
    </div>
  );
  if (!authenticated) return null;

  return (
    <SettingsProvider>
      <div className="admin-theme min-h-screen bg-background flex grain-overlay">
        <GoldCursor />
        <AdminSidebar />
        <div className="flex-1 ml-[220px] flex flex-col min-h-screen relative">
          <AdminTopbar />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
        <RealtimeToasts />
      </div>
    </SettingsProvider>
  );
};

export default AdminLayout;
