import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const zones = [
  { key: "podest", label: "Podest", subtitle: "bis 33 Gäste · VIP Zone", capacity: 33 },
  { key: "fenster", label: "Fensterbereich", subtitle: "Fensterplätze", capacity: 20 },
  { key: "hauptbereich", label: "Hauptraum", subtitle: "Hauptbereich", capacity: 40 },
];

const RestaurantPage = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    supabase.from("reservations").select("*").eq("reservation_date", today)
      .in("zone", ["podest", "fenster", "hauptbereich"]).neq("status", "cancelled")
      .then(({ data }) => setReservations(data || []));
  }, [today]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl tracking-wider">🍽️ Restaurant – Tischübersicht</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {zones.map((zone) => {
          const zoneRes = reservations.filter(r => r.zone === zone.key);
          const guestCount = zoneRes.reduce((sum, r) => sum + r.guest_count, 0);
          const pct = Math.min(100, Math.round((guestCount / zone.capacity) * 100));
          const color = pct >= 90 ? "bg-primary" : pct >= 50 ? "bg-warning" : "bg-success";
          return (
            <div key={zone.key} className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-display text-xl tracking-wider">{zone.label}</h3>
              <p className="text-xs text-muted-foreground mb-4">{zone.subtitle}</p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{guestCount} / {zone.capacity} Gäste</span>
                <span>{zoneRes.length} Reservierungen</span>
              </div>
              {zoneRes.length > 0 && (
                <div className="mt-3 space-y-1">
                  {zoneRes.map(r => (
                    <div key={r.id} className="flex justify-between text-xs bg-muted/30 rounded px-2 py-1.5">
                      <span>{r.customer_name}</span>
                      <span className="text-muted-foreground">{r.reservation_time} · {r.guest_count}P</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RestaurantPage;
