import { useLocation } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Download, Plus, User } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import { useState, useEffect } from "react";
import NewReservationModal from "./NewReservationModal";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/reservierungen": "Reservierungen",
  "/admin/kalender": "Kalender",
  "/admin/auslastung": "Auslastung",
  "/admin/billard": "🎱 Billard – 8 Tische",
  "/admin/kicker": "⚽ Tischkicker",
  "/admin/dart": "🎯 Dart-Automaten",
  "/admin/restaurant": "🍽️ Restaurant – Sitzplan",
  "/admin/vip": "⭐ VIP & Private Feiern",
  "/admin/email": "📧 E-Mail Center",
  "/admin/aktivitaet": "📋 Aktivitäts-Log",
  "/admin/warteliste": "📋 Warteliste",
  "/admin/einstellungen": "⚙️ Einstellungen",
};

const AdminTopbar = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Dashboard";
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="h-16 border-b border-border glass-card flex items-center justify-between px-6 sticky top-0 z-40">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center lg:hidden">
            <span className="font-display text-primary text-sm">R</span>
          </div>
          <div>
            <h1 className="font-display text-xl lg:text-2xl tracking-wider">{title}</h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Live clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border">
            <span className="text-primary font-mono text-sm font-semibold tracking-wider">
              {format(time, "HH:mm:ss")}
            </span>
          </div>

          {/* Date */}
          <span className="hidden lg:block text-xs text-muted-foreground">
            {format(time, "EEEE, d. MMMM yyyy", { locale: de })}
          </span>

          {/* Export */}
          <button className="hidden md:flex items-center gap-2 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all">
            <Download size={14} /> Export CSV
          </button>

          {/* New reservation */}
          <button onClick={() => setShowNewReservation(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Plus size={14} /> <span className="hidden sm:inline">Neue Reservierung</span>
          </button>

          <NotificationDropdown />

          {/* Admin avatar */}
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
            <User size={14} className="text-primary" />
          </div>
        </div>
      </header>
      <NewReservationModal open={showNewReservation} onClose={() => setShowNewReservation(false)} />
    </>
  );
};

export default AdminTopbar;
