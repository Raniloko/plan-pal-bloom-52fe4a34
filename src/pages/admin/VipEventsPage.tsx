import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VipEventsPage = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);

  const fetchEvents = async () => {
    const { data } = await supabase.from("reservations").select("*").eq("zone", "vip").order("reservation_date", { ascending: false });
    setEvents(data || []);
  };

  useEffect(() => { fetchEvents(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("reservations").update({ status }).eq("id", id);
    toast({ title: "Status aktualisiert" });
    fetchEvents();
  };

  const statusPill = (status: string) => {
    const styles: Record<string, string> = { confirmed: "bg-success/20 text-success", pending: "bg-warning/20 text-warning", cancelled: "bg-muted text-muted-foreground" };
    const labels: Record<string, string> = { confirmed: "Bestätigt", pending: "Angefragt", cancelled: "Storniert" };
    return <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${styles[status] || ""}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl tracking-wider">⭐ VIP & Private Feiern</h2>
      {events.length === 0 ? (
        <p className="text-muted-foreground">Keine VIP-Anfragen vorhanden.</p>
      ) : (
        <div className="grid gap-4">
          {events.map((e) => (
            <div key={e.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{e.customer_name}</h3>
                  <p className="text-sm text-muted-foreground">{e.customer_email} · {e.customer_phone}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>{e.reservation_date}</span><span>{e.reservation_time} Uhr</span>
                    <span>{e.guest_count} Personen</span><span className="capitalize">{e.occasion}</span>
                  </div>
                  {e.message && <p className="text-sm text-muted-foreground mt-2 italic">"{e.message}"</p>}
                </div>
                {statusPill(e.status)}
              </div>
              {e.status === "pending" && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => updateStatus(e.id, "confirmed")} className="px-4 py-2 text-xs font-semibold bg-success/20 text-success rounded-lg hover:bg-success/30">Bestätigen</button>
                  <button onClick={() => updateStatus(e.id, "cancelled")} className="px-4 py-2 text-xs font-semibold bg-primary/20 text-primary rounded-lg hover:bg-primary/30">Ablehnen</button>
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
