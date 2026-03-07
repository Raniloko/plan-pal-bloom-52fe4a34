import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, ArrowUpCircle } from "lucide-react";

const areaLabels: Record<string, string> = {
  billard: "Billard", kicker: "Kicker", dart: "Dart", restaurant: "Restaurant", vip: "VIP"
};

const WaitlistPage = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ guest_name: "", guest_email: "", guest_phone: "", desired_time: "", area: "billard", desired_date: "" });

  const fetchEntries = async () => {
    const { data } = await (supabase as any).from("waitlist").select("*").order("created_at", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
    const ch = supabase.channel("waitlist-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "waitlist" }, () => fetchEntries())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await (supabase as any).from("waitlist").insert({ ...form });
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Zur Warteliste hinzugefügt" });
    setShowAdd(false);
    setForm({ guest_name: "", guest_email: "", guest_phone: "", desired_time: "", area: "billard", desired_date: "" });
    fetchEntries();
  };

  const handlePromote = async (entry: any) => {
    // Create reservation from waitlist entry
    const { error } = await supabase.from("reservations").insert({
      customer_name: entry.guest_name, customer_email: entry.guest_email,
      customer_phone: entry.guest_phone, reservation_date: entry.desired_date,
      reservation_time: entry.desired_time, zone: entry.area,
      guest_count: 2, occasion: "sonstiges", status: "confirmed", honeypot: "",
    } as any);
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); return; }
    await (supabase as any).from("waitlist").update({ status: "promoted" }).eq("id", entry.id);
    toast({ title: "✅ Reservierung erstellt" });
    fetchEntries();
  };

  const handleRemove = async (id: string) => {
    await (supabase as any).from("waitlist").delete().eq("id", id);
    toast({ title: "Entfernt" });
    fetchEntries();
  };

  const ic = "w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl tracking-wider">📋 Warteliste</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20">
          <UserPlus size={14} /> Hinzufügen
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="glass-card rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input required placeholder="Name" value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} className={ic} />
            <input required placeholder="E-Mail" type="email" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} className={ic} />
            <input required placeholder="Telefon" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} className={ic} />
            <input required type="date" value={form.desired_date} onChange={(e) => setForm({ ...form, desired_date: e.target.value })} className={ic} />
            <input required type="time" value={form.desired_time} onChange={(e) => setForm({ ...form, desired_time: e.target.value })} className={ic} />
            <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={ic}>
              {Object.entries(areaLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Speichern</button>
        </form>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-muted-foreground text-xs">
            <th className="text-left py-3 px-4">Gast</th>
            <th className="text-left py-3 px-4">Bereich</th>
            <th className="text-left py-3 px-4">Wunschdatum</th>
            <th className="text-left py-3 px-4">Wunschzeit</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4">Aktionen</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Laden...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground italic">Keine Einträge auf der Warteliste.</td></tr>
            ) : entries.map((e) => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-medium">{e.guest_name}</div>
                  <div className="text-[10px] text-muted-foreground">{e.guest_email}</div>
                </td>
                <td className="py-3 px-4"><span className="text-xs bg-muted/50 px-2 py-1 rounded">{areaLabels[e.area] || e.area}</span></td>
                <td className="py-3 px-4 text-muted-foreground">{e.desired_date}</td>
                <td className="py-3 px-4">{e.desired_time}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                    e.status === "promoted" ? "bg-success/20 text-success" :
                    e.status === "notified" ? "bg-warning/20 text-warning" :
                    "bg-primary/20 text-primary"
                  }`}>{e.status === "promoted" ? "Befördert" : e.status === "notified" ? "Benachrichtigt" : "Wartend"}</span>
                </td>
                <td className="py-3 px-4">
                  {e.status === "waiting" && (
                    <div className="flex gap-1">
                      <button onClick={() => handlePromote(e)} className="p-1.5 rounded hover:bg-success/10 text-success" title="Zur Reservierung befördern"><ArrowUpCircle size={14} /></button>
                      <button onClick={() => handleRemove(e.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Entfernen"><Trash2 size={14} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WaitlistPage;
