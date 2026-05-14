import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { RondoFloorPlan, UnitListView } from "@/components/admin/floorplan";
import { useIsMobile } from "@/hooks/use-mobile";
import type { TableData, FloorArea } from "@/components/admin/floorplan";
import {
  OperationalTopbar,
  OperationalAreaTabs,
  ReservationPanel,
  OperationalSlidePanel,
  SettingsDialog,
  NotificationsPanel,
  RecurringBookingDialog,
} from "@/components/admin/operational";
import type { ColorMode, ViewMode } from "@/components/admin/operational/OperationalAreaTabs";
import type { ResRow, PanelData } from "@/components/admin/operational";

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
  checked_in_at?: string | null;
}

interface Unit {
  id: string;
  name: string;
  area: string;
  status: string | null;
  notes: string | null;
  capacity?: number | null;
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

const OperationalView = () => {
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");
  const [activeArea, setActiveArea] = useState<FloorArea>("hauptbereich");
  const [showLabels, setShowLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [colorMode, setColorMode] = useState<ColorMode>("status");
  const [viewMode, setViewMode] = useState<ViewMode>("floorplan");
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelData, setPanelData] = useState<PanelData | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);

  const [durationMin, setDurationMin] = useState(120);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const load = useCallback(async () => {
    try {
      const res = await supabase.functions.invoke("admin-actions", {
        body: { action: "fetch_dashboard", date: dateStr },
      });
      if (res.error) throw res.error;
      const d = res.data;
      if (d?.error) { console.error("Dashboard fetch error:", d.error); return; }
      setReservations((d.reservations as Reservation[]) || []);
      setUnits((d.units as Unit[]) || []);
      setWaitlist((d.waitlist as WaitlistEntry[]) || []);

      const settingsRes = await supabase.functions.invoke("admin-actions", {
        body: { action: "get_settings" },
      });
      if (settingsRes.data?.settings?.reservation_duration) {
        setDurationMin(Number(settingsRes.data.settings.reservation_duration) || 120);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    }
    setLoading(false);
  }, [dateStr]);

  useEffect(() => {
    load();
    // Only subscribe to units (non-PII) via Realtime; reservations/waitlist/notifications removed for security
    const ch = supabase
      .channel("op-view")
      .on("postgres_changes", { event: "*", schema: "public", table: "units" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  // Include cancelled in rows for "Achtung" tab
  const rows: ResRow[] = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    return reservations
      .filter(r => r.status !== "checked_out")
      .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
      .map(r => {
        const unit = r.unit_id ? units.find(u => u.id === r.unit_id) : undefined;
        const [h, m] = r.reservation_time.split(":").map(Number);
        const start = new Date(dateStr); start.setHours(h, m);
        const isCheckedIn = r.status === "checked_in";
        const isCancelled = r.status === "cancelled";
        const minutesOverdue = (now.getTime() - start.getTime()) / 60000;
        const isOverdue = isToday && !isCheckedIn && !isCancelled && (r.status === "confirmed" || r.status === "pending") && minutesOverdue >= 10;

        let icon: ResRow["icon"] = "none";
        if (r.status === "pending") icon = "ob";
        else if (isCheckedIn) icon = "double";
        else if (r.status === "confirmed") icon = "single";

        let offset = "";
        if (isOverdue) {
          offset = `+${Math.floor(minutesOverdue)} Min`;
        }

        return {
          id: r.id,
          time: r.reservation_time.slice(0, 5),
          offset,
          guests: r.guest_count,
          name: r.customer_name,
          tableRef: unit ? `${unit.area.slice(0, 2)}. / ${unit.name.replace(/\D/g, "")}` : r.zone,
          icon,
          highlighted: isCheckedIn || isOverdue,
          status: r.status as ResRow["status"],
          overdue: isOverdue,
        };
      });
  }, [reservations, units, dateStr]);

  const totalGuests = rows.filter(r => r.status !== "cancelled").reduce((s, r) => s + r.guests, 0);

  // Billard availability
  const billardAvailable = useMemo(() => {
    const total = 8;
    const occupiedBillard = reservations.filter(r =>
      r.zone === "billard" && r.status !== "cancelled" && r.status !== "checked_out"
    ).length;
    return { free: Math.max(0, total - occupiedBillard), total };
  }, [reservations]);

  // Toast notification for overdue reservations
  const notifiedOverdueRef = useRef<Set<string>>(new Set());
  const notifiedExceededRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const now = new Date();
    const overdueRows = rows.filter(r => r.overdue);
    overdueRows.forEach(r => {
      if (!notifiedOverdueRef.current.has(r.id)) {
        notifiedOverdueRef.current.add(r.id);
        toast.warning(`⚠️ ${r.name} ist ${r.offset} überfällig!`, {
          description: `Reservierung um ${r.time} · ${r.guests} Pers. – Noch nicht eingecheckt`,
          duration: 10000,
        });
      }
    });
    notifiedOverdueRef.current.forEach(id => {
      if (!overdueRows.find(r => r.id === id)) notifiedOverdueRef.current.delete(id);
    });

    const seatedRows = rows.filter(r => r.status === "checked_in");
    seatedRows.forEach(r => {
      const [h, m] = r.time.split(":").map(Number);
      const start = new Date(dateStr);
      start.setHours(h, m, 0, 0);
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 60000);
      if (elapsed >= durationMin && !notifiedExceededRef.current.has(r.id)) {
        notifiedExceededRef.current.add(r.id);
        const overBy = elapsed - durationMin;
        toast.error(`⏱ ${r.name} hat die Reservierungsdauer überschritten!`, {
          description: `Seit ${overBy} Min überzogen · Tisch ${r.tableRef} · ${r.guests} Pers.`,
          duration: 15000,
        });
      }
    });
    notifiedExceededRef.current.forEach(id => {
      if (!seatedRows.find(r => r.id === id)) notifiedExceededRef.current.delete(id);
    });
  }, [rows, durationMin, dateStr]);

  // Faster polling to compensate for Realtime removal on PII tables
  useEffect(() => {
    const interval = setInterval(() => load(), 15000);
    return () => clearInterval(interval);
  }, [load]);

  const floorTables = useMemo(() => {
    const map: Record<string, TableData> = {};
    const toFpId = (unit: { name: string; area: string }): string => {
      const name = unit.name.toLowerCase().trim();
      const digits = name.replace(/[^0-9]/g, "");
      if (unit.area === "salitos") return digits ? "s" + digits : "";
      if (unit.area === "vip") {
        // "Tisch 101..106" → vip1..vip6
        const n = parseInt(digits, 10);
        if (!isNaN(n)) return "vip" + (n > 100 ? n - 100 : n);
        return "";
      }
      if (name.startsWith("billard")) return "bt" + digits;
      if (name.startsWith("tisch f")) return "f" + digits;
      if (name.startsWith("tisch")) return "t" + digits;
      return "";
    };
    reservations.forEach(r => {
      if (!r.unit_id) return;
      if (r.status === "cancelled" || r.status === "checked_out") return;
      const unit = units.find(u => u.id === r.unit_id);
      if (!unit) return;
      const fpId = toFpId(unit);
      if (!fpId) return;
      const isPresent = r.status === "checked_in";
      map[fpId] = {
        id: fpId, title: unit.name,
        status: isPresent ? "present" : "reserved",
        guest: r.customer_name, startTime: r.reservation_time.slice(0, 5),
        pax: r.guest_count, reservationId: r.id,
      };
    });
    units.forEach(u => {
      if (u.status !== "blocked") return;
      const fpId = toFpId(u);
      if (fpId && !map[fpId]) map[fpId] = { id: fpId, title: u.name, status: "blocked" };
    });
    return map;
  }, [reservations, units]);

  const areaToZone = (area: string): string => {
    const map: Record<string, string> = { billard: "billard", kicker: "billard", dart: "billard", restaurant: "hauptbereich" };
    return map[area] || area;
  };

  const handleTableClick = (_id: string, data: TableData) => {
    const unit = units.find(u => u.name.toLowerCase() === data.title.toLowerCase());
    const reservation = data.reservationId ? reservations.find(r => r.id === data.reservationId) : undefined;
    // Get all reservations for this unit today
    const unitDayReservations = unit
      ? reservations.filter(r => r.unit_id === unit.id && r.status !== "checked_out")
      : [];
    setPanelData({
      tableLabel: data.title,
      guest: data.guest, startTime: data.startTime, endTime: data.endTime,
      pax: data.pax, reservationId: data.reservationId,
      status: data.status, unitId: unit?.id, unitNotes: unit?.notes || "",
      customerEmail: reservation?.customer_email,
      customerPhone: reservation?.customer_phone,
      zone: reservation?.zone || (unit ? areaToZone(unit.area) : undefined),
      checkedInAt: reservation?.checked_in_at ?? null,
      unitDayReservations: unitDayReservations.map(r => ({
        id: r.id, customer_name: r.customer_name, customer_phone: r.customer_phone,
        customer_email: r.customer_email, reservation_time: r.reservation_time,
        guest_count: r.guest_count, status: r.status,
      })),
    });
    setSelectedRowId(null);
    setPanelOpen(true);
  };

  const handleRowClick = (row: ResRow) => {
    const reservation = reservations.find(r => r.id === row.id);
    const unit = reservation?.unit_id ? units.find(u => u.id === reservation.unit_id) : undefined;
    setPanelData({
      tableLabel: row.tableRef,
      guest: row.name, startTime: row.time, pax: row.guests,
      status: row.highlighted ? "present" : "reserved",
      reservationId: row.id,
      customerEmail: reservation?.customer_email,
      customerPhone: reservation?.customer_phone,
      zone: reservation?.zone,
      unitId: unit?.id,
      unitNotes: unit?.notes || "",
      checkedInAt: reservation?.checked_in_at ?? null,
    });
    setSelectedRowId(row.id);
    setPanelOpen(true);
  };

  const handleNewReservation = () => {
    setPanelData({ tableLabel: "Neue Reservierung", status: "free", directBook: true });
    setSelectedRowId(null);
    setPanelOpen(true);
  };

  const handleNewWalkIn = () => {
    setPanelData({ tableLabel: "Walk-in Gast", status: "free", initialWalkIn: true });
    setSelectedRowId(null);
    setPanelOpen(true);
  };

  const handleWaitlistClick = (entry: { id: string; guest_name: string; guest_email: string; guest_phone: string; desired_date: string; desired_time: string; area: string }) => {
    setPanelData({
      tableLabel: `Warteliste · ${entry.guest_name}`,
      status: "free",
      directBook: true,
      zone: entry.area,
      initialGuest: entry.guest_name,
      initialEmail: entry.guest_email,
      initialPhone: entry.guest_phone,
      initialDate: entry.desired_date,
      initialTime: entry.desired_time?.slice(0, 5),
      waitlistId: entry.id,
    });
    setSelectedRowId(null);
    setPanelOpen(true);
  };

  const closePanel = () => { setPanelOpen(false); setSelectedRowId(null); };

  // Drag-and-drop: assign reservation to a table
  const handleTableDrop = async (_tableId: string, tableData: TableData, reservationId: string) => {
    const unit = units.find(u => u.name.toLowerCase() === tableData.title.toLowerCase());
    if (!unit) {
      toast.error("Tisch nicht gefunden");
      return;
    }
    try {
      const res = await supabase.functions.invoke("admin-actions", {
        body: { action: "assign_unit", reservation_id: reservationId, unit_id: unit.id },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`Reservierung auf ${tableData.title} zugewiesen`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Fehler bei der Zuweisung");
    }
  };

  if (loading) {
    return (
      <div style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif", background: "#f2f2f2", color: "#666", fontSize: 14,
      }}>
        Dashboard wird geladen...
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: "'DM Sans', sans-serif",
    }}>
      <OperationalTopbar
        totalReservations={rows.filter(r => r.status !== "cancelled").length}
        totalGuests={totalGuests}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenRecurring={() => setRecurringOpen(true)}
        isMobile={isMobile}
      />

      {/* Mobile tab bar */}
      {isMobile && (
        <div style={{
          display: "flex", height: 40, background: "#1e1e1e", borderBottom: "1px solid #2a2a2a",
        }}>
          <button onClick={() => setMobileTab("list")} style={{
            flex: 1, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: mobileTab === "list" ? "rgba(255,255,255,0.1)" : "transparent",
            color: mobileTab === "list" ? "#fff" : "#666",
            borderBottom: mobileTab === "list" ? "2px solid #c9a84c" : "2px solid transparent",
          }}>Reservierungen</button>
          <button onClick={() => setMobileTab("map")} style={{
            flex: 1, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: mobileTab === "map" ? "rgba(255,255,255,0.1)" : "transparent",
            color: mobileTab === "map" ? "#fff" : "#666",
            borderBottom: mobileTab === "map" ? "2px solid #c9a84c" : "2px solid transparent",
          }}>Grundriss</button>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* On mobile show only the active tab */}
        {(!isMobile || mobileTab === "list") && (
          <ReservationPanel
            rows={rows} totalGuests={totalGuests}
            selectedRowId={selectedRowId}
            onRowClick={handleRowClick}
            onNewClick={handleNewReservation}
            onWalkInClick={handleNewWalkIn}
            onWaitlistClick={handleWaitlistClick}
            waitlist={waitlist}
            onRefreshWaitlist={load}
            durationMin={durationMin}
            billardAvailable={billardAvailable}
            isMobile={isMobile}
          />
        )}

        {(!isMobile || mobileTab === "map") && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <OperationalAreaTabs
              activeArea={activeArea} onAreaChange={setActiveArea}
              showLabels={showLabels} onToggleLabels={() => setShowLabels(v => !v)}
              zoom={zoom} onZoomChange={setZoom}
              colorMode={colorMode} onColorModeChange={setColorMode}
              viewMode={viewMode} onViewModeChange={setViewMode}
            />
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              {viewMode === "list" ? (
                <UnitListView tables={floorTables} onTableClick={handleTableClick} />
              ) : (
                <RondoFloorPlan tables={floorTables} onTableClick={handleTableClick} onTableDrop={handleTableDrop} activeArea={activeArea} showLabels={showLabels} zoom={zoom} colorMode={colorMode} />
              )}
            </div>
          </div>
        )}
      </div>

      <OperationalSlidePanel
        open={panelOpen} data={panelData}
        onClose={closePanel}
        onBookNew={handleNewReservation}
        onRefresh={load}
        reservations={reservations.map(r => ({ id: r.id, unit_id: r.unit_id, status: r.status, customer_name: r.customer_name, reservation_time: r.reservation_time, guest_count: r.guest_count }))}
        isMobile={isMobile}
      />

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <RecurringBookingDialog
        open={recurringOpen}
        onClose={() => setRecurringOpen(false)}
        onSuccess={load}
        allUnits={units}
      />
    </div>
  );
};

export default OperationalView;
