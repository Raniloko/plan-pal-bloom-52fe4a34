import { useLocation } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Download, Plus } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import { useState } from "react";
import NewReservationModal from "./NewReservationModal";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/reservierungen": "Reservierungen",
  "/admin/auslastung": "Auslastung",
  "/admin/billard": "🎱 Billard – 8 Tische",
  "/admin/kicker": "⚽ Tischkicker",
  "/admin/dart": "🎯 Dart-Automaten",
  "/admin/restaurant": "🍽️ Restaurant – Tischübersicht",
  "/admin/vip": "⭐ VIP & Private Feiern",
  "/admin/email": "📧 E-Mail Center",
  "/admin/einstellungen": "⚙️ Einstellungen",
};

const AdminTopbar = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Dashboard";
  const [showNewReservation, setShowNewReservation] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
        <div>
          <h1 className="font-display text-2xl tracking-wider">{title}</h1>
          <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, dd. MMMM yyyy", { locale: de })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setShowNewReservation(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all">
            <Plus size={14} /> Neue Reservierung
          </button>
          <NotificationDropdown />
        </div>
      </header>
      <NewReservationModal open={showNewReservation} onClose={() => setShowNewReservation(false)} />
    </>
  );
};

export default AdminTopbar;
