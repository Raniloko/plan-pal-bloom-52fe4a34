import { addDays, format, parseISO } from "date-fns";
import { areaLabel } from "@/components/admin/areaLabels";

export interface StatReservation {
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  zone: string;
  status: string;
  unit_id: string | null;
}

export interface StatUnit {
  id: string;
  area: string;
  status?: string | null;
}


const isActive = (r: StatReservation) => r.status !== "cancelled";

export interface DaySummary {
  reservations: number;
  guests: number;
  checkedIn: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  cancelRate: number;
}

export const summarizeDay = (list: StatReservation[]): DaySummary => {
  const active = list.filter(isActive);
  const cancelled = list.length - active.length;
  return {
    reservations: active.length,
    guests: active.reduce((s, r) => s + r.guest_count, 0),
    checkedIn: list.filter(r => r.status === "checked_in" || r.status === "checked_out").length,
    confirmed: list.filter(r => r.status === "confirmed").length,
    pending: list.filter(r => r.status === "pending").length,
    cancelled,
    cancelRate: list.length ? cancelled / list.length : 0,
  };
};

export interface HourBucket { hour: string; guests: number; reservations: number }

/** Guests per hour, gaps filled between the first and last booked hour. */
export const hourlyDistribution = (list: StatReservation[]): HourBucket[] => {
  const active = list.filter(isActive);
  if (!active.length) return [];
  const byHour = new Map<number, HourBucket>();
  for (const r of active) {
    const h = parseInt(r.reservation_time.slice(0, 2), 10);
    const b = byHour.get(h) ?? { hour: `${String(h).padStart(2, "0")}:00`, guests: 0, reservations: 0 };
    b.guests += r.guest_count;
    b.reservations += 1;
    byHour.set(h, b);
  }
  const hours = [...byHour.keys()];
  const out: HourBucket[] = [];
  for (let h = Math.min(...hours); h <= Math.max(...hours); h++) {
    out.push(byHour.get(h) ?? { hour: `${String(h).padStart(2, "0")}:00`, guests: 0, reservations: 0 });
  }
  return out;
};

export interface AreaUsage { area: string; label: string; total: number; booked: number; guests: number; pct: number }

/** Share of non-blocked tables with at least one booking, per area. */
export const areaUtilization = (list: StatReservation[], units: StatUnit[]): AreaUsage[] => {
  const bookedIds = new Set(list.filter(isActive).map(r => r.unit_id).filter(Boolean) as string[]);
  const guestsByArea = new Map<string, number>();
  const unitArea = new Map(units.map(u => [u.id, u.area]));
  for (const r of list.filter(isActive)) {
    const area = (r.unit_id && unitArea.get(r.unit_id)) || (r.zone || "").toLowerCase();
    guestsByArea.set(area, (guestsByArea.get(area) ?? 0) + r.guest_count);
  }
  const areas = [...new Set(units.map(u => u.area))];
  return areas
    .map(area => {
      const inArea = units.filter(u => u.area === area && u.status !== "blocked");
      const booked = inArea.filter(u => bookedIds.has(u.id)).length;
      return {
        area,
        label: areaLabel(area),
        total: inArea.length,
        booked,
        guests: guestsByArea.get(area) ?? 0,
        pct: inArea.length ? Math.round((booked / inArea.length) * 100) : 0,
      };
    })
    .filter(a => a.total > 0)
    .sort((a, b) => b.pct - a.pct);
};

export interface DayPoint { date: string; label: string; reservations: number; guests: number }

/** `days` consecutive points ending at `endDate` (inclusive), zero-filled. */
export const dailySeries = (list: StatReservation[], endDate: string, days: number): DayPoint[] => {
  const end = parseISO(endDate);
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(end, i - (days - 1));
    const key = format(d, "yyyy-MM-dd");
    const day = list.filter(r => r.reservation_date === key && isActive(r));
    return {
      date: key,
      label: format(d, "dd.MM."),
      reservations: day.length,
      guests: day.reduce((s, r) => s + r.guest_count, 0),
    };
  });
};

/** Relative change in %, null when there is no baseline. */
export const trendPct = (current: number, previous: number): number | null =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
