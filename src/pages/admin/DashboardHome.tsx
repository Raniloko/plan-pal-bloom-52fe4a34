import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";
import { CalendarCheck, Clock, AlertCircle, XCircle } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const DashboardHome = () => {
  const [stats, setStats] = useState({ today: 0, freeSlots: 0, pending: 0, cancelled: 0 });
  const [todayReservations, setTodayReservations] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const fetchData = async () => {
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
    };
    fetchData();
  }, [today]);

  const statusPill = (status: string) => {
    const map: Record<string, string> = { confirmed: "bg-success/20 text-success", pending: "bg-warning/20 text-warning", cancelled: "bg-muted text-muted-foreground" };
    const labels: Record<string, string> = { confirmed: "Bestätigt", pending: "Ausstehend", cancelled: "Storniert" };
    return <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${map[status] || ""}`}>{labels[status] || status}</span>;
  };

  const zoneLabels: Record<string, string> = { billard: "Billard", kicker: "Kicker", dart: "Dart", restaurant: "Restaurant", vip: "VIP", hauptbereich: "Hauptbereich", fenster: "Fenster", podest: "Podest" };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Reservierungen Heute" value={stats.today} icon={CalendarCheck} color="text-primary" bgColor="bg-primary/10" />
        <StatCard title="Freie Slots Gesamt" value={stats.freeSlots} icon={Clock} color="text-success" bgColor="bg-success/10" />
        <StatCard title="Ausstehende Anfragen" value={stats.pending} icon={AlertCircle} color="text-warning" bgColor="bg-warning/10" />
        <StatCard title="Stornierungen Heute" value={stats.cancelled} icon={XCircle} color="text-blue-400" bgColor="bg-blue-400/10" />
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display text-xl tracking-wider mb-4">Auslastung diese Woche</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" stroke="#6b6b7a" fontSize={12} />
            <YAxis stroke="#6b6b7a" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: "#18181d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="count" fill="hsl(0, 84%, 51%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display text-xl tracking-wider mb-4">Heutige Reservierungen</h2>
        {todayReservations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Reservierungen für heute.</p>
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
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-3 font-medium">{r.customer_name}</td>
                    <td className="py-3 px-3"><span className="text-xs bg-muted px-2 py-1 rounded">{zoneLabels[r.zone] || r.zone}</span></td>
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
    </div>
  );
};

export default DashboardHome;
