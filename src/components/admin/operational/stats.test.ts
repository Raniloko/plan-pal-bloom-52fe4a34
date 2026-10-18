import { describe, expect, it } from "vitest";
import { areaUtilization, dailySeries, hourlyDistribution, summarizeDay, trendPct, type StatReservation } from "./stats";

const r = (o: Partial<StatReservation>): StatReservation => ({
  reservation_date: "2026-10-18", reservation_time: "19:00", guest_count: 2,
  zone: "hauptbereich", status: "confirmed", unit_id: null, ...o,
});

describe("admin stats", () => {
  it("summarizes a day and ignores cancelled in totals", () => {
    const s = summarizeDay([r({}), r({ status: "checked_in", guest_count: 4 }), r({ status: "cancelled" })]);
    expect(s).toMatchObject({ reservations: 2, guests: 6, checkedIn: 1, cancelled: 1 });
    expect(s.cancelRate).toBeCloseTo(1 / 3);
  });

  it("fills hour gaps", () => {
    const h = hourlyDistribution([r({ reservation_time: "18:30" }), r({ reservation_time: "20:15", guest_count: 3 })]);
    expect(h.map(b => b.hour)).toEqual(["18:00", "19:00", "20:00"]);
    expect(h[1].guests).toBe(0);
    expect(h[2].guests).toBe(3);
  });

  it("computes area utilization without blocked tables", () => {
    const units = [
      { id: "a", area: "vip" }, { id: "b", area: "vip" },
      { id: "c", area: "vip", status: "blocked" }, { id: "d", area: "fenster" },
    ];
    const u = areaUtilization([r({ unit_id: "a", guest_count: 5 }), r({ unit_id: "a" })], units);
    expect(u.find(x => x.area === "vip")).toMatchObject({ total: 2, booked: 1, pct: 50, guests: 7 });
    expect(u.find(x => x.area === "fenster")?.pct).toBe(0);
  });

  it("builds a zero-filled daily series", () => {
    const s = dailySeries([r({ reservation_date: "2026-10-17" })], "2026-10-18", 3);
    expect(s.map(p => p.reservations)).toEqual([0, 1, 0]);
    expect(s[2].date).toBe("2026-10-18");
  });

  it("trendPct handles empty baseline", () => {
    expect(trendPct(12, 10)).toBe(20);
    expect(trendPct(5, 0)).toBeNull();
  });
});
