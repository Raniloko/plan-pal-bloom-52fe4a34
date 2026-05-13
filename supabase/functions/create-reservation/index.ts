import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ZONES = ["hauptbereich", "billard", "vip", "podest", "fenster"];
const VALID_OCCASIONS = ["sport", "feier", "essen", "billard", "sonstiges"];

function isValidTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(":").map(Number);
  return h >= 0 && h <= 23 && [0, 15, 30, 45].includes(m);
}

const ZONE_CAPACITY: Record<string, number> = {
  hauptbereich: 7,
  fenster: 5,
  billard: 8,
  vip: 6,
  podest: 8,
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 3600000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function sanitize(str: string): string {
  return str.replace(/[\r\n]/g, "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: "Zu viele Anfragen. Bitte versuche es später erneut." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { date, time, guests, zone, anlass, name, email, phone, message, honeypot } = body;
    let unit_id: string | null = body.unit_id ?? null;

    if (honeypot && honeypot.trim() !== "") {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdminBooking = sanitize(email) === "walkin@intern.local";

    const errors: string[] = [];

    if (!date || !isValidDate(date)) errors.push("Ungültiges Datum.");
    if (!time || !isValidTime(time)) errors.push("Ungültige Uhrzeit.");
    if (!guests || guests < 1 || guests > 50) errors.push("Personenanzahl muss zwischen 1 und 50 liegen.");
    if (!zone || !VALID_ZONES.includes(zone)) errors.push("Ungültiger Bereich.");
    
    const anlassParts = (anlass || "").split(",").map((s: string) => s.trim()).filter(Boolean);
    const validAnlass = anlassParts.length > 0 && anlassParts.every((p: string) => 
      VALID_OCCASIONS.includes(p) || p.startsWith("sonstiges:")
    );
    if (!isAdminBooking && !validAnlass) errors.push("Ungültiger Anlass.");
    if (!name || sanitize(name).length < 2 || sanitize(name).length > 100) errors.push("Name muss 2-100 Zeichen lang sein.");
    if (!isAdminBooking) {
      if (!email || !isValidEmail(sanitize(email))) errors.push("Ungültige E-Mail-Adresse.");
      if (!phone || sanitize(phone).length < 5 || sanitize(phone).length > 30) errors.push("Ungültige Telefonnummer.");
    }
    if (message && message.length > 1000) errors.push("Nachricht darf maximal 1000 Zeichen lang sein.");

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: errors.join(" ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const zoneCapacity = ZONE_CAPACITY[zone] ?? 1;

    // Load duration setting for overlap calculation
    const { data: settingsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "reservation_duration")
      .single();
    const durMin = settingsData?.value ? Number(settingsData.value) : 120;

    // For billard zone: use shorter overlap window since billard uses live-timer (actual duration varies)
    // Admin/walk-in bookings on billard should not be blocked by the fixed 2h duration
    const overlapDur = zone === "billard" ? Math.min(durMin, 30) : durMin;

    const [newH, newM] = time.split(":").map(Number);
    const newStart = newH * 60 + newM;
    const newEnd = newStart + overlapDur;

    // If a specific unit_id is provided, check for overlapping reservations on that unit
    if (unit_id) {
      const { data: unitConflicts } = await supabase
        .from("reservations")
        .select("id, customer_name, reservation_time")
        .eq("unit_id", unit_id)
        .eq("reservation_date", date)
        .not("status", "in", '("cancelled","checked_out")');

      const overlapping = (unitConflicts || []).filter(c => {
        const [ch, cm] = c.reservation_time.split(":").map(Number);
        const cStart = ch * 60 + cm;
        const cEnd = cStart + overlapDur;
        return newStart < cEnd && newEnd > cStart;
      });

      if (overlapping.length > 0) {
        const c = overlapping[0];
        return new Response(
          JSON.stringify({ error: `Dieser Tisch ist bereits um ${c.reservation_time.slice(0, 5)} an ${c.customer_name} vergeben. Bitte wähle einen anderen Tisch oder eine andere Uhrzeit.` }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Auto-assign a unit if none provided: smallest fitting capacity, fall back to larger.
    if (!unit_id) {
      const { data: zoneUnits } = await supabase
        .from("units")
        .select("id, name, capacity, status")
        .eq("area", zone);

      if (zoneUnits && zoneUnits.length > 0) {
        // Get all reservations for this zone+date to detect conflicts per unit
        const { data: dayRes } = await supabase
          .from("reservations")
          .select("unit_id, reservation_time")
          .eq("reservation_date", date)
          .eq("zone", zone)
          .not("status", "in", '("cancelled","checked_out")');

        const conflictsByUnit = new Map<string, boolean>();
        for (const r of dayRes || []) {
          if (!r.unit_id) continue;
          const [rh, rm] = r.reservation_time.split(":").map(Number);
          const rStart = rh * 60 + rm;
          const rEnd = rStart + overlapDur;
          if (newStart < rEnd && newEnd > rStart) {
            conflictsByUnit.set(r.unit_id, true);
          }
        }

        const available = zoneUnits.filter(u =>
          u.status !== "blocked" && !conflictsByUnit.has(u.id)
        );

        // Prefer smallest table with capacity >= guests; fall back to largest available if none fits exactly.
        const fitting = available
          .filter(u => (u.capacity ?? 4) >= guests)
          .sort((a, b) => (a.capacity ?? 4) - (b.capacity ?? 4));

        let chosen = fitting[0];
        if (!chosen) {
          // No table large enough free → take the largest available as fallback (better than nothing)
          const fallback = [...available].sort((a, b) => (b.capacity ?? 4) - (a.capacity ?? 4));
          chosen = fallback[0];
        }

        if (chosen) {
          unit_id = chosen.id;
        }
      }
    }

    // Zone capacity check
    const { data: existingRes, error: availabilityError } = await supabase
      .from("reservations")
      .select("id, reservation_time")
      .eq("reservation_date", date)
      .eq("zone", zone)
      .not("status", "in", '("cancelled","checked_out")');

    if (availabilityError) {
      console.error("Availability check error:", availabilityError.message);
      return new Response(
        JSON.stringify({ error: "Fehler bei der Verfügbarkeitsprüfung." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const overlappingCount = (existingRes || []).filter(r => {
      const [rH, rM] = r.reservation_time.split(":").map(Number);
      const rStart = rH * 60 + rM;
      const rEnd = rStart + overlapDur;
      return newStart < rEnd && newEnd > rStart;
    }).length;

    if (overlappingCount >= zoneCapacity) {
      return new Response(
        JSON.stringify({ error: "Dieser Bereich ist zur gewählten Uhrzeit bereits vollständig belegt." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase.from("reservations").insert({
      reservation_date: date,
      reservation_time: time,
      guest_count: guests,
      zone: zone,
      occasion: anlass,
      customer_name: sanitize(name),
      customer_email: sanitize(email),
      customer_phone: sanitize(phone),
      message: message ? sanitize(message).substring(0, 1000) : "",
      honeypot: "",
      status: "confirmed",
      unit_id: unit_id,
    }).select().single();

    if (error) {
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({ error: "Dieser Zeitslot ist leider bereits belegt. Bitte wähle einen anderen." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("DB error:", error.message);
      return new Response(
        JSON.stringify({ error: "Fehler beim Speichern der Reservierung." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send confirmation email (fire-and-forget)
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      await fetch(`${SUPABASE_URL}/functions/v1/send-reservation-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          reservation: {
            id: data.id,
            customer_name: sanitize(name),
            customer_email: sanitize(email),
            reservation_date: date,
            reservation_time: time,
            guest_count: guests,
            zone: zone,
            occasion: anlass,
            message: message ? sanitize(message).substring(0, 1000) : "",
          },
        }),
      });
    } catch (emailErr) {
      console.error("Email sending failed (non-blocking):", emailErr);
    }

    return new Response(
      JSON.stringify({ success: true, reservation_id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unerwarteter Fehler." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
