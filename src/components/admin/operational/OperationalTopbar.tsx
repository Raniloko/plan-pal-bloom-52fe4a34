import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  CalendarDays, ChevronLeft, ChevronRight, Cloud, BarChart2,
  Users, User, Timer, Clock, ClipboardList, Menu,
} from "lucide-react";

interface Props {
  totalReservations: number;
  totalGuests: number;
}

const Div = () => <div style={{ width: 1, alignSelf: "stretch", background: "#2a2a2a" }} />;

const IcoBtn = ({ children, borderL }: { children: React.ReactNode; borderL?: boolean }) => (
  <button style={{
    width: 38, height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    color: "#666", background: "transparent", border: "none",
    borderLeft: borderL ? "1px solid #2a2a2a" : undefined, cursor: "pointer",
  }}
    onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "#1e1e1e"; }}
    onMouseLeave={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}
  >
    {children}
  </button>
);

export const OperationalTopbar = ({ totalReservations, totalGuests }: Props) => {
  const [time, setTime] = useState("");
  const shortDate = format(new Date(), "EEE., d MMM", { locale: de });

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", height: 52, minHeight: 52,
      background: "#111111", borderBottom: "1px solid #2a2a2a",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* A – Hamburger + Q logo */}
      <button style={{ width: 36, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", background: "transparent", border: "none", cursor: "pointer" }}>
        <Menu size={18} />
      </button>
      <Div />
      <div style={{
        width: 32, height: 32, margin: "0 8px", borderRadius: 6,
        background: "#f5a623", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 700, fontSize: 18, cursor: "pointer",
      }}>Q</div>
      <Div />

      {/* B – Jetzt */}
      <button style={{
        display: "flex", alignItems: "center", gap: 6, padding: "0 12px", height: "100%",
        fontSize: 13, fontWeight: 600, color: "#fff", background: "transparent", border: "none",
        borderRight: "1px solid #2a2a2a", cursor: "pointer",
      }}>
        <CalendarDays size={14} /> Jetzt
      </button>

      {/* C – Date nav */}
      <div style={{ display: "flex", alignItems: "center", height: "100%", borderRight: "1px solid #2a2a2a" }}>
        <button style={{ width: 28, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", background: "transparent", border: "none", cursor: "pointer" }}><ChevronLeft size={14} /></button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", padding: "0 4px", whiteSpace: "nowrap" }}>{shortDate}</span>
        <button style={{ width: 28, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", background: "transparent", border: "none", cursor: "pointer" }}><ChevronRight size={14} /></button>
      </div>

      {/* D – Meal */}
      <div style={{ display: "flex", alignItems: "center", height: "100%", borderRight: "1px solid #2a2a2a" }}>
        <button style={{ width: 22, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", background: "transparent", border: "none", cursor: "pointer" }}><ChevronLeft size={12} /></button>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#fff", padding: "0 4px" }}>Abendessen</span>
        <button style={{ width: 22, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", background: "transparent", border: "none", cursor: "pointer" }}><ChevronRight size={12} /></button>
      </div>

      {/* E – Time */}
      <div style={{ display: "flex", alignItems: "center", height: "100%", borderRight: "1px solid #2a2a2a" }}>
        <button style={{ width: 22, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", background: "transparent", border: "none", cursor: "pointer" }}><ChevronLeft size={12} /></button>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", padding: "0 8px", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>{time}</span>
        <button style={{ width: 22, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", background: "transparent", border: "none", cursor: "pointer" }}><ChevronRight size={12} /></button>
      </div>

      {/* F – Right icons */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", height: "100%" }}>
        <IcoBtn borderL><Cloud size={16} /></IcoBtn>
        <IcoBtn borderL><BarChart2 size={16} /></IcoBtn>
        <div style={{ display: "flex", alignItems: "center", padding: "0 12px", height: "100%", borderLeft: "1px solid #2a2a2a" }}>
          <Users size={14} style={{ color: "#666", marginRight: 6 }} />
          <span style={{ fontSize: 13, color: "#888" }}>
            <span style={{ fontWeight: 700, color: "#fff" }}>{totalReservations}</span>/{totalGuests}
          </span>
        </div>
        <IcoBtn borderL><User size={16} /></IcoBtn>
        <IcoBtn borderL><Timer size={16} /></IcoBtn>
        <IcoBtn borderL><Clock size={16} /></IcoBtn>
        <IcoBtn borderL><ClipboardList size={16} /></IcoBtn>
      </div>
    </div>
  );
};
