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
import type { ReservationRow, PanelData } from "@/components/admin/operational";

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
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch data
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

  // Map reservations to ReservationRow format
  const rows: ReservationRow[] = useMemo(() => {
    return reservations
      .filter((r) => r.status !== "cancelled")
      .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
      .map((r) => {
        const unit = r.unit_id ? units.find((u) => u.id === r.unit_id) : undefined;
        const now = new Date();
        const [h, m] = r.reservation_time.split(":").map(Number);
        const start = new Date(today);
        start.setHours(h, m);
        const isPresent = r.status === "confirmed" && now >= start;

        let status: ReservationRow["status"] = "none";
        if (r.status === "pending") status = "ob";
        else if (isPresent) status = "double-check";
        else if (r.status === "confirmed") status = "check";

        return {
          id: r.id,
          time: r.reservation_time,
          guests: r.guest_count,
          name: r.customer_name,
          table: unit ? `${unit.area.slice(0, 2)}. / ${unit.name.replace(/\D/g, "")}` : r.zone,
          status,
          highlighted: isPresent,
          zone: r.zone,
          customer_email: r.customer_email,
          customer_phone: r.customer_phone,
          unit_id: r.unit_id,
          occasion: r.occasion,
          message: r.message,
        };
      });
  }, [reservations, units, today]);

  const totalGuests = rows.reduce((s, r) => s + r.guests, 0);

  // Build floor plan tables
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
        status: isPresent ? "present" : "reserved",
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

  const handleTableClick = (_tableId: string, data: TableData) => {
    const unit = units.find((u) => u.name.toLowerCase() === data.title.toLowerCase());
    setPanelData({
      tableId: data.id,
      tableLabel: data.title,
      guest: data.guest,
      startTime: data.startTime,
      pax: data.pax,
      reservationId: data.reservationId,
      status: data.status,
      unitId: unit?.id,
      unitNotes: unit?.notes || "",
    });
    setShowBookingForm(false);
    setSelectedRowId(null);
    setPanelOpen(true);
  };

  const handleRowClick = (row: ReservationRow) => {
    const unit = row.unit_id ? units.find((u) => u.id === row.unit_id) : undefined;
    setPanelData({
      tableLabel: unit?.name || row.zone,
      guest: row.name,
      startTime: row.time,
      pax: row.guests,
      reservationId: row.id,
      status: row.highlighted ? "present" : row.status === "ob" ? "reserved" : "reserved",
      unitId: unit?.id,
      unitNotes: unit?.notes || "",
    });
    setShowBookingForm(false);
    setSelectedRowId(row.id);
    setPanelOpen(true);
  };

  const handleNewClick = () => {
    setPanelData(null);
    setShowBookingForm(true);
    setSelectedRowId(null);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedRowId(null);
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <OperationalTopbar totalReservations={rows.length} totalGuests={totalGuests} />

      <div className="flex flex-1 overflow-hidden">
        <ReservationPanel
          rows={rows}
          totalGuests={totalGuests}
          selectedRowId={selectedRowId}
          onRowClick={handleRowClick}
          onNewClick={handleNewClick}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <OperationalAreaTabs activeArea={activeArea} onAreaChange={setActiveArea} />
          <div className="flex-1 relative overflow-hidden">
            <RondoFloorPlan tables={floorTables} onTableClick={handleTableClick} />
          </div>
        </div>
      </div>

      <OperationalSlidePanel
        open={panelOpen}
        data={panelData}
        showBookingForm={showBookingForm}
        onClose={closePanel}
      />
    </div>
  );
};

export default OperationalView;
