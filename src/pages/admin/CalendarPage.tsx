import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import UnitDetailPanel from "@/components/admin/UnitDetailPanel";
import NewReservationModal from "@/components/admin/NewReservationModal";

const areaColors: Record<string, string> = {
  billard: "bg-primary/20 border-primary/40 text-primary",
  kicker: "bg-warning/20 border-warning/40 text-warning",
  dart: "bg-purple-500/20 border-purple-500/40 text-purple-400",
  restaurant: "bg-success/20 border-success/40 text-success",
  vip: "bg-destructive/20 border-destructive/40 text-destructive",
  hauptbereich: "bg-success/20 border-success/40 text-success",
  fenster: "bg-blue-500/20 border-blue-500/40 text-blue-400",
  podest: "bg-primary/20 border-primary/40 text-primary",
};

const areaLabels: Record<string, string> = {
  billard: "Billard", kicker: "Kicker", dart: "Dart", restaurant: "Restaurant", vip: "VIP",
  hauptbereich: "Hauptbereich", fenster: "Fenster", podest: "Podest"
};

const CalendarPage = () => {
  const { settings } = useSettings();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [newResPrefill, setNewResPrefill] = useState<any>(null);
  const [areaFilter, setAreaFilter] = useState("");

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const hours = Array.from({ length: 13 }, (_, i) => i + 14); // 14:00 - 02:00 (26=02:00)

  useEffect(() => {
    const weekEnd = addDays(currentWeek, 6);
    supabase.from("reservations").select("*")
      .gte("reservation_date", format(currentWeek, "yyyy-MM-dd"))
      .lte("reservation_date", format(weekEnd, "yyyy-MM-dd"))
      .neq("status", "cancelled")
      .order("reservation_time")
      .then(({ data }) => setReservations(data || []));
  }, [currentWeek]);

  const getResForSlot = (day: Date, hour: number) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const hourStr = `${hour > 23 ? hour - 24 : hour}:00`;
    return reservations.filter(r =>
      r.reservation_date === dateStr &&
      r.reservation_time === hourStr &&
      (!areaFilter || r.zone === areaFilter)
    );
  };

  const isToday = (day: Date) => format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const currentHour = new Date().getHours();

  const ic = "bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl tracking-wider">📅 Kalender</h2>
        <div className="flex items-center gap-3">
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className={ic}>
            <option value="">Alle Bereiche</option>
            {Object.entries(areaLabels).map(([k, v]) => (
              settings.areas_enabled[k] !== false && <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="p-2 rounded-lg border border-border hover:bg-muted/30"><ChevronLeft size={16} /></button>
            <button onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg">Heute</button>
            <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="p-2 rounded-lg border border-border hover:bg-muted/30"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
              <div className="p-2" />
              {days.map((day) => (
                <div key={day.toISOString()} className={`p-3 text-center border-l border-border ${isToday(day) ? "bg-primary/5" : ""}`}>
                  <div className="text-xs text-muted-foreground">{format(day, "EEE", { locale: de })}</div>
                  <div className={`text-lg font-display ${isToday(day) ? "text-primary" : ""}`}>{format(day, "d")}</div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            {hours.map((hour) => {
              const displayHour = hour > 23 ? hour - 24 : hour;
              return (
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50 min-h-[48px]">
                  <div className="p-2 text-xs text-muted-foreground text-right pr-3 pt-3">
                    {String(displayHour).padStart(2, "0")}:00
                  </div>
                  {days.map((day) => {
                    const slotRes = getResForSlot(day, hour);
                    const isCurrent = isToday(day) && currentHour === displayHour;
                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={`border-l border-border/50 p-0.5 relative cursor-pointer hover:bg-muted/10 transition-colors ${
                          isCurrent ? "bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          if (slotRes.length === 0) {
                            setNewResPrefill({ date: format(day, "yyyy-MM-dd"), time: `${String(displayHour).padStart(2, "0")}:00` });
                          }
                        }}
                      >
                        {isCurrent && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
                        {slotRes.map((r) => (
                          <div
                            key={r.id}
                            onClick={(e) => { e.stopPropagation(); }}
                            className={`text-[10px] px-1.5 py-1 rounded border mb-0.5 truncate cursor-pointer hover:opacity-80 ${areaColors[r.zone] || "bg-muted/30 border-border"}`}
                          >
                            {r.customer_name?.split(" ")[0]} · {areaLabels[r.zone] || r.zone}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(areaColors).slice(0, 5).map(([key, cls]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${cls.split(" ")[0]}`} />
            <span className="text-muted-foreground">{areaLabels[key]}</span>
          </div>
        ))}
      </div>

      <UnitDetailPanel unit={selectedUnit} open={!!selectedUnit} onClose={() => setSelectedUnit(null)} />
      <NewReservationModal open={!!newResPrefill} onClose={() => setNewResPrefill(null)} prefill={newResPrefill || undefined} />
    </div>
  );
};

export default CalendarPage;
