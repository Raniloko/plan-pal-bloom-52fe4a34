import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { RondoFloorPlan, TableData, TableStatus } from "@/components/admin/floorplan";
import UnitDetailPanel from "@/components/admin/UnitDetailPanel";

const RestaurantPage = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const fetchData = async () => {
      const [resResult, unitsResult] = await Promise.all([
        supabase.from("reservations").select("*").eq("reservation_date", today)
          .in("zone", ["hauptbereich", "fenster", "restaurant", "billard"])
          .neq("status", "cancelled"),
        supabase.from("units").select("*").in("area", ["restaurant", "billard"]).order("position_index"),
      ]);
      setReservations(resResult.data || []);
      setUnits(unitsResult.data || []);
    };
    fetchData();

    const channel = supabase.channel("restaurant-floor")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "units" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [today]);

  // Map reservations to floor plan table data
  const tables = useMemo(() => {
    const map: Record<string, TableData> = {};
    reservations.forEach((r) => {
      if (!r.unit_id) return;
      const unit = units.find(u => u.id === r.unit_id);
      if (!unit) return;
      // Map unit name to floor plan ID (e.g. "Tisch 61" -> "t61", "Billard 1" -> "b1")
      const name = unit.name.toLowerCase();
      let fpId = "";
      if (name.startsWith("tisch")) fpId = "t" + name.replace("tisch ", "").trim();
      else if (name.startsWith("billard")) fpId = "b" + name.replace("billard ", "").trim();
      if (!fpId) return;

      const now = new Date();
      const [h, m] = r.reservation_time.split(":").map(Number);
      const resStart = new Date(today); resStart.setHours(h, m);
      const isPresent = r.status === "confirmed" && now >= resStart;

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

    // Mark blocked units
    units.forEach(u => {
      if (u.status !== "blocked") return;
      const name = u.name.toLowerCase();
      let fpId = "";
      if (name.startsWith("tisch")) fpId = "t" + name.replace("tisch ", "").trim();
      else if (name.startsWith("billard")) fpId = "b" + name.replace("billard ", "").trim();
      if (fpId && !map[fpId]) {
        map[fpId] = { id: fpId, title: u.name, status: "blocked" };
      }
    });

    return map;
  }, [reservations, units, today]);

  const handleTableClick = (tableId: string, data: TableData) => {
    // Find the matching unit to open the detail panel
    const name = data.title;
    const unit = units.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (unit) setSelectedUnit(unit);
  };

  // Stats
  const totalTables = 20;
  const reservedCount = Object.values(tables).filter(t => t.status === "reserved" || t.status === "present").length;
  const freeCount = totalTables - reservedCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <h2 className="font-display text-3xl tracking-wider">🍽️ Restaurant – Sitzplan</h2>
        <div className="flex gap-2">
          <div className="glass-card rounded-lg px-3 py-1.5">
            <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-success" />{freeCount} Frei</span>
          </div>
          <div className="glass-card rounded-lg px-3 py-1.5">
            <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-[#3a7bd5]" />{reservedCount} Belegt</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-2 overflow-hidden" style={{ aspectRatio: "1000/700" }}>
        <RondoFloorPlan tables={tables} onTableClick={handleTableClick} />
      </div>

      <UnitDetailPanel unit={selectedUnit} open={!!selectedUnit} onClose={() => setSelectedUnit(null)} onStatusChange={() => {}} />
    </div>
  );
};

export default RestaurantPage;
