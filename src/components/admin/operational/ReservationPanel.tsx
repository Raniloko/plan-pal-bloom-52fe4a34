import { useMemo, useState } from "react";
import { Bell, CheckCheck, Check, PauseCircle, Users, AlertTriangle, Clock, Send, Ban, Filter } from "lucide-react";
import { LegendDialog } from "./LegendDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ResRow {
  id: string;
  time: string;
  offset: string;
  guests: number;
  name: string;
  tableRef: string;
  icon: "ob" | "double" | "single" | "chkps" | "none";
  highlighted: boolean;
  status: "confirmed" | "pending" | "checked_in" | "checked_out" | "cancelled";
  overdue: boolean;
}

interface WaitlistEntry {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  desired_date: string;
  desired_time: string;
  area: string;
  status: string | null;
  created_at: string | null;
  notified_at: string | null;
}

interface Props {
  rows: ResRow[];
  totalGuests: number;
  selectedRowId: string | null;
  onRowClick: (row: ResRow) => void;
  onNewClick: () => void;
  waitlist: WaitlistEntry[];
  onRefreshWaitlist: () => void;
  durationMin?: number;
  billardAvailable?: { free: number; total: number };
  isMobile?: boolean;
}

type SubTab = "platziert" | "bevorstehend" | "achtung";

export const ReservationPanel = ({ rows, totalGuests, selectedRowId, onRowClick, onNewClick, waitlist = [], onRefreshWaitlist, durationMin: propDuration, billardAvailable, isMobile = false }: Props) => {
  const [resTab, setResTab] = useState<"res" | "wait">("res");
  const [subTab, setSubTab] = useState<SubTab>("bevorstehend");
  const [notifying, setNotifying] = useState<string | null>(null);

  const handleNotify = async (entry: WaitlistEntry) => {
    setNotifying(entry.id);
    try {
      const res = await supabase.functions.invoke("admin-actions", {
        body: { action: "notify_waitlist", waitlist_id: entry.id },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`Benachrichtigung an ${entry.guest_name} gesendet`);
      onRefreshWaitlist();
    } catch (e: any) {
      toast.error(e?.message || "Fehler beim Benachrichtigen");
    }
    setNotifying(null);
  };

  const DURATION_MIN = propDuration || 120;
  const platziert = useMemo(() => rows.filter(r => r.status === "checked_in"), [rows]);
  const bevorstehend = useMemo(() => rows.filter(r => (r.status === "confirmed" || r.status === "pending") && !r.overdue), [rows]);
  // Achtung: overdue + cancelled
  const achtung = useMemo(() => rows.filter(r => r.overdue || r.status === "cancelled"), [rows]);

  const filtered = subTab === "platziert" ? platziert : subTab === "achtung" ? achtung : bevorstehend;

  const subTabs: { key: SubTab; label: string; count: number; color: string; icon: React.ReactNode }[] = [
    { key: "platziert", label: "Platziert", count: platziert.length, color: "#2a7a2a", icon: <CheckCheck size={8} /> },
    { key: "bevorstehend", label: "Bevorsteh.", count: bevorstehend.length, color: "#555", icon: <Users size={8} /> },
    { key: "achtung", label: "Achtung", count: achtung.length, color: "#cc5500", icon: <AlertTriangle size={8} /> },
  ];

  const renderIcon = (icon: ResRow["icon"], status?: ResRow["status"]) => {
    if (status === "cancelled") return <Ban size={15} color="#cc2222" />;
    switch (icon) {
      case "ob": return <span style={{ background: "#e07820", color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 2 }}>OB</span>;
      case "double": return <CheckCheck size={15} color="#2a7a2a" />;
      case "single": return <Check size={15} color="#2a7a2a" />;
      case "chkps": return <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Check size={13} color="#2a7a2a" /><PauseCircle size={13} color="#888" /></span>;
      default: return null;
    }
  };

  const areaLabel = (area: string) => {
    const map: Record<string, string> = { billard: "Billard", restaurant: "Restaurant", vip: "VIP", hauptbereich: "Hauptbereich", podest: "Podest", fenster: "Fenster" };
    return map[area] || area;
  };

  return (
    <div style={{
      width: isMobile ? "100%" : 390, minWidth: isMobile ? undefined : 390, background: "#f2f2f2",
      borderRight: isMobile ? "none" : "1px solid #ddd",
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
          Reservierungen
        </button>
        <button onClick={() => setResTab("wait")} style={{
          padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          background: resTab === "wait" ? "rgba(255,255,255,0.12)" : "transparent",
          color: resTab === "wait" ? "#fff" : "#666",
        }}>
          <span style={{ background: "#e07820", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{waitlist.length}</span>
          Warteliste
        </button>
        <button onClick={onNewClick} style={{
          marginLeft: "auto", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: "#c9a84c", color: "#111", border: "none", cursor: "pointer",
        }}>+ Neu</button>
      </div>


      {resTab === "res" ? (
        <>
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
          <div style={{ display: "flex", alignItems: "center", padding: "6px 14px", borderBottom: "1px solid #ddd", background: "#f2f2f2", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#444" }}>Uhrzeit ↕ Gast</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#444" }}>Name</span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={12} color="#888" />
              <LegendDialog />
              <Bell size={12} color="#888" />
            </span>
          </div>

          {/* Summary */}
          <div style={{ display: "flex", alignItems: "center", padding: "6px 14px", borderBottom: "1px solid #e0e0e0", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#333" }}>ÜBERSICHT</span>
            <span style={{ fontSize: 10, color: "#777" }}>Gesamt {filtered.length}</span>
            <span style={{ fontSize: 10, color: "#777", display: "flex", alignItems: "center", gap: 3 }}><Users size={9} /> {filtered.reduce((s, r) => s + r.guests, 0)}</span>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.map(r => {
              const sel = r.id === selectedRowId;
              const isCancelled = r.status === "cancelled";
              const borderL = isCancelled ? "#cc2222" : r.overdue ? "#cc3300" : r.status === "checked_in" ? "#2a7a2a" : sel ? "#c9a84c" : "transparent";
              const bg = sel ? "#eaeaea" : isCancelled ? "#fef2f2" : r.overdue ? "#fef2f2" : r.status === "checked_in" ? "#edf4ed" : "#fff";
              return (
                <div key={r.id} onClick={() => onRowClick(r)}
                  draggable={!isCancelled && r.status !== "checked_in"}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("reservationId", r.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  style={{
                  display: "grid", gridTemplateColumns: "70px 28px 1fr 36px",
                  minHeight: 58, borderBottom: "1px solid #e0e0e0",
                  borderLeft: `3px solid ${borderL}`, background: bg,
                  padding: "0 14px 0 11px", alignItems: "center", cursor: isCancelled ? "default" : "grab",
                  opacity: isCancelled ? 0.6 : 1,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isCancelled ? "#cc2222" : r.overdue ? "#cc3300" : "#111" }}>{r.time}</div>
                    <div style={{ fontSize: 10, color: isCancelled ? "#cc2222" : r.overdue ? "#cc3300" : "#999", fontWeight: r.overdue ? 700 : 400 }}>
                      {isCancelled ? "Storniert" : r.overdue ? r.offset : r.status === "checked_in" ? (() => {
                        const [h, m] = r.time.split(":").map(Number);
                        const start = new Date(); start.setHours(h, m, 0, 0);
                        const elapsed = Math.floor((Date.now() - start.getTime()) / 60000);
                        const remaining = DURATION_MIN - elapsed;
                        if (remaining <= 0) return <span style={{ color: "#cc3300", fontWeight: 700 }}>⏱ Überzogen</span>;
                        if (remaining <= 15) return <span style={{ color: "#e07820", fontWeight: 600 }}>⏱ {remaining} Min</span>;
                        const rh = Math.floor(remaining / 60);
                        const rm = remaining % 60;
                        return `⏱ ${rh > 0 ? `${rh}h ` : ""}${rm}min`;
                      })() : r.offset}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111", textAlign: "center" }}>{r.guests}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: isCancelled ? "#999" : "#111", textDecoration: isCancelled ? "line-through" : "none" }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: "#999" }}>{r.tableRef}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isCancelled ? <Ban size={15} color="#cc2222" /> : r.overdue ? <AlertTriangle size={15} color="#cc3300" /> : renderIcon(r.icon, r.status)}
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
        </>
      ) : (
        <>
          {/* Waitlist header */}
          <div style={{ display: "flex", alignItems: "center", padding: "8px 14px", borderBottom: "1px solid #ddd", background: "#f2f2f2", gap: 8 }}>
            <Clock size={12} color="#e07820" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#333" }}>WARTELISTE</span>
            <span style={{ fontSize: 10, color: "#777" }}>{waitlist.length} Einträge</span>
            <span style={{ marginLeft: "auto" }}>
              <LegendDialog />
            </span>
          </div>

          {/* Column header */}
          <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 60px 36px", padding: "6px 14px", borderBottom: "1px solid #ddd", background: "#f2f2f2" }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#333" }}>ZEIT</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#333" }}>NAME / BEREICH</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#333" }}>STATUS</span>
            <span />
          </div>

          {/* Waitlist rows */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {waitlist.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", color: "#999" }}>
                <Clock size={32} color="#ddd" style={{ marginBottom: 8 }} />
                <span style={{ fontSize: 14 }}>Warteliste ist leer</span>
                <span style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>Gäste werden hier angezeigt wenn alle Plätze belegt sind</span>
              </div>
            ) : (
              waitlist.map(w => {
                const isNotified = w.status === "notified";
                return (
                  <div key={w.id} style={{
                    display: "grid", gridTemplateColumns: "70px 1fr 60px 36px",
                    minHeight: 58, borderBottom: "1px solid #e0e0e0",
                    borderLeft: `3px solid ${isNotified ? "#3a8c3a" : "#e07820"}`,
                    background: isNotified ? "#edf4ed" : "#fff",
                    padding: "0 14px 0 11px", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{w.desired_time?.slice(0, 5)}</div>
                      <div style={{ fontSize: 10, color: "#666" }}>{w.desired_date}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{w.guest_name}</div>
                      <div style={{ fontSize: 10, color: "#666" }}>{areaLabel(w.area)} · {w.guest_phone}</div>
                    </div>
                    <div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10, color: "#fff",
                        background: isNotified ? "#3a8c3a" : "#e07820",
                      }}>
                        {isNotified ? "Benachr." : "Wartet"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      {!isNotified && (
                        <button
                          onClick={() => handleNotify(w)}
                          disabled={notifying === w.id}
                          title="Gast benachrichtigen"
                          style={{
                            width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                            background: "#fff", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", color: "#555",
                          }}
                        >
                          <Send size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
