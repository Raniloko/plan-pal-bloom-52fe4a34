import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ZONES = ["hauptbereich", "fenster", "billard", "vip", "podest"];

function isValidTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(":").map(Number);
  return h >= 0 && h <= 23 && [0, 15, 30, 45].includes(m);
}

function sanitize(s: string): string {
  return (s || "").replace(/[\r\n]/g, "").trim();
}

/**
 * Create recurring "Stammkunden" reservations for a date range + weekday filter.
 * - Skips dates where the chosen unit (or zone) is already booked at that time.
 * - Uses a shared recurring_group_id so the batch can be filtered/cancelled together.
 * Body:
 *   { name, phone?, email?, guests, zone, time, from_date, to_date, weekdays:number[] (0=Sun..6=Sat), unit_id?, note? }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth: only signed-in admins may use this endpoint
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Nicht authentifiziert." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Ungültiges Token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Nur Admins erlaubt." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { name, phone, email, guests, zone, time, from_date, to_date, weekdays, unit_id, note } = body;

    const errors: string[] = [];
    if (!name || sanitize(name).length < 2) errors.push("Name fehlt.");
    if (!guests || guests < 1 || guests > 50) errors.push("Personenanzahl ungültig.");
    if (!zone || !VALID_ZONES.includes(zone)) errors.push("Ungültiger Bereich.");
    if (!time || !isValidTime(time)) errors.push("Ungültige Uhrzeit.");
    if (!from_date || !to_date) errors.push("Datum fehlt.");
    if (!Array.isArray(weekdays) || weekdays.length === 0) errors.push("Mindestens ein Wochentag.");
    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors.join(" ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const start = new Date(from_date + "T00:00:00");
    const end = new Date(to_date + "T00:00:00");
    if (end < start) {
      return new Response(JSON.stringify({ error: "Bis-Datum vor Von-Datum." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Cap to 1 year to prevent abuse
    const maxEnd = new Date(start); maxEnd.setFullYear(maxEnd.getFullYear() + 1);
    if (end > maxEnd) {
      return new Response(JSON.stringify({ error: "Maximaler Zeitraum: 1 Jahr." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build candidate dates
    const wdSet = new Set<number>(weekdays.map((n: any) => Number(n)));
    const candidates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (wdSet.has(d.getDay())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        candidates.push(`${yyyy}-${mm}-${dd}`);
      }
    }
    if (candidates.length === 0) {
      return new Response(JSON.stringify({ error: "Keine passenden Tage im Zeitraum." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Duration setting for overlap window
    const { data: settingsData } = await supabase
      .from("settings").select("value").eq("key", "reservation_duration").single();
    const durMin = settingsData?.value ? Number(settingsData.value) : 120;
    const overlapDur = zone === "billard" ? Math.min(durMin, 30) : durMin;
    const [nh, nm] = time.split(":").map(Number);
    const newStart = nh * 60 + nm;
    const newEnd = newStart + overlapDur;

    // Pre-fetch existing reservations for the whole date range / zone in one go
    const { data: existing } = await supabase
      .from("reservations")
      .select("reservation_date, reservation_time, unit_id, zone")
      .gte("reservation_date", from_date)
      .lte("reservation_date", to_date)
      .eq("zone", zone)
      .not("status", "in", '("cancelled","checked_out")');

    const overlaps = (rt: string) => {
      const [rh, rm] = rt.split(":").map(Number);
      const rs = rh * 60 + rm;
      const re = rs + overlapDur;
      return newStart < re && newEnd > rs;
    };

    // Determine zone units (for capacity check / auto-assign)
    const { data: zoneUnits } = await supabase
      .from("units").select("id, name, capacity, status").eq("area", zone);
    const zoneCapacity = (zoneUnits || []).length || 1;

    const { data: rangeBlocks } = await supabase
      .from("unit_blocks")
      .select("unit_id, start_date, end_date")
      .lte("start_date", to_date)
      .gte("end_date", from_date);

    const groupId = crypto.randomUUID();
    const created: { date: string; unit_id: string | null }[] = [];
    const skipped: { date: string; reason: string }[] = [];

    for (const date of candidates) {
      const dayRes = (existing || []).filter(r => r.reservation_date === date && overlaps(r.reservation_time));
      const blockedUnitIds = new Set((rangeBlocks || [])
        .filter((b: any) => b.start_date <= date && b.end_date >= date)
        .map((b: any) => b.unit_id));

      // If a specific unit was chosen, check that unit
      let chosenUnit: string | null = null;
      if (unit_id) {
        if (blockedUnitIds.has(unit_id)) {
          skipped.push({ date, reason: "Tisch gesperrt" });
          continue;
        }
        const unitConflict = dayRes.some(r => r.unit_id === unit_id);
        if (unitConflict) {
          skipped.push({ date, reason: "Tisch belegt" });
          continue;
        }
        chosenUnit = unit_id;
      } else {
        // Auto-assign: smallest fitting free table
        const usedUnits = new Set(dayRes.map(r => r.unit_id).filter(Boolean));
        const free = (zoneUnits || []).filter(u =>
          !blockedUnitIds.has(u.id) && !usedUnits.has(u.id)
        );
        let pick;
        if (zone === "billard") {
          // Billard: pick lowest-numbered free table (1..8)
          const num = (n: string) => {
            const m = (n || "").match(/\d+/);
            return m ? parseInt(m[0], 10) : 9999;
          };
          pick = [...free].sort((a, b) => num(a.name) - num(b.name))[0];
        } else {
          const fitting = free.filter(u => (u.capacity ?? 4) >= guests).sort((a, b) => (a.capacity ?? 4) - (b.capacity ?? 4));
          pick = fitting[0];
          if (!pick) {
            const fallback = [...free].sort((a, b) => (b.capacity ?? 4) - (a.capacity ?? 4));
            pick = fallback[0];
          }
        }
        if (!pick) {
          skipped.push({ date, reason: "Bereich ausgebucht" });
          continue;
        }
        // Zone capacity guard
        if (dayRes.length >= zoneCapacity) {
          skipped.push({ date, reason: "Bereich voll" });
          continue;
        }
        chosenUnit = pick.id;
      }

      const { error: insErr } = await supabase.from("reservations").insert({
        reservation_date: date,
        reservation_time: time,
        guest_count: guests,
        zone,
        occasion: "stammkunde",
        customer_name: sanitize(name),
        customer_email: sanitize(email) || "stammkunde@intern.local",
        customer_phone: sanitize(phone) || "000",
        message: ("Stammkunden-Reservierung. " + (sanitize(note || ""))).slice(0, 1000),
        honeypot: "",
        status: "confirmed",
        unit_id: chosenUnit,
        recurring_group_id: groupId,
      });

      if (insErr) {
        skipped.push({ date, reason: insErr.message });
      } else {
        created.push({ date, unit_id: chosenUnit });
        // Reflect into local cache so subsequent days see this booking
        (existing as any[]).push({ reservation_date: date, reservation_time: time, unit_id: chosenUnit, zone });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      group_id: groupId,
      created_count: created.length,
      skipped_count: skipped.length,
      created, skipped,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("create-recurring-reservations error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Unerwarteter Fehler." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
