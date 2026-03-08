import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { RondoFloorPlan, UnitListView } from "@/components/admin/floorplan";
import type { TableData, FloorArea } from "@/components/admin/floorplan";
import {
  OperationalTopbar,
  OperationalAreaTabs,
  ReservationPanel,
  OperationalSlidePanel,
  SettingsDialog,
  StatsPanel,
  NotificationsPanel,
} from "@/components/admin/operational";
import type { ColorMode, ViewMode } from "@/components/admin/operational/OperationalAreaTabs";
import type { ResRow, PanelData } from "@/components/admin/operational";
import { Toaster } from "sonner";

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

  // New state for topbar features
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    }
    setLoading(false);
  }, [dateStr]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("op-view")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "units" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "waitlist" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const rows: ResRow[] = useMemo(() => {
    const now = new Date();
    return reservations
      .filter(r => r.status !== "cancelled" && r.status !== "checked_out")
      .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
      .map(r => {
        const unit = r.unit_id ? units.find(u => u.id === r.unit_id) : undefined;
        const [h, m] = r.reservation_time.split(":").map(Number);
        const start = new Date(dateStr); start.setHours(h, m);
        const isCheckedIn = r.status === "checked_in";
        const minutesOverdue = (now.getTime() - start.getTime()) / 60000;
        const isOverdue = !isCheckedIn && (r.status === "confirmed" || r.status === "pending") && minutesOverdue >= 10;

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

  const totalGuests = rows.reduce((s, r) => s + r.guests, 0);

  // Toast notification for overdue reservations
  const notifiedOverdueRef = useRef<Set<string>>(new Set());
  useEffect(() => {
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
    // Clean up IDs no longer overdue
    notifiedOverdueRef.current.forEach(id => {
      if (!overdueRows.find(r => r.id === id)) notifiedOverdueRef.current.delete(id);
    });
  }, [rows]);

  // Auto-refresh every 30s for overdue detection
  useEffect(() => {
    const interval = setInterval(() => load(), 30000);
    return () => clearInterval(interval);
  }, [load]);

  // Stats counts
  const confirmedCount = reservations.filter(r => r.status === "confirmed").length;
  const pendingCount = reservations.filter(r => r.status === "pending").length;
  const checkedInCount = reservations.filter(r => r.status === "checked_in").length;
  const cancelledCount = reservations.filter(r => r.status === "cancelled").length;

  const floorTables = useMemo(() => {
    const map: Record<string, TableData> = {};
    reservations.forEach(r => {
      if (!r.unit_id) return;
      const unit = units.find(u => u.id === r.unit_id);
      if (!unit) return;
      const name = unit.name.toLowerCase();
      let fpId = "";
      if (name.startsWith("tisch")) fpId = "t" + name.replace("tisch ", "").trim();
      else if (name.startsWith("billard")) fpId = "b" + name.replace("billard ", "").trim();
      if (!fpId) return;
      const now = new Date();
      const [h, m] = r.reservation_time.split(":").map(Number);
      const start = new Date(dateStr); start.setHours(h, m);
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
      const name = u.name.toLowerCase();
      let fpId = "";
      if (name.startsWith("tisch")) fpId = "t" + name.replace("tisch ", "").trim();
      else if (name.startsWith("billard")) fpId = "b" + name.replace("billard ", "").trim();
      if (fpId && !map[fpId]) map[fpId] = { id: fpId, title: u.name, status: "blocked" };
    });
    return map;
  }, [reservations, units, dateStr]);

  // Map unit area to reservation zone
  const areaToZone = (area: string): string => {
    const map: Record<string, string> = { billard: "billard", kicker: "billard", dart: "billard", restaurant: "hauptbereich" };
    return map[area] || area;
  };

  const handleTableClick = (_id: string, data: TableData) => {
    const unit = units.find(u => u.name.toLowerCase() === data.title.toLowerCase());
    const reservation = data.reservationId ? reservations.find(r => r.id === data.reservationId) : undefined;
    setPanelData({
      tableLabel: data.title,
      guest: data.guest, startTime: data.startTime, endTime: data.endTime,
      pax: data.pax, reservationId: data.reservationId,
      status: data.status, unitId: unit?.id, unitNotes: unit?.notes || "",
      customerEmail: reservation?.customer_email,
      customerPhone: reservation?.customer_phone,
      zone: reservation?.zone || (unit ? areaToZone(unit.area) : undefined),
    });
    setSelectedRowId(null);
    setPanelOpen(true);
  };

  const handleRowClick = (row: ResRow) => {
    const reservation = reservations.find(r => r.id === row.id);
    setPanelData({
      tableLabel: row.tableRef,
      guest: row.name, startTime: row.time, pax: row.guests,
      status: row.highlighted ? "present" : "reserved",
      reservationId: row.id,
      customerEmail: reservation?.customer_email,
      customerPhone: reservation?.customer_phone,
      zone: reservation?.zone,
    });
    setSelectedRowId(row.id);
    setPanelOpen(true);
  };

  const handleNewReservation = () => {
    setPanelData({ tableLabel: "Neue Reservierung", status: "free" });
    setSelectedRowId(null);
    setPanelOpen(true);
  };

  const closePanel = () => { setPanelOpen(false); setSelectedRowId(null); };

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
        totalReservations={rows.length}
        totalGuests={totalGuests}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ReservationPanel
          rows={rows} totalGuests={totalGuests}
          selectedRowId={selectedRowId}
          onRowClick={handleRowClick}
          onNewClick={handleNewReservation}
          waitlist={waitlist}
          onRefreshWaitlist={load}
        />

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
              <RondoFloorPlan tables={floorTables} onTableClick={handleTableClick} activeArea={activeArea} showLabels={showLabels} zoom={zoom} colorMode={colorMode} />
            )}
          </div>
        </div>
      </div>

      <OperationalSlidePanel
        open={panelOpen} data={panelData}
        onClose={closePanel}
        onBookNew={handleNewReservation}
        onRefresh={load}
      />

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <StatsPanel
        open={statsOpen} onClose={() => setStatsOpen(false)}
        totalReservations={rows.length} totalGuests={totalGuests}
        confirmedCount={confirmedCount} pendingCount={pendingCount}
        checkedInCount={checkedInCount} cancelledCount={cancelledCount}
      />
      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
};

export default OperationalView;
