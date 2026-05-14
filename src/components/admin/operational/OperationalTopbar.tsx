import { useEffect, useState } from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { de } from "date-fns/locale";
import {
  CalendarDays, ChevronLeft, ChevronRight,
  Users, Settings, Bell, LogOut, Repeat,
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
  onOpenNotifications: () => void;
  onOpenRecurring: () => void;
  isMobile?: boolean;
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

export const OperationalTopbar = ({
  totalReservations, totalGuests, selectedDate, onDateChange,
  onOpenSettings, onOpenNotifications, onOpenRecurring, isMobile = false,
}: Props) => {
  const [time, setTime] = useState("");
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
      display: "flex", alignItems: "center", height: isMobile ? 44 : 52, minHeight: isMobile ? 44 : 52,
      background: "#111111", borderBottom: "1px solid #2a2a2a",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding: isMobile ? "0 8px" : "0 12px", display: "flex", alignItems: "center", height: "100%" }}>
        <img src="/images/rondo-logo.png" alt="Rondo" style={{ height: isMobile ? 22 : 28 }} />
      </div>
      <Div />

      {/* Jetzt */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => {
              if (isToday(selectedDate)) {
                // already today, open calendar
              } else {
                e.preventDefault();
                goToday();
              }
            }}
            style={{
              display: "flex", alignItems: "center", gap: isMobile ? 4 : 6, padding: isMobile ? "0 6px" : "0 12px", height: "100%",
              fontSize: isMobile ? 11 : 13, fontWeight: 600,
              color: isToday(selectedDate) ? "#4ade80" : "#fff",
              background: "transparent", border: "none",
              borderRight: "1px solid #2a2a2a", cursor: "pointer",
            }}
          >
            <CalendarDays size={isMobile ? 12 : 14} /> {isMobile ? "" : "Jetzt"}
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

      {/* Date nav */}
      <div style={{ display: "flex", alignItems: "center", height: "100%", borderRight: "1px solid #2a2a2a" }}>
        <button onClick={() => onDateChange(subDays(selectedDate, 1))} style={{ width: 28, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", background: "transparent", border: "none", cursor: "pointer" }}><ChevronLeft size={14} /></button>
        <span style={{ fontSize: isMobile ? 11 : 14, fontWeight: 600, color: "#fff", padding: "0 2px", whiteSpace: "nowrap" }}>{isMobile ? format(selectedDate, "d.MM", { locale: de }) : shortDate}</span>
        <button onClick={() => onDateChange(addDays(selectedDate, 1))} style={{ width: 28, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", background: "transparent", border: "none", cursor: "pointer" }}><ChevronRight size={14} /></button>
      </div>

      {/* Time - hide on mobile */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", height: "100%", borderRight: "1px solid #2a2a2a" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", padding: "0 12px", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>{time}</span>
        </div>
      )}

      {/* Right icons */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", height: "100%" }}>
        <IcoBtn borderL onClick={onOpenRecurring}><Repeat size={16} /></IcoBtn>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", padding: "0 12px", height: "100%", borderLeft: "1px solid #2a2a2a" }}>
            <Users size={14} style={{ color: "#666", marginRight: 6 }} />
            <span style={{ fontSize: 13, color: "#888" }}>
              <span style={{ fontWeight: 700, color: "#fff" }}>{totalReservations}</span>/{totalGuests}
            </span>
          </div>
        )}
        <IcoBtn borderL onClick={async () => { await signOut(); navigate("/backstage/login", { replace: true }); }}><LogOut size={16} /></IcoBtn>
      </div>
    </div>
  );
};
