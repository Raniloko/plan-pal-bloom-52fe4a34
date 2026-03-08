import { useMemo, useState } from "react";
import { Bell, CheckCheck, Check, PauseCircle, Users, AlertTriangle } from "lucide-react";

export interface ResRow {
  id: string;
  time: string;
  offset: string;
  guests: number;
  name: string;
  tableRef: string;
  icon: "ob" | "double" | "single" | "chkps" | "none";
  highlighted: boolean;
}

interface Props {
  rows: ResRow[];
  totalGuests: number;
  selectedRowId: string | null;
  onRowClick: (row: ResRow) => void;
  onNewClick: () => void;
}

type SubTab = "platziert" | "bevorstehend" | "achtung";

export const ReservationPanel = ({ rows, totalGuests, selectedRowId, onRowClick, onNewClick }: Props) => {
  const [resTab, setResTab] = useState<"res" | "wait">("res");
  const [subTab, setSubTab] = useState<SubTab>("bevorstehend");

  const platziert = useMemo(() => rows.filter(r => ["double", "single", "chkps"].includes(r.icon)), [rows]);
  const bevorstehend = useMemo(() => rows.filter(r => ["none", "ob"].includes(r.icon)), [rows]);
  const achtung = useMemo(() => rows.filter(r => r.highlighted && !["double", "single", "chkps"].includes(r.icon)), [rows]);

  const filtered = subTab === "platziert" ? platziert : subTab === "achtung" ? achtung : bevorstehend;

  const subTabs: { key: SubTab; label: string; count: number; color: string; icon: React.ReactNode }[] = [
    { key: "platziert", label: "Platziert", count: platziert.length, color: "#2a7a2a", icon: <CheckCheck size={8} /> },
    { key: "bevorstehend", label: "Bevorsteh.", count: bevorstehend.length, color: "#555", icon: <Users size={8} /> },
    { key: "achtung", label: "Achtung", count: achtung.length, color: "#cc5500", icon: <AlertTriangle size={8} /> },
  ];

  const renderIcon = (icon: ResRow["icon"]) => {
    switch (icon) {
      case "ob": return <span style={{ background: "#e07820", color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 2 }}>OB</span>;
      case "double": return <CheckCheck size={15} color="#2a7a2a" />;
      case "single": return <Check size={15} color="#2a7a2a" />;
      case "chkps": return <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Check size={13} color="#2a7a2a" /><PauseCircle size={13} color="#888" /></span>;
      default: return null;
    }
  };

  return (
    <div style={{
      width: 390, minWidth: 390, background: "#f2f2f2", borderRight: "1px solid #ddd",
      display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header tabs */}
      <div style={{ display: "flex", alignItems: "center", height: 42, background: "#1e1e1e", borderBottom: "1px solid #2a2a2a", padding: "0 10px", gap: 4 }}>
        <button onClick={() => setResTab("res")} style={{
          padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          background: resTab === "res" ? "rgba(255,255,255,0.12)" : "transparent",
          color: resTab === "res" ? "#fff" : "#666",
        }}>
          <span style={{ background: "#3a8c3a", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{rows.length}</span>
          Reservierungsliste
        </button>
        <button onClick={() => setResTab("wait")} style={{
          padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
          background: resTab === "wait" ? "rgba(255,255,255,0.12)" : "transparent",
          color: resTab === "wait" ? "#fff" : "#666",
        }}>Warteliste</button>
        <button onClick={onNewClick} style={{
          marginLeft: "auto", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: "#c9a84c", color: "#111", border: "none", cursor: "pointer",
        }}>+ Neu</button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", alignItems: "center", background: "#f2f2f2", borderBottom: "2px solid #ddd", padding: "0 12px" }}>
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "10px 12px",
            fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
            background: "transparent",
            color: subTab === t.key ? "#111" : "#888",
            borderBottom: subTab === t.key ? "2px solid #111" : "2px solid transparent",
            marginBottom: -2,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: "#fff", padding: "1px 6px", borderRadius: 10,
              background: subTab === t.key ? "#333" : t.color,
              display: "flex", alignItems: "center", gap: 2,
            }}>
              {t.icon} {t.count}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Column header */}
      <div style={{ display: "grid", gridTemplateColumns: "70px 28px 1fr 36px", padding: "6px 14px", borderBottom: "1px solid #ddd", background: "#f2f2f2" }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#444" }}>UHRZEIT</span>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#444", textAlign: "center" }}>P</span>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#444" }}>NAME / TISCH</span>
        <span style={{ display: "flex", justifyContent: "center" }}><Bell size={12} color="#888" /></span>
      </div>

      {/* Meal label */}
      <div style={{ display: "flex", alignItems: "center", padding: "6px 14px", borderBottom: "1px solid #e0e0e0", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#333" }}>ABENDESSEN</span>
        <span style={{ fontSize: 10, color: "#777" }}>Gesamt {filtered.length}</span>
        <span style={{ fontSize: 10, color: "#777", display: "flex", alignItems: "center", gap: 3 }}><Users size={9} /> {filtered.reduce((s, r) => s + r.guests, 0)}</span>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.map(r => {
          const sel = r.id === selectedRowId;
          const borderL = r.highlighted ? "#2a7a2a" : sel ? "#c9a84c" : "transparent";
          const bg = sel ? "#eaeaea" : r.highlighted ? "#edf4ed" : "#fff";
          return (
            <div key={r.id} onClick={() => onRowClick(r)} style={{
              display: "grid", gridTemplateColumns: "70px 28px 1fr 36px",
              minHeight: 58, borderBottom: "1px solid #e0e0e0",
              borderLeft: `3px solid ${borderL}`, background: bg,
              padding: "0 14px 0 11px", alignItems: "center", cursor: "pointer",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{r.time}</div>
                <div style={{ fontSize: 10, color: "#999" }}>{r.offset}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111", textAlign: "center" }}>{r.guests}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#111" }}>{r.name}</div>
                <div style={{ fontSize: 10, color: "#999" }}>{r.tableRef}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {renderIcon(r.icon)}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", color: "#999" }}>
            <span style={{ fontSize: 14 }}>Keine Einträge</span>
          </div>
        )}
      </div>
    </div>
  );
};
