import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { RondoFloorPlan } from "@/components/admin/floorplan";
import type { TableData, TableStatus } from "@/components/admin/floorplan";

/* ── TYPES ── */
interface Reservation {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  zone: string;
  status: string;
  occasion: string;
  message: string | null;
  unit_id: string | null;
}

interface Unit {
  id: string;
  name: string;
  area: string;
  status: string | null;
  notes: string | null;
}

/* ── STATIC DATA ── */
const AREA_TABS = [
  { key: "billard", label: "1. Billiard Tisch" },
  { key: "salitos", label: "2. Salitos Lounge / Outdoor" },
  { key: "restaurant140", label: "3. Restaurant 140 Zoll" },
  { key: "restaurant75", label: "4. Restaurant 75 Zoll / Sport" },
  { key: "vip", label: "5. VIP Raum / Sport" },
];

const STATUS_PILL: Record<string, string> = {
  Frei: "bg-[#e8f5e8] text-[#2a7a2a] border-[#b8d8b8]",
  Reserviert: "bg-[#fff3e0] text-[#e07820] border-[#f0c88a]",
  Anwesend: "bg-[#e8f5e8] text-[#2a7a2a] border-[#b8d8b8]",
  Belegt: "bg-[#e8f0ff] text-[#3a6adb] border-[#a0c0ff]",
};

/* ── COMPONENT ── */
const OperationalView = () => {
  const [activeArea, setActiveArea] = useState("billard");
  const [activeResTab, setActiveResTab] = useState("reservierungsliste");
  const [activeSubTab, setActiveSubTab] = useState("bevorstehend");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<(TableData & { unitData?: Unit }) | null>(null);
  const [time, setTime] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [notes, setNotes] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");
  const dateLabel = format(new Date(), "EEEE, d. MMMM yyyy", { locale: de });
  const shortDate = format(new Date(), "EEE., d MMM", { locale: de });

  // Live clock
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(
        String(n.getHours()).padStart(2, "0") +
          ":" +
          String(n.getMinutes()).padStart(2, "0")
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ESC to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetch = async () => {
      const [r, u] = await Promise.all([
        supabase
          .from("reservations")
          .select("*")
          .eq("reservation_date", today)
          .neq("status", "cancelled"),
        supabase.from("units").select("*").order("position_index"),
      ]);
      setReservations((r.data as Reservation[]) || []);
      setUnits((u.data as Unit[]) || []);
    };
    fetch();
    const ch = supabase
      .channel("op-view")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => fetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "units" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [today]);

  // Build floor plan tables map
  const floorTables = useMemo(() => {
    const map: Record<string, TableData> = {};
    reservations.forEach((r) => {
      if (!r.unit_id) return;
      const unit = units.find((u) => u.id === r.unit_id);
      if (!unit) return;
      const name = unit.name.toLowerCase();
      let fpId = "";
      if (name.startsWith("tisch")) fpId = "t" + name.replace("tisch ", "").trim();
      else if (name.startsWith("billard")) fpId = "b" + name.replace("billard ", "").trim();
      if (!fpId) return;
      const now = new Date();
      const [h, m] = r.reservation_time.split(":").map(Number);
      const start = new Date(today);
      start.setHours(h, m);
      const isPresent = r.status === "confirmed" && now >= start;
      map[fpId] = {
        id: fpId,
        title: unit.name,
        status: (isPresent ? "present" : "reserved") as TableStatus,
        guest: r.customer_name,
        startTime: r.reservation_time,
        pax: r.guest_count,
        reservationId: r.id,
      };
    });
    units.forEach((u) => {
      if (u.status !== "blocked") return;
      const name = u.name.toLowerCase();
      let fpId = "";
      if (name.startsWith("tisch")) fpId = "t" + name.replace("tisch ", "").trim();
      else if (name.startsWith("billard")) fpId = "b" + name.replace("billard ", "").trim();
      if (fpId && !map[fpId]) map[fpId] = { id: fpId, title: u.name, status: "blocked" };
    });
    return map;
  }, [reservations, units, today]);

  // Reservation rows for the left panel
  const rows = useMemo(() => {
    return reservations
      .filter((r) => r.status !== "cancelled")
      .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time));
  }, [reservations]);

  const totalGuests = rows.reduce((s, r) => s + r.guest_count, 0);

  const handleTableClick = (tableId: string, data: TableData) => {
    const unit = units.find(
      (u) => u.name.toLowerCase() === data.title.toLowerCase()
    );
    setSelectedTable({ ...data, unitData: unit || undefined });
    setNotes(unit?.notes || "");
    setPanelOpen(true);
  };

  const handleRowClick = (r: Reservation) => {
    const unit = r.unit_id ? units.find((u) => u.id === r.unit_id) : undefined;
    setSelectedTable({
      id: r.id,
      title: unit?.name || r.zone,
      status: r.status === "confirmed" ? "reserved" : "free",
      guest: r.customer_name,
      startTime: r.reservation_time,
      pax: r.guest_count,
      reservationId: r.id,
      unitData: unit,
    });
    setNotes(unit?.notes || "");
    setPanelOpen(true);
  };

  const statusLabel = (s: TableData | null) => {
    if (!s) return "Frei";
    if (s.status === "present") return "Anwesend";
    if (s.status === "reserved") return "Reserviert";
    if (s.status === "blocked") return "Gesperrt";
    return "Frei";
  };

  /* ── ICON HELPERS ── */
  const TopbarDivider = () => <div className="w-px self-stretch bg-[#2a2a2a]" />;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ══════ TOPBAR ══════ */}
      <div className="flex items-center h-[52px] min-h-[52px] bg-[#111111] border-b border-[#2a2a2a]">
        {/* Section A */}
        <button className="w-9 h-full flex items-center justify-center text-[#aaa] text-lg hover:text-white">☰</button>
        <TopbarDivider />
        <div className="w-8 h-8 mx-2 rounded-md bg-[#f5a623] flex items-center justify-center text-white font-bold text-lg">Q</div>
        <TopbarDivider />

        {/* Section B - Jetzt */}
        <button className="flex items-center gap-1.5 px-2.5 text-[13px] font-semibold text-white hover:bg-[#1e1e1e] h-full">
          📅 Jetzt
        </button>
        <TopbarDivider />

        {/* Section C - Date nav */}
        <button className="w-7 h-full flex items-center justify-center text-[#666] text-lg hover:text-white">‹</button>
        <span className="text-sm font-semibold text-white px-1 whitespace-nowrap">{shortDate}</span>
        <button className="w-7 h-full flex items-center justify-center text-[#666] text-lg hover:text-white">›</button>
        <TopbarDivider />

        {/* Section D - Meal period */}
        <button className="w-[22px] h-full flex items-center justify-center text-[#666] hover:text-white">‹</button>
        <span className="text-[13px] font-medium text-white px-1">Abendessen</span>
        <button className="w-[22px] h-full flex items-center justify-center text-[#666] hover:text-white">›</button>
        <TopbarDivider />

        {/* Section E - Time */}
        <button className="w-[22px] h-full flex items-center justify-center text-[#666] hover:text-white">‹</button>
        <span className="text-sm font-bold text-white px-2 tabular-nums font-mono">{time}</span>
        <button className="w-[22px] h-full flex items-center justify-center text-[#666] hover:text-white">›</button>
        <TopbarDivider />

        {/* Right icons */}
        <div className="ml-auto flex items-center h-full">
          {["☁", "📊"].map((icon, i) => (
            <button key={i} className="w-[38px] h-full flex items-center justify-center text-[#666] text-base border-l border-[#2a2a2a] hover:text-white hover:bg-[#1e1e1e]">
              {icon}
            </button>
          ))}
          <div className="flex items-center px-3 border-l border-[#2a2a2a] h-full">
            <span className="text-[13px] text-[#888]">
              <span className="font-bold text-white">{rows.length}</span>/{totalGuests}
            </span>
          </div>
          {["👤", "⏱", "🕐", "📝"].map((icon, i) => (
            <button key={i} className="w-[38px] h-full flex items-center justify-center text-[#666] text-base border-l border-[#2a2a2a] hover:text-white hover:bg-[#1e1e1e]">
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ══════ AREA TABS BAR ══════ */}
      <div className="flex items-center h-[44px] min-h-[44px] bg-[#1e1e1e] border-b border-[#2a2a2a] overflow-x-auto scrollbar-hide">
        {AREA_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveArea(tab.key)}
            className={`relative px-5 h-full text-[13px] font-semibold border-r border-[#2a2a2a] whitespace-nowrap transition-colors ${
              activeArea === tab.key
                ? "text-white bg-white/[0.07]"
                : "text-[#666] hover:text-[#bbb] hover:bg-white/[0.03]"
            }`}
          >
            {tab.label}
            {activeArea === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        ))}
        <div className="ml-auto border-l border-[#2a2a2a] px-3.5 flex items-center h-full">
          <button className="text-xs text-[#666] px-2.5 py-1.5 border border-[#333] rounded-[5px] hover:text-[#bbb] hover:border-[#555]">
            Ansicht ändern
          </button>
        </div>
      </div>

      {/* ══════ MAIN AREA ══════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ── */}
        <div className="w-[390px] min-w-[390px] bg-[#f2f2f2] border-r border-[#ccc] flex flex-col">
          {/* Header tabs */}
          <div className="flex items-center h-[42px] bg-[#1e1e1e] border-b border-[#2a2a2a] px-2.5 gap-1">
            <button
              onClick={() => setActiveResTab("reservierungsliste")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                activeResTab === "reservierungsliste"
                  ? "bg-white/10 text-white"
                  : "text-[#666] hover:bg-white/5"
              }`}
            >
              <span className="bg-[#3a8c3a] text-white text-[10px] font-bold px-1.5 py-px rounded-full">
                {rows.length}
              </span>
              Reservierungsliste
            </button>
            <button
              onClick={() => setActiveResTab("warteliste")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                activeResTab === "warteliste"
                  ? "bg-white/10 text-white"
                  : "text-[#666] hover:bg-white/5"
              }`}
            >
              Warteliste
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center bg-[#f2f2f2] border-b-2 border-[#ddd] px-3">
            {[
              { key: "platziert", label: "Platziert", count: rows.filter((r) => r.status === "confirmed").length },
              { key: "bevorstehend", label: "Bevorsteh.", count: totalGuests },
              { key: "achtung", label: "Achtung", count: rows.filter((r) => r.status === "pending").length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                className={`flex items-center gap-1 py-2.5 px-3 text-[11px] font-semibold border-b-2 -mb-0.5 transition-colors ${
                  activeSubTab === tab.key
                    ? "text-[#111] border-[#111]"
                    : "text-[#888] border-transparent hover:text-[#555]"
                }`}
              >
                <span
                  className={`text-[9px] font-bold text-white px-1.5 py-px rounded-full ${
                    tab.key === "achtung" ? "bg-[#cc5500]" : activeSubTab === tab.key ? "bg-[#333]" : "bg-[#2a7a2a]"
                  }`}
                >
                  👤 {tab.count}
                </span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Column header */}
          <div className="flex items-center bg-[#f2f2f2] px-3.5 py-1.5 border-b border-[#ddd] gap-1.5">
            <span className="text-[10px] font-bold uppercase text-[#444]">UHRZEIT</span>
            <span className="text-[10px] text-[#aaa]">▼</span>
            <span className="text-[10px] font-bold uppercase text-[#444] ml-4">GAST</span>
            <span className="text-[10px] font-bold uppercase text-[#444] ml-1.5">NAME</span>
            <div className="ml-auto flex gap-2">
              {["⚙", "?", "🔔"].map((ic, i) => (
                <span key={i} className="text-[13px] text-[#888] cursor-pointer hover:text-[#333]">{ic}</span>
              ))}
            </div>
          </div>

          {/* Meal label */}
          <div className="flex items-center px-3.5 py-1.5 border-b border-[#e0e0e0] gap-2">
            <span className="text-[10px] font-bold uppercase text-[#333]">ABENDESSEN</span>
            <span className="text-[10px] text-[#777]">Gesamt {rows.length}</span>
            <span className="text-[10px] text-[#777]">👤 {totalGuests}</span>
          </div>

          {/* Reservation rows */}
          <div className="flex-1 overflow-y-auto">
            {rows.map((r, i) => {
              const isHighlighted = r.status === "confirmed";
              return (
                <div
                  key={r.id || i}
                  onClick={() => handleRowClick(r)}
                  className={`grid cursor-pointer border-b border-[#e0e0e0] min-h-[60px] px-3.5 gap-2 items-center transition-colors hover:bg-[#e8e8e8] ${
                    isHighlighted
                      ? "bg-[#e6f0e6] border-l-[3px] border-l-[#2a7a2a] pl-[11px]"
                      : ""
                  }`}
                  style={{ gridTemplateColumns: "76px 28px 1fr auto" }}
                >
                  <div>
                    <div className="text-[13px] font-bold text-[#111]">{r.reservation_time}</div>
                  </div>
                  <div className="text-[13px] font-bold text-[#111] text-center">{r.guest_count}</div>
                  <div>
                    <div className="text-xs font-medium text-[#111]">{r.customer_name}</div>
                    <div className="text-[10px] text-[#999]">{r.zone}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.status === "confirmed" && (
                      <span className="text-[#2a7a2a] text-sm font-bold">✓✓</span>
                    )}
                    {r.status === "pending" && (
                      <span className="bg-[#e07820] text-white text-[8px] font-bold px-1 py-0.5 rounded-sm">OB</span>
                    )}
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-[#999]">
                <span className="text-4xl mb-2 opacity-30">📅</span>
                <span className="text-sm">Keine Reservierungen</span>
              </div>
            )}
          </div>
        </div>

        {/* ── SVG FLOOR PLAN ── */}
        <div className="flex-1 relative overflow-hidden">
          <RondoFloorPlan tables={floorTables} onTableClick={handleTableClick} />
        </div>
      </div>

      {/* ══════ SLIDE-IN PANEL ══════ */}
      {panelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-[199]"
            onClick={() => setPanelOpen(false)}
          />
          {/* Panel */}
          <div
            className="fixed top-0 right-0 w-[420px] h-full bg-white border-l border-[#ddd] z-[200] flex flex-col animate-slide-in-right"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-[#f8f8f8] border-b border-[#eee] px-[18px] py-4">
              <div>
                <div className="text-base font-bold text-[#111]">{selectedTable?.title}</div>
                <div className="text-[11px] text-[#999]">
                  {selectedTable?.guest || "Kein Gast zugewiesen"}
                </div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="w-7 h-7 flex items-center justify-center bg-[#eee] border border-[#ddd] rounded text-[#666] text-sm hover:bg-[#cc2222] hover:text-white hover:border-[#cc2222] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Date + Status */}
            <div className="flex items-center justify-between px-[18px] py-2.5 border-b border-[#eee]">
              <span className="text-xs font-semibold text-[#333] flex items-center gap-2">
                📅 {dateLabel}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  STATUS_PILL[statusLabel(selectedTable)] || STATUS_PILL.Frei
                }`}
              >
                {statusLabel(selectedTable)}
              </span>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-[18px] py-3.5">
              {selectedTable?.guest ? (
                <div className="bg-[#f8f8f8] border border-[#eaeaea] rounded-lg p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-bold text-[#111]">
                      {selectedTable.startTime}
                    </span>
                    <span className="text-[11px] text-[#999]">
                      {selectedTable.pax} Pers.
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#111] mb-1">
                    {selectedTable.guest}
                  </div>
                  <div className="text-[10px] text-[#bbb] mb-3">
                    Buchungs-ID: #{selectedTable.reservationId?.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="flex gap-1.5">
                    {["Bearbeiten", "Mail", "Stornieren"].map((label) => (
                      <button
                        key={label}
                        className={`flex-1 py-1.5 rounded-[5px] border text-[10px] font-bold transition-colors ${
                          label === "Stornieren"
                            ? "border-[#e0e0e0] bg-white text-[#cc2222] hover:border-[#cc2222]"
                            : "border-[#e0e0e0] bg-white text-[#777] hover:border-[#333] hover:text-[#333]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-5xl opacity-20 mb-3">📅</span>
                  <span className="text-sm text-[#999]">Keine Reservierungen heute</span>
                  <span className="text-xs text-[#ccc] mt-1">
                    Dieser Tisch ist frei verfügbar
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#f8f8f8] border-t border-[#eee] px-[18px] py-3 flex flex-col gap-1.5">
              <button className="w-full py-2.5 bg-[#222] text-white text-[13px] font-bold rounded-[7px] hover:bg-black transition-colors">
                + Neue Reservierung
              </button>
              <div className="flex gap-1.5">
                {["Einchecken", "Sperren", "Mail senden"].map((l) => (
                  <button
                    key={l}
                    className="flex-1 py-2 bg-white border border-[#e0e0e0] text-[10px] font-bold text-[#777] rounded-md hover:border-[#333] hover:text-[#333] transition-colors"
                  >
                    {l}
                  </button>
                ))}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Interne Notiz (nicht für Gäste sichtbar)..."
                className="w-full h-[50px] bg-white border border-[#e0e0e0] rounded-md px-2.5 py-2 text-[11px] resize-none focus:border-[#aaa] focus:outline-none"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OperationalView;
