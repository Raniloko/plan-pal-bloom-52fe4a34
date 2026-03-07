import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const zoneLabels: Record<string, string> = {
  billard: "Billard", kicker: "Kicker", dart: "Dart", restaurant: "Restaurant", vip: "VIP",
  hauptbereich: "Hauptbereich", fenster: "Fenster", podest: "Podest"
};

const RealtimeToasts = () => {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase.channel("reservation-toasts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reservations" }, (payload) => {
        const r = payload.new as any;
        toast({
          title: "🟢 Neue Reservierung",
          description: `${r.customer_name} · ${zoneLabels[r.zone] || r.zone} · ${r.reservation_date} ${r.reservation_time}`,
          duration: 5000,
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reservations" }, (payload) => {
        const r = payload.new as any;
        const old = payload.old as any;
        if (r.status === "cancelled" && old.status !== "cancelled") {
          toast({
            title: "🔴 Stornierung",
            description: `${r.customer_name} · ${zoneLabels[r.zone] || r.zone} · ${r.reservation_date}`,
            variant: "destructive",
            duration: 5000,
          });
        }
        if (r.status === "pending" && old.status !== "pending") {
          toast({
            title: "🟡 Ausstehende Anfrage",
            description: `${r.customer_name} · ${zoneLabels[r.zone] || r.zone}`,
            duration: 5000,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [toast]);

  return null;
};

export default RealtimeToasts;
