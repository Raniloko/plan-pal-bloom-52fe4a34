import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, Download, Mail, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const zoneLabels: Record<string, string> = { billard: "Billard", kicker: "Kicker", dart: "Dart", restaurant: "Restaurant", vip: "VIP", hauptbereich: "Hauptbereich", fenster: "Fenster", podest: "Podest" };
const zoneColors: Record<string, string> = { billard: "bg-green-900/30 text-green-400", kicker: "bg-blue-900/30 text-blue-400", dart: "bg-purple-900/30 text-purple-400", restaurant: "bg-amber-900/30 text-amber-400", vip: "bg-primary/20 text-primary" };

const ReservationsPage = () => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: "", zone: "", status: "", search: "" });
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchReservations = async () => {
    setLoading(true);
    let query = supabase.from("reservations").select("*").order("reservation_date", { ascending: false }).order("reservation_time", { ascending: false });
    if (filters.date) query = query.eq("reservation_date", filters.date);
    if (filters.zone) query = query.eq("zone", filters.zone);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.search) query = query.or(`customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`);
    const { data } = await query.limit(200);
    setReservations(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReservations(); }, [filters]);

  const handleCancel = async (id: string) => {
    if (!cancelReason.trim()) { toast({ title: "Fehler", description: "Bitte Stornierungsgrund angeben.", variant: "destructive" }); return; }
    await supabase.from("reservations").update({ status: "cancelled", cancellation_reason: cancelReason } as any).eq("id", id);
    toast({ title: "Storniert" });
    setCancelId(null); setCancelReason("");
    fetchReservations();
  };

  const exportCSV = () => {
    const headers = ["Name", "E-Mail", "Telefon", "Datum", "Uhrzeit", "Bereich", "Personen", "Status"];
    const rows = reservations.map(r => [r.customer_name, r.customer_email, r.customer_phone, r.reservation_date, r.reservation_time, r.zone, r.guest_count, r.status]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `reservierungen_${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
  };

  const statusPill = (status: string) => {
    const map: Record<string, string> = { confirmed: "bg-success/20 text-success", pending: "bg-warning/20 text-warning", cancelled: "bg-muted text-muted-foreground" };
    const labels: Record<string, string> = { confirmed: "Bestätigt", pending: "Ausstehend", cancelled: "Storniert" };
    return <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${map[status] || ""}`}>{labels[status] || status}</span>;
  };

  const ic = "bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Suche nach Name oder E-Mail..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className={`${ic} pl-9 w-full`} />
        </div>
        <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className={ic} />
        <select value={filters.zone} onChange={(e) => setFilters({ ...filters, zone: e.target.value })} className={ic}>
          <option value="">Alle Bereiche</option>
          {Object.entries(zoneLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={ic}>
          <option value="">Alle Status</option>
          <option value="confirmed">Bestätigt</option><option value="pending">Ausstehend</option><option value="cancelled">Storniert</option>
        </select>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded-lg hover:bg-muted/50"><Download size={14} /> CSV</button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs">
              <th className="text-left py-3 px-4">Gast</th><th className="text-left py-3 px-4">Bereich</th>
              <th className="text-left py-3 px-4">Datum</th><th className="text-left py-3 px-4">Uhrzeit</th>
              <th className="text-left py-3 px-4">Personen</th><th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Aktionen</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Laden...</td></tr>
              ) : reservations.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Keine Reservierungen gefunden.</td></tr>
              ) : reservations.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/10">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{r.customer_name?.charAt(0)?.toUpperCase()}</div>
                      <div><div className="font-medium">{r.customer_name}</div><div className="text-[10px] text-muted-foreground">{r.customer_email}</div></div>
                    </div>
                  </td>
                  <td className="py-3 px-4"><span className={`text-[10px] font-semibold px-2 py-1 rounded ${zoneColors[r.zone] || "bg-muted text-muted-foreground"}`}>{zoneLabels[r.zone] || r.zone}</span></td>
                  <td className="py-3 px-4 text-muted-foreground">{r.reservation_date}</td>
                  <td className="py-3 px-4">{r.reservation_time}</td>
                  <td className="py-3 px-4">{r.guest_count}</td>
                  <td className="py-3 px-4">{statusPill(r.status)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground" title="E-Mail senden"><Mail size={14} /></button>
                      {r.status !== "cancelled" && (
                        <button onClick={() => setCancelId(r.id)} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary" title="Stornieren"><XCircle size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {cancelId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setCancelId(null)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl tracking-wider mb-4">Reservierung stornieren</h3>
            <textarea placeholder="Stornierungsgrund..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setCancelId(null); setCancelReason(""); }} className="flex-1 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted/50">Abbrechen</button>
              <button onClick={() => handleCancel(cancelId)} className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Stornieren</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;
