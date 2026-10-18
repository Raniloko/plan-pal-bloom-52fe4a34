import { TableData, STATUS_FILLS } from "./types";
import { Users, Clock } from "lucide-react";
import { adm } from "@/components/admin/theme";

interface UnitListViewProps {
  tables: Record<string, TableData>;
  onTableClick?: (tableId: string, data: TableData) => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  free:     { label: "Frei",       bg: adm.surface2,    text: adm.text2,   border: adm.border },
  reserved: { label: "Reserviert", bg: adm.infoSoft,    text: adm.info,    border: adm.info },
  present:  { label: "Anwesend",   bg: adm.successSoft, text: adm.success, border: adm.success },
  blocked:  { label: "Gesperrt",   bg: adm.dangerSoft,  text: adm.danger,  border: adm.danger },
};

const UnitListView = ({ tables, onTableClick }: UnitListViewProps) => {
  const entries = Object.entries(tables).sort((a, b) => a[1].title.localeCompare(b[1].title));

  const free = entries.filter(([, d]) => d.status === "free");
  const reserved = entries.filter(([, d]) => d.status === "reserved");
  const present = entries.filter(([, d]) => d.status === "present");
  const blocked = entries.filter(([, d]) => d.status === "blocked");

  const groups = [
    { label: "Anwesend", items: present, dot: STATUS_FILLS.present.fill },
    { label: "Reserviert", items: reserved, dot: STATUS_FILLS.reserved.fill },
    { label: "Frei", items: free, dot: STATUS_FILLS.free.fill },
    { label: "Gesperrt", items: blocked, dot: STATUS_FILLS.blocked.fill },
  ].filter(g => g.items.length > 0);

  return (
    <div style={{
      width: "100%", height: "100%", overflow: "auto",
      background: adm.bg, fontFamily: "'DM Sans', sans-serif",
      padding: "16px 12px 96px",
    }}>
      {/* Summary bar */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none",
      }}>
        {[
          { label: "Gesamt", count: entries.length, color: adm.muted },
          { label: "Frei", count: free.length, color: STATUS_FILLS.free.fill },
          { label: "Reserviert", count: reserved.length, color: STATUS_FILLS.reserved.fill },
          { label: "Anwesend", count: present.length, color: STATUS_FILLS.present.fill },
          { label: "Gesperrt", count: blocked.length, color: STATUS_FILLS.blocked.fill },
        ].map(s => (
          <div key={s.label} style={{
            padding: "6px 12px", borderRadius: 999, flexShrink: 0,
            background: adm.surface, border: `1px solid ${adm.border}`,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
            <span style={{ fontSize: 12, color: adm.muted }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: adm.text }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Grouped list */}
      {groups.map(group => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: adm.muted, textTransform: "uppercase",
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
                    padding: "12px 14px", borderRadius: 12,
                    background: adm.surface,
                    border: `1px solid ${adm.border}`,
                    cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "background 0.15s, border-color 0.15s",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = adm.surface2;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = adm.surface;
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: STATUS_FILLS[data.status]?.fill || adm.muted,
                  }} />

                  {/* Title & guest */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: adm.text }}>
                      {data.title}
                    </div>
                    {data.guest && (
                      <div style={{ fontSize: 12, color: adm.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {data.guest}
                      </div>
                    )}
                  </div>

                  {/* Meta info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {data.startTime && (
                      <span style={{ fontSize: 11, color: adm.muted, display: "flex", alignItems: "center", gap: 3 }}>
                        <Clock size={10} /> {data.startTime}
                      </span>
                    )}
                    {data.pax && (
                      <span style={{ fontSize: 11, color: adm.muted, display: "flex", alignItems: "center", gap: 3 }}>
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
        <div style={{ textAlign: "center", padding: "60px 0", color: adm.muted, fontSize: 14 }}>
          Keine Einheiten in diesem Bereich
        </div>
      )}
    </div>
  );
};

export default UnitListView;
