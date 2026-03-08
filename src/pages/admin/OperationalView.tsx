import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { RondoFloorPlan } from "@/components/admin/floorplan";
import type { TableData } from "@/components/admin/floorplan";
import {
  OperationalTopbar,
  OperationalAreaTabs,
  ReservationPanel,
  OperationalSlidePanel,
} from "@/components/admin/operational";
import type { ResRow, PanelData } from "@/components/admin/operational";

/* Seed data for initial display (matches spec exactly) */
const SEED_ROWS: ResRow[] = [
  { id: "s1", time: "19:00", offset: "01:00", guests: 4, name: ". Jana", tableRef: "1. / 3", icon: "ob", highlighted: false },
  { id: "s2", time: "19:15", offset: "01:15", guests: 4, name: "Michelik", tableRef: "1. / 2", icon: "none", highlighted: false },
  { id: "s3", time: "19:30", offset: "01:30", guests: 2, name: "Licata, Francesco", tableRef: "3. / 64", icon: "double", highlighted: true },
  { id: "s4", time: "19:30", offset: "01:30", guests: 3, name: "Lenga, Dennis", tableRef: "1. / 6", icon: "double", highlighted: true },
  { id: "s5", time: "20:00", offset: "02:00", guests: 4, name: "Gutsch, Fabian", tableRef: "3. / 65", icon: "chkps", highlighted: false },
  { id: "s6", time: "20:00", offset: "02:00", guests: 4, name: "Hantal", tableRef: "1. / 1", icon: "single", highlighted: false },
  { id: "s7", time: "20:00", offset: "02:00", guests: 4, name: "Kewelo", tableRef: "1. / 8", icon: "none", highlighted: false },
];

/* Seed floor plan data */
const SEED_TABLES: Record<string, TableData> = {
  b2: { id: "b2", title: "Billard 2", status: "reserved", guest: "Michelik", startTime: "19:15", endTime: "21:15", pax: 4 },
  t61: { id: "t61", title: "Tisch 61", status: "reserved", guest: "Guido", startTime: "01:30", endTime: "03:00", pax: 2 },
  t62: { id: "t62", title: "Tisch 62", status: "reserved", guest: "Lentino", startTime: "19:30", endTime: "21:00", pax: 3 },
  t63: { id: "t63", title: "Tisch 63", status: "reserved", guest: "Santos d.", startTime: "20:00", endTime: "22:00", pax: 4 },
  t64: { id: "t64", title: "Tisch 64", status: "present", guest: "Licata", startTime: "19:30", endTime: "21:30", pax: 2 },
  t65: { id: "t65", title: "Tisch 65", status: "present", guest: "Gutsch", startTime: "20:00", endTime: "22:00", pax: 4 },
};

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

const OperationalView = () => {
  const [activeArea, setActiveArea] = useState("billard");
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelData, setPanelData] = useState<PanelData | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch live data
  useEffect(() => {
    const load = async () => {
      const [r, u] = await Promise.all([
        supabase.from("reservations").select("*").eq("reservation_date", today).neq("status", "cancelled"),
        supabase.from("units").select("*").order("position_index"),
      ]);
      setReservations((r.data as Reservation[]) || []);
      setUnits((u.data as Unit[]) || []);
    };
    load();
    const ch = supabase
      .channel("op-view")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "units" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [today]);

  // Build rows from DB + seed fallback
  const rows: ResRow[] = useMemo(() => {
    if (reservations.length === 0) return SEED_ROWS;
    return reservations
      .filter(r => r.status !== "cancelled")
      .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
      .map(r => {
        const unit = r.unit_id ? units.find(u => u.id === r.unit_id) : undefined;
        const now = new Date();
        const [h, m] = r.reservation_time.split(":").map(Number);
        const start = new Date(today); start.setHours(h, m);
        const isPresent = r.status === "confirmed" && now >= start;
        let icon: ResRow["icon"] = "none";
        if (r.status === "pending") icon = "ob";
        else if (isPresent) icon = "double";
        else if (r.status === "confirmed") icon = "single";
        return {
          id: r.id,
          time: r.reservation_time,
          offset: "",
          guests: r.guest_count,
          name: r.customer_name,
          tableRef: unit ? `${unit.area.slice(0, 2)}. / ${unit.name.replace(/\D/g, "")}` : r.zone,
          icon,
          highlighted: isPresent,
        };
      });
  }, [reservations, units, today]);

  const totalGuests = rows.reduce((s, r) => s + r.guests, 0);

  // Build floor plan tables from DB + seed fallback
  const floorTables = useMemo(() => {
    if (reservations.length === 0) return SEED_TABLES;
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
      const start = new Date(today); start.setHours(h, m);
      const isPresent = r.status === "confirmed" && now >= start;
      map[fpId] = {
        id: fpId, title: unit.name,
        status: isPresent ? "present" : "reserved",
        guest: r.customer_name, startTime: r.reservation_time,
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
  }, [reservations, units, today]);

  const handleTableClick = (_id: string, data: TableData) => {
    const unit = units.find(u => u.name.toLowerCase() === data.title.toLowerCase());
    setPanelData({
      tableLabel: data.title,
      guest: data.guest, startTime: data.startTime, endTime: data.endTime,
      pax: data.pax, reservationId: data.reservationId,
      status: data.status, unitId: unit?.id, unitNotes: unit?.notes || "",
    });
    setSelectedRowId(null);
    setPanelOpen(true);
  };

  const handleRowClick = (row: ResRow) => {
    setPanelData({
      tableLabel: row.tableRef,
      guest: row.name, startTime: row.time, pax: row.guests,
      status: row.highlighted ? "present" : row.icon === "ob" ? "reserved" : "reserved",
      reservationId: row.id,
    });
    setSelectedRowId(row.id);
    setPanelOpen(true);
  };

  const closePanel = () => { setPanelOpen(false); setSelectedRowId(null); };

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: "'DM Sans', sans-serif",
    }}>
      <OperationalTopbar totalReservations={rows.length} totalGuests={totalGuests} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ReservationPanel
          rows={rows} totalGuests={totalGuests}
          selectedRowId={selectedRowId}
          onRowClick={handleRowClick}
          onNewClick={() => {}}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <OperationalAreaTabs activeArea={activeArea} onAreaChange={setActiveArea} />
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <RondoFloorPlan tables={floorTables} onTableClick={handleTableClick} />
          </div>
        </div>
      </div>

      <OperationalSlidePanel
        open={panelOpen} data={panelData}
        onClose={closePanel} onBookNew={() => {}}
      />
    </div>
  );
};

export default OperationalView;
