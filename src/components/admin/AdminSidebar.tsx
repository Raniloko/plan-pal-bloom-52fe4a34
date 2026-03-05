import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, CalendarCheck, BarChart3,
  CircleDot, Gamepad2, Target,
  UtensilsCrossed, Star, Mail, Settings, LogOut, User
} from "lucide-react";
import { useEffect, useState } from "react";

const navSections = [
  {
    label: "ÜBERSICHT",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/reservierungen", label: "Reservierungen", icon: CalendarCheck, badge: true },
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
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-card border-r border-border flex flex-col z-50">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <img src="/images/rondo-logo.png" alt="Rondo" className="w-8 h-8 rounded" />
          <div>
            <div className="font-display text-lg leading-none tracking-wider">RONDO</div>
            <div className="text-[10px] text-primary font-semibold tracking-widest uppercase">Admin Panel</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-5 mb-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{section.label}</div>
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={(item as any).end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-2.5 text-sm transition-all relative ${isActive ? "text-primary bg-primary/10 border-r-2 border-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`
                }>
                <item.icon size={16} />
                <span className="flex-1">{item.label}</span>
                {(item as any).badge && pendingCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{pendingCount}</span>
                )}
                {(item as any).info && <span className="text-[10px] text-muted-foreground">{(item as any).info}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Administrator</div>
            <div className="text-[10px] text-muted-foreground">Online</div>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors"><LogOut size={14} /></button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
