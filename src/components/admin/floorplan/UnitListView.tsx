import { TableData, STATUS_FILLS } from "./types";
import { Users, Clock, Lock, Circle } from "lucide-react";

interface UnitListViewProps {
  tables: Record<string, TableData>;
  onTableClick?: (tableId: string, data: TableData) => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  free:     { label: "Frei",      bg: "#f0f8f0", text: "#2a7a2a", border: "#b8d8b8" },
  reserved: { label: "Reserviert", bg: "#fff3e0", text: "#e07820", border: "#f0c88a" },
  present:  { label: "Anwesend",   bg: "#e8f5e8", text: "#1e8a38", border: "#a0d8a0" },
  blocked:  { label: "Gesperrt",   bg: "#fde8e8", text: "#cc2222", border: "#d8a0a0" },
};

const UnitListView = ({ tables, onTableClick }: UnitListViewProps) => {
  const entries = Object.entries(tables).sort((a, b) => a[1].title.localeCompare(b[1].title));

  const free = entries.filter(([, d]) => d.status === "free");
  const reserved = entries.filter(([, d]) => d.status === "reserved");
  const present = entries.filter(([, d]) => d.status === "present");
  const blocked = entries.filter(([, d]) => d.status === "blocked");

  const groups = [
    { label: "Anwesend", items: present, dot: "#1e8a38" },
    { label: "Reserviert", items: reserved, dot: "#e07820" },
    { label: "Frei", items: free, dot: "#2a7a2a" },
    { label: "Gesperrt", items: blocked, dot: "#cc2222" },
  ].filter(g => g.items.length > 0);

  return (
    <div style={{
      width: "100%", height: "100%", overflow: "auto",
      background: "#111111", fontFamily: "'DM Sans', sans-serif",
      padding: 20,
    }}>
      {/* Summary bar */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap",
      }}>
        {[
          { label: "Gesamt", count: entries.length, color: "#888" },
          { label: "Frei", count: free.length, color: "#2a7a2a" },
          { label: "Reserviert", count: reserved.length, color: "#e07820" },
          { label: "Anwesend", count: present.length, color: "#1e8a38" },
          { label: "Gesperrt", count: blocked.length, color: "#cc2222" },
        ].map(s => (
          <div key={s.label} style={{
            padding: "8px 16px", borderRadius: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
            <span style={{ fontSize: 12, color: "#999" }}>{s.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Grouped list */}
      {groups.map(group => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase",
            letterSpacing: "0.08em", marginBottom: 8, paddingLeft: 4,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: group.dot }} />
            {group.label} ({group.items.length})
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
            {group.items.map(([id, data]) => {
              const sc = STATUS_CONFIG[data.status] || STATUS_CONFIG.free;
              return (
                <button
                  key={id}
                  onClick={() => onTableClick?.(id, data)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "background 0.15s, border-color 0.15s",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: STATUS_FILLS[data.status]?.fill || "#666",
                  }} />

                  {/* Title & guest */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                      {data.title}
                    </div>
                    {data.guest && (
                      <div style={{ fontSize: 11, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {data.guest}
                      </div>
                    )}
                  </div>

                  {/* Meta info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {data.startTime && (
                      <span style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 3 }}>
                        <Clock size={10} /> {data.startTime}
                      </span>
                    )}
                    {data.pax && (
                      <span style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 3 }}>
                        <Users size={10} /> {data.pax}
                      </span>
                    )}
                    <span style={{
                      fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                      padding: "2px 8px", borderRadius: 10,
                      background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                    }}>
                      {sc.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {entries.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#666", fontSize: 14 }}>
          Keine Einheiten in diesem Bereich
        </div>
      )}
    </div>
  );
};

export default UnitListView;
