import { useMemo, useState } from "react";
import { Bell, CheckCheck, Check, PauseCircle, Users } from "lucide-react";
import type { ReservationRow } from "./types";

interface Props {
  rows: ReservationRow[];
  totalGuests: number;
  selectedRowId: string | null;
  onRowClick: (row: ReservationRow) => void;
  onNewClick: () => void;
}

type SubTab = "platziert" | "bevorstehend" | "achtung";

export const ReservationPanel = ({ rows, totalGuests, selectedRowId, onRowClick, onNewClick }: Props) => {
  const [activeResTab, setActiveResTab] = useState<"reservierungsliste" | "warteliste">("reservierungsliste");
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("bevorstehend");

  const platziert = useMemo(() => rows.filter(r => ["double-check", "check", "check-pause"].includes(r.status)), [rows]);
  const bevorstehend = useMemo(() => rows.filter(r => ["none", "ob"].includes(r.status)), [rows]);
  const achtung = useMemo(() => rows.filter(r => r.highlighted && r.status !== "double-check"), [rows]);

  const filteredRows = useMemo(() => {
    if (activeSubTab === "platziert") return platziert;
    if (activeSubTab === "achtung") return achtung;
    return bevorstehend;
  }, [activeSubTab, platziert, bevorstehend, achtung]);

  const subTabs = [
    { key: "platziert" as SubTab, label: "Platziert", count: platziert.length, color: "#2a7a2a" },
    { key: "bevorstehend" as SubTab, label: "Bevorsteh.", count: totalGuests, color: "#555" },
    { key: "achtung" as SubTab, label: "Achtung", count: achtung.length, color: "#cc5500" },
  ];

  const renderStatusIcon = (row: ReservationRow) => {
    switch (row.status) {
      case "ob":
        return <span className="bg-[#e07820] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">OB</span>;
      case "double-check":
        return <CheckCheck size={15} className="text-[#2a7a2a]" />;
      case "check":
        return <Check size={15} className="text-[#2a7a2a]" />;
      case "check-pause":
        return (
          <span className="flex items-center gap-0.5">
            <Check size={13} className="text-[#2a7a2a]" />
            <PauseCircle size={13} className="text-[#888]" />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-[390px] min-w-[390px] bg-[#f2f2f2] flex flex-col" style={{ borderRight: "1px solid #ddd", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header tabs */}
      <div className="flex items-center h-[44px] bg-[#1e1e1e] px-2.5 gap-1" style={{ borderBottom: "1px solid #2a2a2a" }}>
        <button
          onClick={() => setActiveResTab("reservierungsliste")}
          className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5"
          style={{
            background: activeResTab === "reservierungsliste" ? "rgba(255,255,255,0.12)" : "transparent",
            color: activeResTab === "reservierungsliste" ? "#fff" : "#666",
          }}
        >
          <span className="bg-[#3a8c3a] text-white text-[10px] font-bold px-1.5 py-px rounded-full">
            {rows.length}
          </span>
          Reservierungsliste
        </button>
        <button
          onClick={() => setActiveResTab("warteliste")}
          className="px-2.5 py-1 rounded-md text-xs font-semibold"
          style={{
            background: activeResTab === "warteliste" ? "rgba(255,255,255,0.12)" : "transparent",
            color: activeResTab === "warteliste" ? "#fff" : "#666",
          }}
        >
          Warteliste
        </button>
        <button
          onClick={onNewClick}
          className="ml-auto px-3 py-1 rounded-md text-[11px] font-bold"
          style={{ background: "#c9a84c", color: "#111" }}
        >
          + Neu
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center bg-[#f2f2f2] px-3" style={{ borderBottom: "2px solid #ddd" }}>
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className="flex items-center gap-1 py-2.5 px-3 text-[11px] font-semibold -mb-0.5 transition-colors"
            style={{
              color: activeSubTab === tab.key ? "#111" : "#888",
              borderBottom: `2px solid ${activeSubTab === tab.key ? "#111" : "transparent"}`,
            }}
          >
            <span
              className="text-[9px] font-bold text-white px-1.5 py-px rounded-full flex items-center gap-0.5"
              style={{ background: activeSubTab === tab.key && tab.key !== "achtung" ? "#333" : tab.color }}
            >
              <Users size={8} /> {tab.count}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Column header */}
      <div className="flex items-center bg-[#f2f2f2] px-3.5 py-1.5 gap-1.5" style={{ borderBottom: "1px solid #ddd" }}>
        <div className="grid flex-1" style={{ gridTemplateColumns: "70px 28px 1fr 36px" }}>
          <span className="text-[10px] font-bold uppercase text-[#444]">UHRZEIT</span>
          <span className="text-[10px] font-bold uppercase text-[#444] text-center">P</span>
          <span className="text-[10px] font-bold uppercase text-[#444]">NAME / TISCH</span>
          <span className="flex justify-center"><Bell size={12} className="text-[#888]" /></span>
        </div>
      </div>

      {/* Meal label */}
      <div className="flex items-center px-3.5 py-1.5 gap-2" style={{ borderBottom: "1px solid #e0e0e0" }}>
        <span className="text-[10px] font-bold uppercase text-[#333]">ABENDESSEN</span>
        <span className="text-[10px] text-[#777]">Gesamt {rows.length}</span>
        <span className="text-[10px] text-[#777] flex items-center gap-0.5"><Users size={9} /> {totalGuests}</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {filteredRows.map((r) => {
          const isSelected = r.id === selectedRowId;
          const borderLeftColor = r.highlighted ? "#2a7a2a" : isSelected ? "#c9a84c" : "transparent";
          const bg = isSelected ? "#eaeaea" : r.highlighted ? "#edf4ed" : "#fff";

          return (
            <div
              key={r.id}
              onClick={() => onRowClick(r)}
              className="grid cursor-pointer transition-colors hover:bg-[#f0f0f0]"
              style={{
                gridTemplateColumns: "70px 28px 1fr 36px",
                minHeight: 58,
                borderBottom: "1px solid #e0e0e0",
                borderLeft: `3px solid ${borderLeftColor}`,
                background: bg,
                paddingLeft: 11,
                paddingRight: 14,
                alignItems: "center",
              }}
            >
              <div>
                <div className="text-[13px] font-bold text-[#111]">{r.time}</div>
              </div>
              <div className="text-[13px] font-bold text-[#111] text-center">{r.guests}</div>
              <div>
                <div className="text-xs font-medium text-[#111]">{r.name}</div>
                <div className="text-[10px] text-[#999]">{r.table}</div>
              </div>
              <div className="flex items-center justify-center">
                {renderStatusIcon(r)}
              </div>
            </div>
          );
        })}
        {filteredRows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#999]">
            <span className="text-4xl mb-2 opacity-30">📅</span>
            <span className="text-sm">Keine Einträge</span>
          </div>
        )}
      </div>
    </div>
  );
};
