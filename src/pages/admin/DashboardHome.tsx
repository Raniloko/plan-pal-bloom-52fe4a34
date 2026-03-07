import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarCheck, Clock, AlertCircle, XCircle } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import UnitCard from "@/components/admin/UnitCard";
import UnitDetailPanel from "@/components/admin/UnitDetailPanel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const DashboardHome = () => {
  const [stats, setStats] = useState({ today: 0, freeSlots: 0, pending: 0, cancelled: 0 });
  const [todayReservations, setTodayReservations] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [billardUnits, setBillardUnits] = useState<any[]>([]);
  const [kickerUnits, setKickerUnits] = useState<any[]>([]);
  const [dartUnits, setDartUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  const fetchAll = async () => {
    const { data: todayRes } = await supabase.from("reservations").select("*").eq("reservation_date", today).order("reservation_time");
    setTodayReservations(todayRes || []);
    const confirmed = todayRes?.filter(r => r.status === "confirmed").length || 0;
    const pending = todayRes?.filter(r => r.status === "pending").length || 0;
    const cancelled = todayRes?.filter(r => r.status === "cancelled").length || 0;
    const { count: freeCount } = await supabase.from("units").select("*", { count: "exact", head: true }).eq("status", "free");
    setStats({ today: confirmed + pending, freeSlots: freeCount || 0, pending, cancelled });

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    const weekly = [];
    for (let i = 0; i < 7; i++) {
      const d = format(addDays(weekStart, i), "yyyy-MM-dd");
      const { count } = await supabase.from("reservations").select("*", { count: "exact", head: true }).eq("reservation_date", d).neq("status", "cancelled");
      weekly.push({ day: days[i], count: count || 0 });
    }
    setWeeklyData(weekly);

    const { data: bu } = await supabase.from("units").select("*").eq("area", "billard").order("position_index");
    setBillardUnits(bu || []);
    const { data: ku } = await supabase.from("units").select("*").eq("area", "kicker").order("position_index");
    setKickerUnits(ku || []);
    const { data: du } = await supabase.from("units").select("*").eq("area", "dart").order("position_index");
    setDartUnits(du || []);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel("dashboard-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "units" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [today]);

  const statusPill = (status: string) => {
    const map: Record<string, string> = { confirmed: "bg-success/20 text-success", pending: "bg-warning/20 text-warning", cancelled: "bg-muted text-muted-foreground" };
    const labels: Record<string, string> = { confirmed: "Bestätigt", pending: "Ausstehend", cancelled: "Storniert" };
    return <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${map[status] || ""}`}>{labels[status] || status}</span>;
  };

  const zoneLabels: Record<string, string> = { billard: "Billard", kicker: "Kicker", dart: "Dart", restaurant: "Restaurant", vip: "VIP", hauptbereich: "Hauptbereich", fenster: "Fenster", podest: "Podest" };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <StatCard title="Reservierungen Heute" value={stats.today} icon={CalendarCheck} color="text-primary" bgColor="bg-primary/10" glowColor="#c9a84c" />
        <StatCard title="Freie Slots Gesamt" value={stats.freeSlots} icon={Clock} color="text-success" bgColor="bg-success/10" glowColor="#1fe87a" />
        <StatCard title="Ausstehende Anfragen" value={stats.pending} icon={AlertCircle} color="text-warning" bgColor="bg-warning/10" glowColor="#e8831f" />
        <StatCard title="Stornierungen Heute" value={stats.cancelled} icon={XCircle} color="text-destructive" bgColor="bg-destructive/10" glowColor="#e81f1f" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Billard map */}
        <div className="glass-card rounded-xl p-5 gold-glow">
          <h2 className="font-display text-xl tracking-wider mb-4">🎱 Billard-Übersicht</h2>
          <div className="grid grid-cols-4 gap-3 animate-stagger">
            {billardUnits.map(u => <UnitCard key={u.id} unit={u} onClick={() => setSelectedUnit(u)} />)}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Weekly chart */}
          <div className="glass-card rounded-xl p-5">
            <h2 className="font-display text-xl tracking-wider mb-4">Auslastung diese Woche</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" stroke="#6b6b7a" fontSize={12} />
                <YAxis stroke="#6b6b7a" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(17,17,24,0.9)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "8px", backdropFilter: "blur(16px)" }} />
                <Bar dataKey="count" fill="hsl(43, 52%, 54%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Kicker + Dart */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-4">
              <h3 className="font-display text-sm tracking-wider mb-3">⚽ Kicker</h3>
              <div className="space-y-2 animate-stagger">
                {kickerUnits.map(u => <UnitCard key={u.id} unit={u} onClick={() => setSelectedUnit(u)} />)}
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <h3 className="font-display text-sm tracking-wider mb-3">🎯 Dart</h3>
              <div className="space-y-2 animate-stagger">
                {dartUnits.map(u => <UnitCard key={u.id} unit={u} onClick={() => setSelectedUnit(u)} />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's reservations table */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="font-display text-xl tracking-wider mb-4">Heutige Reservierungen</h2>
        {todayReservations.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Keine Reservierungen für heute.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground text-xs">
                <th className="text-left py-3 px-3">Gast</th><th className="text-left py-3 px-3">Bereich</th>
                <th className="text-left py-3 px-3">Uhrzeit</th><th className="text-left py-3 px-3">Personen</th>
                <th className="text-left py-3 px-3">Status</th>
              </tr></thead>
              <tbody>
                {todayReservations.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">{r.customer_name?.charAt(0)?.toUpperCase()}</div>
                        <span className="font-medium">{r.customer_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3"><span className="text-xs bg-muted/50 px-2 py-1 rounded">{zoneLabels[r.zone] || r.zone}</span></td>
                    <td className="py-3 px-3">{r.reservation_time} Uhr</td>
                    <td className="py-3 px-3">{r.guest_count}</td>
                    <td className="py-3 px-3">{statusPill(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UnitDetailPanel unit={selectedUnit} open={!!selectedUnit} onClose={() => setSelectedUnit(null)} onStatusChange={fetchAll} />
    </div>
  );
};

export default DashboardHome;
