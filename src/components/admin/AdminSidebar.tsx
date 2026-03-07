import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, CalendarCheck, Calendar, BarChart3,
  CircleDot, Gamepad2, Target,
  UtensilsCrossed, Star, Mail, ScrollText, ClipboardList, Settings, LogOut, User
} from "lucide-react";
import { useEffect, useState } from "react";

const navSections = [
  {
    label: "ÜBERSICHT",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/reservierungen", label: "Reservierungen", icon: CalendarCheck, badge: true },
      { to: "/admin/kalender", label: "Kalender", icon: Calendar },
      { to: "/admin/auslastung", label: "Auslastung", icon: BarChart3 },
    ],
  },
  {
    label: "BEREICHE",
    items: [
      { to: "/admin/billard", label: "Billard", icon: CircleDot, info: "8 Tische" },
      { to: "/admin/kicker", label: "Tischkicker", icon: Gamepad2, info: "2" },
      { to: "/admin/dart", label: "Dart", icon: Target, info: "2" },
      { to: "/admin/restaurant", label: "Restaurant", icon: UtensilsCrossed },
      { to: "/admin/vip", label: "VIP & Events", icon: Star },
    ],
  },
  {
    label: "VERWALTUNG",
    items: [
      { to: "/admin/email", label: "E-Mail Center", icon: Mail },
      { to: "/admin/aktivitaet", label: "Aktivitäts-Log", icon: ScrollText },
      { to: "/admin/warteliste", label: "Warteliste", icon: ClipboardList },
      { to: "/admin/einstellungen", label: "Einstellungen", icon: Settings },
    ],
  },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      const { count } = await supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "pending");
      setPendingCount(count || 0);
    };
    fetchPending();
    const channel = supabase.channel("sidebar-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => fetchPending())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] glass-card flex flex-col z-50 border-r border-border">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
            <span className="font-display text-primary text-lg leading-none">R</span>
          </div>
          <div>
            <div className="font-display text-lg leading-none tracking-wider">RONDO</div>
            <div className="text-[10px] text-primary font-semibold tracking-widest uppercase">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-5 mb-2 text-[10px] font-bold tracking-[0.2em] text-primary/60 uppercase">{section.label}</div>
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={(item as any).end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-2.5 text-sm transition-all relative group ${
                    isActive
                      ? "text-primary bg-primary/10 border-l-2 border-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:pl-6 border-l-2 border-transparent"
                  }`
                }>
                <item.icon size={16} />
                <span className="flex-1">{item.label}</span>
                {(item as any).badge && pendingCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">{pendingCount}</span>
                )}
                {(item as any).info && <span className="text-[10px] text-muted-foreground">{(item as any).info}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Admin profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
            <User size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Administrator</div>
            <div className="text-[10px] text-primary/60">Admin</div>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors" title="Abmelden">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
