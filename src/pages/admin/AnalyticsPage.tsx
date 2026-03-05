import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const AREA_COLORS: Record<string, string> = { billard: "#1fe87a", kicker: "#3b82f6", dart: "#a855f7", restaurant: "#e8831f", vip: "#e81f1f" };

const AnalyticsPage = () => {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [areaData, setAreaData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<Record<string, Record<string, number>>>({});
  const [totalMonth, setTotalMonth] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
      const weekly = [];
      for (let i = 0; i < 7; i++) {
        const d = format(addDays(weekStart, i), "yyyy-MM-dd");
        const { count } = await supabase.from("reservations").select("*", { count: "exact", head: true }).eq("reservation_date", d).neq("status", "cancelled");
        weekly.push({ day: days[i], count: count || 0 });
      }
      setWeeklyData(weekly);

      const { data: allRes } = await supabase.from("reservations").select("zone").neq("status", "cancelled");
      const areaCounts: Record<string, number> = {};
      allRes?.forEach((r: any) => { areaCounts[r.zone] = (areaCounts[r.zone] || 0) + 1; });
      const areaLabels: Record<string, string> = { billard: "Billard", kicker: "Kicker", dart: "Dart", restaurant: "Restaurant", vip: "VIP", hauptbereich: "Restaurant", fenster: "Restaurant", podest: "VIP" };
      setAreaData(Object.entries(areaCounts).map(([k, v]) => ({ name: areaLabels[k] || k, value: v, color: AREA_COLORS[k] || "#666" })));

      const monthly = [];
      for (let m = 2; m >= 0; m--) {
        const month = new Date(today.getFullYear(), today.getMonth() - m, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() - m + 1, 0);
        const { count } = await supabase.from("reservations").select("*", { count: "exact", head: true })
          .gte("reservation_date", format(month, "yyyy-MM-dd")).lte("reservation_date", format(monthEnd, "yyyy-MM-dd")).neq("status", "cancelled");
        monthly.push({ month: format(month, "MMM", { locale: de }), count: count || 0 });
      }
      setMonthlyData(monthly);
      setTotalMonth(monthly[monthly.length - 1]?.count || 0);

      const { data: heatRes } = await supabase.from("reservations").select("reservation_date, reservation_time").neq("status", "cancelled").limit(500);
      const hm: Record<string, Record<string, number>> = {};
      const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
      heatRes?.forEach((r: any) => {
        const d = new Date(r.reservation_date);
        const dayName = dayNames[d.getDay()];
        const hour = r.reservation_time?.split(":")[0] || "0";
        if (!hm[dayName]) hm[dayName] = {};
        hm[dayName][hour] = (hm[dayName][hour] || 0) + 1;
      });
      setHeatmap(hm);
    };
    fetchAll();
  }, []);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 14));
  const dayOrder = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl tracking-wider">📊 Auslastung</h2>
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <span className="text-xs text-muted-foreground">Diesen Monat</span>
          <span className="block text-2xl font-display">{totalMonth}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display text-lg tracking-wider mb-4">Wochenübersicht</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#6b6b7a" fontSize={12} /><YAxis stroke="#6b6b7a" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#18181d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }} />
              <Bar dataKey="count" fill="hsl(0, 84%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display text-lg tracking-wider mb-4">Verteilung nach Bereich</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={areaData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name">
                {areaData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#18181d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display text-lg tracking-wider mb-4">Monatlicher Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#6b6b7a" fontSize={12} /><YAxis stroke="#6b6b7a" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#18181d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }} />
              <Line type="monotone" dataKey="count" stroke="hsl(0, 84%, 51%)" strokeWidth={2} dot={{ fill: "hsl(0, 84%, 51%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display text-lg tracking-wider mb-4">Beliebte Zeitfenster</h3>
          <div className="overflow-x-auto">
            <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(${hours.length}, 1fr)` }}>
              <div />
              {hours.map(h => <div key={h} className="text-center text-[10px] text-muted-foreground">{h}:00</div>)}
              {dayOrder.map(day => (
                <Fragment key={day}>
                  <div className="text-xs text-muted-foreground flex items-center">{day}</div>
                  {hours.map(h => {
                    const val = heatmap[day]?.[h] || 0;
                    const intensity = Math.min(1, val / 5);
                    return (
                      <div key={`${day}-${h}`} className="aspect-square rounded"
                        style={{ backgroundColor: val > 0 ? `rgba(232, 31, 31, ${0.15 + intensity * 0.7})` : "rgba(255,255,255,0.03)" }}
                        title={`${day} ${h}:00 – ${val} Buchungen`} />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
