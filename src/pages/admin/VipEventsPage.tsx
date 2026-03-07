import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PartyPopper } from "lucide-react";

const VipEventsPage = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [confettiId, setConfettiId] = useState<string | null>(null);

  const fetchEvents = async () => {
    const { data } = await supabase.from("reservations").select("*").eq("zone", "vip").order("reservation_date", { ascending: false });
    setEvents(data || []);
  };

  useEffect(() => { fetchEvents(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("reservations").update({ status }).eq("id", id);
    if (status === "confirmed") {
      setConfettiId(id);
      setTimeout(() => setConfettiId(null), 2000);
    }
    toast({ title: status === "confirmed" ? "✅ Bestätigt!" : "Storniert" });
    fetchEvents();
  };

  const statusPill = (status: string) => {
    const styles: Record<string, string> = { confirmed: "bg-success/20 text-success", pending: "bg-primary/20 text-primary", cancelled: "bg-muted text-muted-foreground" };
    const labels: Record<string, string> = { confirmed: "Bestätigt", pending: "Angefragt", cancelled: "Storniert" };
    return <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${styles[status] || ""}`}>{labels[status] || status}</span>;
  };

  const occasionLabels: Record<string, string> = { feier: "Geburtstag", vip: "VIP Event", sonstiges: "Sonstiges", sport: "Sport Event", essen: "Dinner" };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl tracking-wider">⭐ VIP & Private Feiern</h2>
      {events.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <PartyPopper size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Keine VIP-Anfragen vorhanden.</p>
        </div>
      ) : (
        <div className="grid gap-4 animate-stagger">
          {events.map((e) => (
            <div key={e.id} className={`glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden transition-all ${
              e.status === "confirmed" ? "border-primary/20" : ""
            } ${confettiId === e.id ? "animate-pulse-gold" : ""}`}>
              {e.status === "confirmed" && (
                <div className="absolute inset-0 opacity-[0.03]" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.5) 0%, transparent 70%)" }} />
              )}
              <div className="flex items-start justify-between relative">
                <div>
                  <h3 className="font-semibold text-lg">{e.customer_name}</h3>
                  <p className="text-sm text-muted-foreground">{e.customer_email} · {e.customer_phone}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm">
                    <span>{e.reservation_date}</span>
                    <span>{e.reservation_time} Uhr</span>
                    <span>{e.guest_count} Personen</span>
                    <span className="text-primary">{occasionLabels[e.occasion] || e.occasion}</span>
                  </div>
                  {e.message && <p className="text-sm text-muted-foreground mt-2 italic">"{e.message}"</p>}
                </div>
                {statusPill(e.status)}
              </div>
              {e.status === "pending" && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => updateStatus(e.id, "confirmed")} className="px-4 py-2 text-xs font-semibold bg-success/15 text-success rounded-lg hover:bg-success/25 transition-all">✨ Bestätigen</button>
                  <button onClick={() => updateStatus(e.id, "cancelled")} className="px-4 py-2 text-xs font-semibold bg-destructive/15 text-destructive rounded-lg hover:bg-destructive/25 transition-all">Ablehnen</button>
                  <button className="px-4 py-2 text-xs font-semibold bg-muted/30 text-muted-foreground rounded-lg hover:bg-muted/50 transition-all">Kontaktieren</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VipEventsPage;
