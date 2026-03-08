import { useEffect, useState } from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { de } from "date-fns/locale";
import {
  CalendarDays, ChevronLeft, ChevronRight, BarChart2,
  Users, Settings, Bell, LogOut, Menu,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Props {
  totalReservations: number;
  totalGuests: number;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenNotifications: () => void;
}

const Div = () => <div style={{ width: 1, alignSelf: "stretch", background: "#2a2a2a" }} />;

const IcoBtn = ({ children, borderL, onClick, active }: { children: React.ReactNode; borderL?: boolean; onClick?: () => void; active?: boolean }) => (
  <button onClick={onClick} style={{
    width: 38, height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    color: active ? "#fff" : "#666", background: active ? "#1e1e1e" : "transparent", border: "none",
    borderLeft: borderL ? "1px solid #2a2a2a" : undefined, cursor: "pointer",
  }}
    onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "#1e1e1e"; }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}}
  >
    {children}
  </button>
);

const MEALS = ["Mittagessen", "Abendessen", "Spätabend"];

export const OperationalTopbar = ({
  totalReservations, totalGuests, selectedDate, onDateChange,
  onOpenSettings, onOpenStats, onOpenNotifications,
}: Props) => {
  const [time, setTime] = useState("");
  const [mealIndex, setMealIndex] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const shortDate = format(selectedDate, "EEE., d MMM", { locale: de });


  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const goToday = () => {
    onDateChange(new Date());
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", height: 52, minHeight: 52,
      background: "#111111", borderBottom: "1px solid #2a2a2a",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* A – Logo (top left) */}
      <div style={{ padding: "0 12px", display: "flex", alignItems: "center", height: "100%" }}>
        <img src="/images/rondo-logo.png" alt="Rondo" style={{ height: 28, filter: "brightness(0) invert(1)", opacity: 0.85 }} />
      </div>
      <Div />

      {/* B – Jetzt */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => {
              if (isToday(selectedDate)) {
                // If already today, just open calendar
              } else {
                e.preventDefault();
                goToday();
              }
            }}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "0 12px", height: "100%",
              fontSize: 13, fontWeight: 600,
              color: isToday(selectedDate) ? "#4ade80" : "#fff",
              background: "transparent", border: "none",
              borderRight: "1px solid #2a2a2a", cursor: "pointer",
            }}
          >
            <CalendarDays size={14} /> Jetzt
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" style={{ zIndex: 9999 }}>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => { if (d) { onDateChange(d); setCalendarOpen(false); } }}
            locale={de}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {/* C – Date nav */}
      <div style={{ display: "flex", alignItems: "center", height: "100%", borderRight: "1px solid #2a2a2a" }}>
        <button onClick={() => onDateChange(subDays(selectedDate, 1))} style={{ width: 28, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", background: "transparent", border: "none", cursor: "pointer" }}><ChevronLeft size={14} /></button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", padding: "0 4px", whiteSpace: "nowrap" }}>{shortDate}</span>
        <button onClick={() => onDateChange(addDays(selectedDate, 1))} style={{ width: 28, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", background: "transparent", border: "none", cursor: "pointer" }}><ChevronRight size={14} /></button>
      </div>

      {/* D – Meal */}
      <div style={{ display: "flex", alignItems: "center", height: "100%", borderRight: "1px solid #2a2a2a" }}>
        <button onClick={() => setMealIndex(i => Math.max(0, i - 1))} style={{ width: 22, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: mealIndex > 0 ? "#666" : "#333", background: "transparent", border: "none", cursor: mealIndex > 0 ? "pointer" : "default" }}><ChevronLeft size={12} /></button>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#fff", padding: "0 4px" }}>{MEALS[mealIndex]}</span>
        <button onClick={() => setMealIndex(i => Math.min(MEALS.length - 1, i + 1))} style={{ width: 22, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: mealIndex < MEALS.length - 1 ? "#666" : "#333", background: "transparent", border: "none", cursor: mealIndex < MEALS.length - 1 ? "pointer" : "default" }}><ChevronRight size={12} /></button>
      </div>

      {/* E – Time */}
      <div style={{ display: "flex", alignItems: "center", height: "100%", borderRight: "1px solid #2a2a2a" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", padding: "0 12px", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>{time}</span>
      </div>

      {/* F – Right icons */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", height: "100%" }}>
        <IcoBtn borderL onClick={onOpenStats}><BarChart2 size={16} /></IcoBtn>
        <IcoBtn borderL onClick={onOpenNotifications}><Bell size={16} /></IcoBtn>
        <div style={{ display: "flex", alignItems: "center", padding: "0 12px", height: "100%", borderLeft: "1px solid #2a2a2a" }}>
          <Users size={14} style={{ color: "#666", marginRight: 6 }} />
          <span style={{ fontSize: 13, color: "#888" }}>
            <span style={{ fontWeight: 700, color: "#fff" }}>{totalReservations}</span>/{totalGuests}
          </span>
        </div>
        <IcoBtn borderL onClick={onOpenSettings}><Settings size={16} /></IcoBtn>
        <IcoBtn borderL onClick={async () => { await signOut(); navigate("/admin/login", { replace: true }); }}><LogOut size={16} /></IcoBtn>
      </div>
    </div>
  );
};
