import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ZoneKey = "hauptbereich" | "fenster" | "billard" | "vip" | "podest" | "salitos";

/** Fallback table count per zone when the units table can't be read. */
export const ZONE_CAPACITY: Record<ZoneKey, number> = {
  hauptbereich: 7,
  fenster: 3,
  billard: 8,
  vip: 6,
  podest: 4,
  salitos: 15,
};

// Reservation duration used for overlap calculations on the booking form.
// Backend caps Billard at 120 min and uses settings.reservation_duration for others.
// We use 120 min as a safe shared default — matches the backend default.
export const SLOT_DURATION_MIN = 120;

// Same minute arithmetic as the create-reservation edge function, so the
// form and the server agree on overlaps.
export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

type ActiveReservation = { reservation_time: string; zone: ZoneKey };
// Per-zone list of booked start times (in minutes) for the selected date.
type AvailabilityMap = Partial<Record<ZoneKey, number[]>>;

/** A booking to leave out of the counts, e.g. the guest's own one while changing it. */
export interface IgnoredBooking { date: string; time: string; zone: string }

/**
 * Table availability per zone for a date: capacity from the units table,
 * active bookings and day/area blocks. Shared by booking and change pages.
 */
export const useZoneAvailability = (date: string, ignore?: IgnoredBooking | null) => {
  const zoneKeys = useMemo(() => Object.keys(ZONE_CAPACITY) as ZoneKey[], []);
  const [unitCapacity, setUnitCapacity] = useState<Partial<Record<ZoneKey, number>>>({});
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [loading, setLoading] = useState(false);
  const [dayBlocks, setDayBlocks] = useState<{ area: string | null; reason: string | null }[]>([]);

  // Effective capacity per zone = number of non-blocked units in that area.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: units, error } = await supabase.from("units").select("area, status");
      if (cancelled || error || !units) return;
      const counts: Partial<Record<ZoneKey, number>> = {};
      for (const u of units as { area: string; status: string | null }[]) {
        if (!zoneKeys.includes(u.area as ZoneKey)) continue;
        if (u.status === "blocked") continue;
        const k = u.area as ZoneKey;
        counts[k] = (counts[k] ?? 0) + 1;
      }
      setUnitCapacity(counts);
    })();
    return () => { cancelled = true; };
  }, [zoneKeys]);

  const effectiveCapacity = useCallback((zone: ZoneKey): number => {
    const fromUnits = unitCapacity[zone];
    return fromUnits === undefined ? ZONE_CAPACITY[zone] : fromUnits;
  }, [unitCapacity]);

  const ignoreKey = ignore ? `${ignore.date}|${ignore.time}|${ignore.zone}` : "";
  const fetchAvailability = useCallback(async (d: string) => {
    if (!d) { setAvailability({}); return; }
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("reservations")
      .select("reservation_time, zone")
      .eq("reservation_date", d)
      .not("status", "in", '("cancelled","checked_out")')
      .in("zone", zoneKeys);
    if (error) { setLoading(false); return; }

    const grouped: AvailabilityMap = {};
    let skipped = false;
    const [ignDate, ignTime, ignZone] = ignoreKey.split("|");
    (rows as ActiveReservation[]).forEach(r => {
      if (!skipped && ignoreKey && ignDate === d && ignZone === r.zone && ignTime.slice(0, 5) === r.reservation_time.slice(0, 5)) {
        skipped = true;
        return;
      }
      (grouped[r.zone] ||= []).push(toMin(r.reservation_time));
    });
    setAvailability(grouped);
    setLoading(false);
  }, [zoneKeys, ignoreKey]);

  useEffect(() => { void fetchAvailability(date); }, [date, fetchAvailability]);

  useEffect(() => {
    if (!date) { setDayBlocks([]); return; }
    let cancelled = false;
    (async () => {
      const { data: rows } = await supabase.from("blocked_days").select("area, reason").eq("block_date", date);
      if (!cancelled) setDayBlocks(rows || []);
    })();
    return () => { cancelled = true; };
  }, [date]);

  useEffect(() => {
    if (!date) return;
    const channel = supabase
      .channel(`availability-${date}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `reservation_date=eq.${date}` }, () => {
        void fetchAvailability(date);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [date, fetchAvailability]);

  const dayFullyBlocked = dayBlocks.find(b => b.area === null) || null;
  const isAreaBlocked = useCallback((zone: string) => dayBlocks.some(b => b.area === zone), [dayBlocks]);

  // Count reservations in a zone whose [start, start+dur) overlaps [time, time+dur).
  const getCountForZoneAtTime = useCallback((time: string, zone: ZoneKey) => {
    const list = availability[zone] || [];
    const start = toMin(time);
    const end = start + SLOT_DURATION_MIN;
    return list.filter(s => start < s + SLOT_DURATION_MIN && end > s).length;
  }, [availability]);

  const isZoneFullyBooked = useCallback((zone: ZoneKey, time: string) => {
    const cap = effectiveCapacity(zone);
    if (cap <= 0) return true;
    return getCountForZoneAtTime(time, zone) >= cap;
  }, [getCountForZoneAtTime, effectiveCapacity]);

  const isTimeFullyBooked = useCallback((time: string) =>
    zoneKeys.every(zone => isZoneFullyBooked(zone, time)), [isZoneFullyBooked, zoneKeys]);

  // Ampel: wie viele Tische sind zu dieser Uhrzeit insgesamt noch frei?
  const freeSlotsAtTime = useCallback((time: string) =>
    zoneKeys.reduce((sum, zone) => {
      if (dayBlocks.some(b => b.area === zone)) return sum;
      return sum + Math.max(0, effectiveCapacity(zone) - getCountForZoneAtTime(time, zone));
    }, 0), [zoneKeys, dayBlocks, effectiveCapacity, getCountForZoneAtTime]);

  const refresh = useCallback(() => fetchAvailability(date), [fetchAvailability, date]);

  return {
    availability, refresh, zoneKeys, loading, dayFullyBlocked, isAreaBlocked, effectiveCapacity,
    getCountForZoneAtTime, isZoneFullyBooked, isTimeFullyBooked, freeSlotsAtTime,
  };
};

/** Same rule as the booking form: slots after midnight belong to the next calendar day. */
export const isTimeInPast = (date: string, time: string) => {
  if (!date) return true;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (date < today) return true;
  if (date !== today) return false;
  const [hour, minute] = time.split(":").map(Number);
  const dt = new Date();
  dt.setHours(hour, minute, 0, 0);
  if (hour < 6) dt.setDate(dt.getDate() + 1);
  return dt.getTime() <= Date.now();
};
