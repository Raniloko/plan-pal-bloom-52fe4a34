import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Search, Edit2, XCircle, CheckCircle, Calendar, Users, MapPin } from "lucide-react";
import FloorPlan from "@/components/admin/FloorPlan";

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

const OCCASION_LABELS: Record<string, string> = {
  sport: "Live-Sport",
  feier: "Private Feier",
  essen: "Essen & Trinken",
  billard: "Billard / Kicker / Dart",
  sonstiges: "Sonstiges",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Bestätigt",
  cancelled: "Storniert",
  modified: "Geändert",
};

const AdminDashboard = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Reservation>>({});
  const [floorPlanDate, setFloorPlanDate] = useState(() => new Date().toISOString().split("T")[0]);
  const navigate = useNavigate();

  const checkAdmin = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login");
      return false;
    }
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) {
      await supabase.auth.signOut();
      navigate("/admin/login");
      return false;
    }
    return true;
  }, [navigate]);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("reservation_date", { ascending: false });
    if (!error && data) {
      setReservations(data as Reservation[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAdmin().then((ok) => {
      if (ok) fetchReservations();
    });
  }, [checkAdmin, fetchReservations]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (!error) fetchReservations();
  };

  const handleRestore = async (id: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "confirmed" })
      .eq("id", id);
    if (!error) fetchReservations();
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
      .from("reservations")
      .update({ ...editData, status: "modified" })
      .eq("id", editingId);
    if (!error) {
      setEditingId(null);
      fetchReservations();
    }
  };

  const filtered = reservations.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesSearch =
      !search ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      r.reservation_date.includes(search);
    return matchesStatus && matchesSearch;
  });

  return (
    <main className="pt-20 md:pt-24 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl md:text-5xl">
            Admin <span className="text-primary">Panel</span>
          </h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={18} /> Abmelden
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <Calendar size={24} className="text-primary" />
            <div>
              <p className="text-2xl font-bold">{reservations.filter(r => r.status !== "cancelled").length}</p>
              <p className="text-xs text-muted-foreground">Aktive Reservierungen</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <Users size={24} className="text-primary" />
            <div>
              <p className="text-2xl font-bold">{reservations.filter(r => r.status !== "cancelled").reduce((s, r) => s + r.guest_count, 0)}</p>
              <p className="text-xs text-muted-foreground">Gäste insgesamt</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <XCircle size={24} className="text-destructive" />
            <div>
              <p className="text-2xl font-bold">{reservations.filter(r => r.status === "cancelled").length}</p>
              <p className="text-xs text-muted-foreground">Storniert</p>
            </div>
          </div>
        </div>

        {/* Floor Plan */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium text-muted-foreground">Datum für Raumplan:</label>
            <input
              type="date"
              value={floorPlanDate}
              onChange={(e) => setFloorPlanDate(e.target.value)}
              className="bg-muted border border-border rounded-md px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <FloorPlan reservations={reservations} selectedDate={floorPlanDate} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Name, E-Mail oder Datum suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-muted border border-border rounded-md pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            {["all", "confirmed", "modified", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                  statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border hover:border-primary/50"
                }`}
              >
                {s === "all" ? "Alle" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-muted-foreground text-center py-12">Lade Reservierungen...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Keine Reservierungen gefunden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-3 px-2 font-semibold">Datum</th>
                  <th className="py-3 px-2 font-semibold">Uhrzeit</th>
                  <th className="py-3 px-2 font-semibold">Name</th>
                  <th className="py-3 px-2 font-semibold hidden md:table-cell">Gäste</th>
                  <th className="py-3 px-2 font-semibold hidden md:table-cell">Bereich</th>
                  <th className="py-3 px-2 font-semibold hidden lg:table-cell">Anlass</th>
                  <th className="py-3 px-2 font-semibold">Status</th>
                  <th className="py-3 px-2 font-semibold">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={`border-b border-border/50 hover:bg-muted/50 ${r.status === "cancelled" ? "opacity-50" : ""}`}>
                    <td className="py-3 px-2">{r.reservation_date}</td>
                    <td className="py-3 px-2">{r.reservation_time}</td>
                    <td className="py-3 px-2">
                      <div>{r.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{r.customer_email}</div>
                    </td>
                    <td className="py-3 px-2 hidden md:table-cell">{r.guest_count}</td>
                    <td className="py-3 px-2 hidden md:table-cell">{ZONE_LABELS[r.zone] || r.zone}</td>
                    <td className="py-3 px-2 hidden lg:table-cell">{OCCASION_LABELS[r.occasion] || r.occasion}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === "confirmed" ? "bg-green-900/30 text-green-400" :
                        r.status === "modified" ? "bg-yellow-900/30 text-yellow-400" :
                        "bg-red-900/30 text-red-400"
                      }`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(r)} className="text-primary hover:text-primary/80" title="Bearbeiten">
                          <Edit2 size={16} />
                        </button>
                        {r.status !== "cancelled" ? (
                          <button onClick={() => handleCancel(r.id)} className="text-destructive hover:text-destructive/80" title="Stornieren">
                            <XCircle size={16} />
                          </button>
                        ) : (
                          <button onClick={() => handleRestore(r.id)} className="text-green-400 hover:text-green-300" title="Wiederherstellen">
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="font-display text-2xl mb-4">Reservierung bearbeiten</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Datum</label>
                    <input type="date" value={editData.reservation_date || ""} onChange={(e) => setEditData({ ...editData, reservation_date: e.target.value })}
                      className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Uhrzeit</label>
                    <input type="text" value={editData.reservation_time || ""} onChange={(e) => setEditData({ ...editData, reservation_time: e.target.value })}
                      className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Gäste</label>
                  <input type="number" min={1} max={50} value={editData.guest_count || 2} onChange={(e) => setEditData({ ...editData, guest_count: parseInt(e.target.value) })}
                    className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Name</label>
                  <input type="text" value={editData.customer_name || ""} onChange={(e) => setEditData({ ...editData, customer_name: e.target.value })}
                    className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">E-Mail</label>
                  <input type="email" value={editData.customer_email || ""} onChange={(e) => setEditData({ ...editData, customer_email: e.target.value })}
                    className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Telefon</label>
                  <input type="tel" value={editData.customer_phone || ""} onChange={(e) => setEditData({ ...editData, customer_phone: e.target.value })}
                    className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Nachricht</label>
                  <textarea value={editData.message || ""} onChange={(e) => setEditData({ ...editData, message: e.target.value })} rows={2}
                    className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={saveEdit} className="flex-1 bg-primary text-primary-foreground py-2.5 font-semibold rounded-md hover:bg-primary/90 transition-colors">
                  Speichern
                </button>
                <button onClick={() => setEditingId(null)} className="flex-1 border border-border py-2.5 font-semibold rounded-md hover:border-primary/50 transition-colors">
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminDashboard;
