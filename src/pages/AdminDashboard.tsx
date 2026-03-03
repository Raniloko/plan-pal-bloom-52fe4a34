import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut, Search, Edit2, XCircle, CheckCircle, Calendar, Users, X,
  TrendingUp, Clock, MapPin, PartyPopper, Phone, Mail, MessageSquare,
  ChevronDown, BarChart3, AlertTriangle, Download
} from "lucide-react";
import FloorPlan from "@/components/admin/FloorPlan";
import { useToast } from "@/hooks/use-toast";

interface Reservation {
  id: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  zone: string;
  occasion: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  message: string;
  status: string;
  created_at: string;
}

const ZONE_LABELS: Record<string, string> = {
  hauptbereich: "140-Zoll Screen",
  fenster: "75-Zoll Screen",
  billard: "Billard-Tisch",
  vip: "VIP-Raum",
  podest: "Podest",
};

const ZONE_OPTIONS = [
  { value: "hauptbereich", label: "Restaurantbereich am 140-Zoll Screen" },
  { value: "fenster", label: "Restaurantbereich am 75-Zoll Screen" },
  { value: "billard", label: "Billard-Tisch" },
  { value: "vip", label: "VIP-Raum" },
  { value: "podest", label: "Podest" },
];

const OCCASION_LABELS: Record<string, string> = {
  sport: "Live-Sport",
  feier: "Private Feier",
  essen: "Essen & Trinken",
  billard: "Billard / Kicker / Dart",
  sonstiges: "Sonstiges",
};

const OCCASION_OPTIONS = [
  { value: "sport", label: "Live-Sport schauen" },
  { value: "feier", label: "Private Feier" },
  { value: "essen", label: "Essen & Trinken" },
  { value: "billard", label: "Billard / Kicker / Dart" },
  { value: "sonstiges", label: "Sonstiges" },
];

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Bestätigt",
  cancelled: "Storniert",
  modified: "Geändert",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  modified: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
};

const VALID_TIMES = [
  "14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30",
  "22:00","22:30","23:00",
];

const AdminDashboard = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Reservation>>({});
  const [floorPlanDate, setFloorPlanDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState<"overview" | "reservations" | "floorplan">("overview");
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkAdmin = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/admin/login"); return false; }
    const { data: role } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
    if (!role) { await supabase.auth.signOut(); navigate("/admin/login"); return false; }
    return true;
  }, [navigate]);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservations").select("*").order("reservation_date", { ascending: false });
    if (!error && data) setReservations(data as Reservation[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAdmin().then((ok) => { if (ok) fetchReservations(); });
  }, [checkAdmin, fetchReservations]);

  useEffect(() => {
    const channel = supabase
      .channel("reservations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        fetchReservations();
        toast({ title: "🔄 Aktualisiert", description: "Reservierungsdaten wurden aktualisiert." });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchReservations, toast]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id);
    if (!error) {
      fetchReservations();
      toast({ title: "Storniert", description: "Reservierung wurde storniert." });
    }
  };

  const handleRestore = async (id: string) => {
    const { error } = await supabase.from("reservations").update({ status: "confirmed" }).eq("id", id);
    if (!error) {
      fetchReservations();
      toast({ title: "Wiederhergestellt", description: "Reservierung wurde wiederhergestellt." });
    }
  };

  const startEdit = (r: Reservation) => {
    setEditingId(r.id);
    setEditData({
      reservation_date: r.reservation_date,
      reservation_time: r.reservation_time,
      guest_count: r.guest_count,
      zone: r.zone,
      occasion: r.occasion,
      customer_name: r.customer_name,
      customer_email: r.customer_email,
      customer_phone: r.customer_phone,
      message: r.message,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("reservations").update({ ...editData, status: "modified" }).eq("id", editingId);
    if (!error) {
      setEditingId(null);
      fetchReservations();
      toast({ title: "Gespeichert", description: "Änderungen wurden gespeichert." });
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const activeReservations = reservations.filter(r => r.status !== "cancelled");
  const todayReservations = activeReservations.filter(r => r.reservation_date === today);
  const upcomingReservations = activeReservations.filter(r => r.reservation_date >= today);

  const filtered = reservations.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesDate = !dateFilter || r.reservation_date === dateFilter;
    const matchesSearch = !search ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_phone.includes(search) ||
      r.reservation_date.includes(search);
    return matchesStatus && matchesSearch && matchesDate;
  });

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}.${m}.${y}`;
  };

  const exportCSV = () => {
    const headers = ["Datum", "Uhrzeit", "Gäste", "Bereich", "Anlass", "Name", "E-Mail", "Telefon", "Nachricht", "Status"];
    const rows = filtered.map(r => [
      formatDate(r.reservation_date),
      r.reservation_time,
      r.guest_count,
      ZONE_LABELS[r.zone] || r.zone,
      OCCASION_LABELS[r.occasion] || r.occasion,
      r.customer_name,
      r.customer_email,
      r.customer_phone,
      (r.message || "").replace(/"/g, '""'),
      STATUS_LABELS[r.status] || r.status,
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservierungen_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportiert", description: `${filtered.length} Reservierung(en) exportiert.` });
  };

  return (
    <main className="pt-20 md:pt-24 min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl md:text-5xl tracking-wide">
              Admin <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Rondo Sportsbar · Reservierungsverwaltung</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground hover:text-foreground bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 transition-all hover:border-destructive/30 hover:text-destructive">
            <LogOut size={16} /> Abmelden
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-muted/30 border border-border/50 rounded-xl p-1 w-fit">
          {[
            { id: "overview" as const, label: "Übersicht", icon: BarChart3 },
            { id: "reservations" as const, label: "Reservierungen", icon: Calendar },
            { id: "floorplan" as const, label: "Raumplan", icon: MapPin },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Calendar} label="Heute" value={todayReservations.length}
                subtitle={`${todayReservations.reduce((s, r) => s + r.guest_count, 0)} Gäste`}
                gradient="from-emerald-500/20 to-emerald-500/5" iconColor="text-emerald-400"
              />
              <StatCard
                icon={TrendingUp} label="Kommende" value={upcomingReservations.length}
                subtitle={`${upcomingReservations.reduce((s, r) => s + r.guest_count, 0)} Gäste`}
                gradient="from-blue-500/20 to-blue-500/5" iconColor="text-blue-400"
              />
              <StatCard
                icon={Users} label="Gesamt aktiv" value={activeReservations.length}
                subtitle={`${activeReservations.reduce((s, r) => s + r.guest_count, 0)} Gäste`}
                gradient="from-primary/20 to-primary/5" iconColor="text-primary"
              />
              <StatCard
                icon={XCircle} label="Storniert" value={reservations.filter(r => r.status === "cancelled").length}
                subtitle="Insgesamt"
                gradient="from-red-500/20 to-red-500/5" iconColor="text-red-400"
              />
            </div>

            {/* Today's reservations */}
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-6">
              <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
                <Clock size={20} className="text-primary" />
                Heutige Reservierungen
                <span className="text-sm font-sans font-normal text-muted-foreground ml-2">({formatDate(today)})</span>
              </h2>
              {todayReservations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Keine Reservierungen für heute.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {todayReservations.sort((a, b) => a.reservation_time.localeCompare(b.reservation_time)).map(r => (
                    <div key={r.id} onClick={() => startEdit(r)}
                      className="flex items-center gap-4 bg-muted/30 border border-border/50 rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all group">
                      <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
                        <span className="text-primary font-bold text-lg leading-none">{r.reservation_time.split(":")[0]}</span>
                        <span className="text-primary/70 text-xs">:{r.reservation_time.split(":")[1]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{r.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {r.guest_count} Gäste · {ZONE_LABELS[r.zone]} · {OCCASION_LABELS[r.occasion]}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${STATUS_COLORS[r.status] || ""}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                      <Edit2 size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zone Overview */}
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-6">
              <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-primary" />
                Bereiche – Heute
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(ZONE_LABELS).map(([key, label]) => {
                  const count = todayReservations.filter(r => r.zone === key).length;
                  const guests = todayReservations.filter(r => r.zone === key).reduce((s, r) => s + r.guest_count, 0);
                  return (
                    <div key={key} className="bg-muted/30 border border-border/50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{count}</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                      {guests > 0 && <p className="text-xs text-primary/60 mt-0.5">{guests} Gäste</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* RESERVATIONS TAB */}
        {activeTab === "reservations" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-5">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text" placeholder="Name, E-Mail, Telefon oder Datum suchen..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-muted/50 border border-border/50 rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <input
                    type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <div className="flex gap-1 bg-muted/30 border border-border/50 rounded-xl p-1">
                    {["all", "confirmed", "modified", "cancelled"].map((s) => (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                          statusFilter === s
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground"
                        }`}>
                        {s === "all" ? "Alle" : STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{filtered.length} Reservierung{filtered.length !== 1 ? "en" : ""} gefunden</p>
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all">
                <Download size={14} /> CSV Export
              </button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground">Lade Reservierungen...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
                <p>Keine Reservierungen gefunden.</p>
              </div>
            ) : (
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        <th className="py-4 px-4 font-semibold text-left text-xs uppercase tracking-wider text-muted-foreground">Datum & Zeit</th>
                        <th className="py-4 px-4 font-semibold text-left text-xs uppercase tracking-wider text-muted-foreground">Kunde</th>
                        <th className="py-4 px-4 font-semibold text-left text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Gäste</th>
                        <th className="py-4 px-4 font-semibold text-left text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Bereich</th>
                        <th className="py-4 px-4 font-semibold text-left text-xs uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Anlass</th>
                        <th className="py-4 px-4 font-semibold text-left text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="py-4 px-4 font-semibold text-right text-xs uppercase tracking-wider text-muted-foreground">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => {
                        const isToday = r.reservation_date === today;
                        return (
                          <tr key={r.id} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${r.status === "cancelled" ? "opacity-40" : ""} ${isToday ? "bg-primary/3" : ""}`}>
                            <td className="py-4 px-4">
                              <div className="font-semibold">{formatDate(r.reservation_date)}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={10} /> {r.reservation_time} Uhr</div>
                              {isToday && <span className="text-[10px] font-bold text-primary uppercase">Heute</span>}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-semibold">{r.customer_name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={10} /> {r.customer_email}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} /> {r.customer_phone}</div>
                            </td>
                            <td className="py-4 px-4 hidden md:table-cell">
                              <div className="flex items-center gap-1.5">
                                <Users size={14} className="text-primary/60" />
                                <span className="font-semibold">{r.guest_count}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 hidden md:table-cell">
                              <span className="text-xs bg-muted/50 border border-border/50 rounded-lg px-2.5 py-1">
                                {ZONE_LABELS[r.zone] || r.zone}
                              </span>
                            </td>
                            <td className="py-4 px-4 hidden lg:table-cell text-muted-foreground">
                              {OCCASION_LABELS[r.occasion] || r.occasion}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold border ${STATUS_COLORS[r.status] || ""}`}>
                                {STATUS_LABELS[r.status] || r.status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => startEdit(r)} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all" title="Bearbeiten">
                                  <Edit2 size={14} />
                                </button>
                                {r.status !== "cancelled" ? (
                                  <button onClick={() => handleCancel(r.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="Stornieren">
                                    <XCircle size={14} />
                                  </button>
                                ) : (
                                  <button onClick={() => handleRestore(r.id)} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all" title="Wiederherstellen">
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FLOORPLAN TAB */}
        {activeTab === "floorplan" && (
          <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Datum:</label>
                <input type="date" value={floorPlanDate} onChange={(e) => setFloorPlanDate(e.target.value)}
                  className="bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                <button onClick={() => setFloorPlanDate(today)}
                  className="px-4 py-2.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all">
                  Heute
                </button>
              </div>
            </div>
            <FloorPlan reservations={reservations} selectedDate={floorPlanDate} onSelectReservation={(r) => startEdit(r as Reservation)} />
          </div>
        )}

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setEditingId(null)}>
            <div className="bg-card border border-border/50 rounded-2xl p-0 w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50 px-6 py-5 flex items-center justify-between">
                <h2 className="font-display text-2xl flex items-center gap-2">
                  <Edit2 size={20} className="text-primary" />
                  Reservierung bearbeiten
                </h2>
                <button onClick={() => setEditingId(null)} className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Datum" icon={Calendar}>
                    <input type="date" value={editData.reservation_date || ""}
                      onChange={(e) => setEditData({ ...editData, reservation_date: e.target.value })}
                      className="form-input-style" />
                  </FormField>
                  <FormField label="Uhrzeit" icon={Clock}>
                    <div className="relative">
                      <select value={editData.reservation_time || ""}
                        onChange={(e) => setEditData({ ...editData, reservation_time: e.target.value })}
                        className="form-input-style appearance-none pr-10">
                        {VALID_TIMES.map(t => <option key={t} value={t}>{t} Uhr</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </FormField>
                </div>

                {/* Guests */}
                <FormField label="Anzahl Gäste" icon={Users}>
                  <input type="number" min={1} max={50} value={editData.guest_count || 2}
                    onChange={(e) => setEditData({ ...editData, guest_count: parseInt(e.target.value) })}
                    className="form-input-style" />
                </FormField>

                {/* Zone */}
                <FormField label="Bereich" icon={MapPin}>
                  <div className="relative">
                    <select value={editData.zone || ""}
                      onChange={(e) => setEditData({ ...editData, zone: e.target.value })}
                      className="form-input-style appearance-none pr-10">
                      {ZONE_OPTIONS.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </FormField>

                {/* Occasion */}
                <FormField label="Anlass" icon={PartyPopper}>
                  <div className="relative">
                    <select value={editData.occasion || ""}
                      onChange={(e) => setEditData({ ...editData, occasion: e.target.value })}
                      className="form-input-style appearance-none pr-10">
                      {OCCASION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </FormField>

                <div className="border-t border-border/30 my-2" />

                {/* Customer Info */}
                <FormField label="Name" icon={Users}>
                  <input type="text" value={editData.customer_name || ""}
                    onChange={(e) => setEditData({ ...editData, customer_name: e.target.value })}
                    className="form-input-style" />
                </FormField>
                <FormField label="E-Mail" icon={Mail}>
                  <input type="email" value={editData.customer_email || ""}
                    onChange={(e) => setEditData({ ...editData, customer_email: e.target.value })}
                    className="form-input-style" />
                </FormField>
                <FormField label="Telefon" icon={Phone}>
                  <input type="tel" value={editData.customer_phone || ""}
                    onChange={(e) => setEditData({ ...editData, customer_phone: e.target.value })}
                    className="form-input-style" />
                </FormField>
                <FormField label="Nachricht" icon={MessageSquare}>
                  <textarea value={editData.message || ""}
                    onChange={(e) => setEditData({ ...editData, message: e.target.value })} rows={2}
                    className="form-input-style resize-none" />
                </FormField>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-border/50 px-6 py-4 flex gap-3 bg-muted/10">
                <button onClick={saveEdit}
                  className="flex-1 bg-gradient-to-r from-primary to-yellow-500 text-primary-foreground py-3 font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                  Speichern
                </button>
                <button onClick={() => setEditingId(null)}
                  className="flex-1 border border-border/50 py-3 font-semibold rounded-xl hover:border-primary/30 hover:bg-muted/30 transition-all text-muted-foreground">
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .form-input-style {
          width: 100%;
          background: hsl(var(--muted) / 0.5);
          border: 1px solid hsl(var(--border) / 0.5);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .form-input-style:focus {
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3);
          border-color: hsl(var(--primary) / 0.5);
        }
      `}</style>
    </main>
  );
};

/* Stat Card Component */
const StatCard = ({ icon: Icon, label, value, subtitle, gradient, iconColor }: {
  icon: React.ElementType; label: string; value: number; subtitle: string; gradient: string; iconColor: string;
}) => (
  <div className={`bg-gradient-to-br ${gradient} border border-border/30 rounded-2xl p-5 backdrop-blur`}>
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl bg-card/50 ${iconColor}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground/60">{subtitle}</p>
      </div>
    </div>
  </div>
);

/* Form Field Component */
const FormField = ({ label, icon: Icon, children }: {
  label: string; icon: React.ElementType; children: React.ReactNode;
}) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
      <Icon size={12} /> {label}
    </label>
    {children}
  </div>
);

export default AdminDashboard;
