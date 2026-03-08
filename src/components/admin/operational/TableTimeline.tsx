import { useMemo } from "react";
import { Clock, Users } from "lucide-react";

interface TimelineReservation {
  id: string;
  customer_name: string;
  reservation_time: string;
  guest_count: number;
  status: string;
}

interface Props {
  reservations: TimelineReservation[];
  currentTime: string; // HH:MM
}

const DURATION_HOURS = 2;

const STATUS_COLORS: Record<string, { bg: string; border: string; dot: string; text: string }> = {
  checked_in: { bg: "#e8f5e8", border: "#b8d8b8", dot: "#2a7a2a", text: "#2a7a2a" },
  confirmed: { bg: "#e8f0ff", border: "#b0c8f0", dot: "#3a7bd5", text: "#3a7bd5" },
  pending: { bg: "#fff3e0", border: "#f0c88a", dot: "#e07820", text: "#e07820" },
};

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (mins: number) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const TableTimeline = ({ reservations, currentTime }: Props) => {
  const sorted = useMemo(() =>
    [...reservations]
      .filter(r => r.status !== "cancelled" && r.status !== "checked_out")
      .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time)),
    [reservations]
  );

  if (sorted.length === 0) return null;

  // Calculate timeline range
  const nowMins = timeToMinutes(currentTime);
  const firstStart = Math.min(nowMins - 30, timeToMinutes(sorted[0].reservation_time.slice(0, 5)));
  const lastEnd = Math.max(
    nowMins + 60,
    ...sorted.map(r => timeToMinutes(r.reservation_time.slice(0, 5)) + DURATION_HOURS * 60)
  );
  const totalRange = lastEnd - firstStart;

  const getPercent = (mins: number) => ((mins - firstStart) / totalRange) * 100;

  // Generate hour marks
  const hourMarks: number[] = [];
  const startHour = Math.ceil(firstStart / 60);
  const endHour = Math.floor(lastEnd / 60);
  for (let h = startHour; h <= endHour; h++) hourMarks.push(h * 60);

  return (
    <div style={{ background: "#f8f8f8", border: "1px solid #eaeaea", borderRadius: 8, padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Clock size={13} color="#555" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>Tagesübersicht</span>
        <span style={{ fontSize: 10, color: "#999", marginLeft: "auto" }}>{sorted.length} Reservierung{sorted.length !== 1 ? "en" : ""}</span>
      </div>

      {/* Timeline bar */}
      <div style={{ position: "relative", height: 8, background: "#e0e0e0", borderRadius: 4, marginBottom: 6 }}>
        {/* Hour marks */}
        {hourMarks.map(hm => (
          <div key={hm} style={{
            position: "absolute", left: `${getPercent(hm)}%`, top: -2, width: 1, height: 12,
            background: "#ccc",
          }} />
        ))}
        {/* Reservation blocks */}
        {sorted.map(r => {
          const start = timeToMinutes(r.reservation_time.slice(0, 5));
          const end = start + DURATION_HOURS * 60;
          const colors = STATUS_COLORS[r.status] || STATUS_COLORS.confirmed;
          return (
            <div key={r.id} style={{
              position: "absolute",
              left: `${Math.max(0, getPercent(start))}%`,
              width: `${Math.min(100 - Math.max(0, getPercent(start)), getPercent(end) - getPercent(start))}%`,
              top: 0, height: "100%", borderRadius: 4,
              background: colors.dot, opacity: 0.6,
            }} />
          );
        })}
        {/* Current time indicator */}
        <div style={{
          position: "absolute", left: `${getPercent(nowMins)}%`, top: -4, width: 2, height: 16,
          background: "#cc2222", borderRadius: 1, zIndex: 2,
        }} />
      </div>

      {/* Hour labels */}
      <div style={{ position: "relative", height: 14, marginBottom: 10 }}>
        {hourMarks.map(hm => (
          <span key={hm} style={{
            position: "absolute", left: `${getPercent(hm)}%`, transform: "translateX(-50%)",
            fontSize: 9, color: "#999",
          }}>{minutesToTime(hm)}</span>
        ))}
      </div>

      {/* Reservation list */}
      {sorted.map(r => {
        const startMins = timeToMinutes(r.reservation_time.slice(0, 5));
        const endTime = minutesToTime(startMins + DURATION_HOURS * 60);
        const colors = STATUS_COLORS[r.status] || STATUS_COLORS.confirmed;
        const isActive = r.status === "checked_in";
        const isPast = startMins + DURATION_HOURS * 60 < nowMins;

        return (
          <div key={r.id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
            background: isActive ? colors.bg : isPast ? "#f5f5f5" : "#fff",
            border: `1px solid ${isActive ? colors.border : "#eaeaea"}`,
            borderRadius: 6, marginBottom: 4,
            opacity: isPast ? 0.5 : 1,
          }}>
            {/* Status dot */}
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: colors.dot, flexShrink: 0,
            }} />
            {/* Time */}
            <div style={{ minWidth: 80 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                {r.reservation_time.slice(0, 5)}
              </div>
              <div style={{ fontSize: 10, color: "#999" }}>bis {endTime}</div>
            </div>
            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.customer_name}
              </div>
              <div style={{ fontSize: 10, color: colors.text, fontWeight: 600 }}>
                {r.status === "checked_in" ? "Anwesend" : r.status === "pending" ? "Ausstehend" : "Bestätigt"}
              </div>
            </div>
            {/* Guest count */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#555", flexShrink: 0 }}>
              <Users size={11} /> {r.guest_count}
            </div>
          </div>
        );
      })}
    </div>
  );
};
