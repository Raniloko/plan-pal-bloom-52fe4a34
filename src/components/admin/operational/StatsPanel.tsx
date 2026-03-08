import { X, TrendingUp, Users, CalendarCheck, AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  totalReservations: number;
  totalGuests: number;
  confirmedCount: number;
  pendingCount: number;
  checkedInCount: number;
  cancelledCount: number;
}

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) => (
  <div style={{ padding: 16, background: "#1a1a1a", borderRadius: 10, display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
    </div>
  </div>
);

export const StatsPanel = ({ open, onClose, totalReservations, totalGuests, confirmedCount, pendingCount, checkedInCount, cancelledCount }: Props) => {
  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998 }} />
      <div style={{
        position: "fixed", top: 52, right: 0, width: 360, height: "calc(100vh - 52px)",
        background: "#141414", borderLeft: "1px solid #2a2a2a", zIndex: 9999,
        display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #2a2a2a" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Tagesstatistiken</span>
          <button onClick={onClose} style={{ color: "#666", background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <StatCard icon={<CalendarCheck size={18} />} label="Reservierungen heute" value={totalReservations} color="#4ade80" />
          <StatCard icon={<Users size={18} />} label="Gäste erwartet" value={totalGuests} color="#60a5fa" />
          <StatCard icon={<TrendingUp size={18} />} label="Eingecheckt" value={checkedInCount} color="#a78bfa" />
          <StatCard icon={<CalendarCheck size={18} />} label="Bestätigt" value={confirmedCount} color="#22d3ee" />
          <StatCard icon={<AlertTriangle size={18} />} label="Ausstehend" value={pendingCount} color="#fbbf24" />
          <StatCard icon={<X size={18} />} label="Storniert" value={cancelledCount} color="#f87171" />

          <div style={{ marginTop: 20, padding: 16, background: "#1a1a1a", borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc", marginBottom: 12 }}>Auslastung nach Bereich</div>
            <div style={{ fontSize: 12, color: "#666" }}>Wird in Kürze verfügbar sein.</div>
          </div>
        </div>
      </div>
    </>
  );
};
