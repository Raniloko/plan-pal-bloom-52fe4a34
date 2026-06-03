import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ZONES = ["hauptbereich", "fenster", "billard", "vip", "podest", "salitos"];
const VALID_OCCASIONS = ["sport", "feier", "essen", "billard", "sonstiges"];

function isValidTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(":").map(Number);
  return h >= 0 && h <= 23 && [0, 15, 30, 45].includes(m);
}

const ZONE_CAPACITY: Record<string, number> = {
  hauptbereich: 7,
  fenster: 3,   // nur Tisch 55, 56, 57
  billard: 8,
  vip: 6,
  podest: 4,
  salitos: 15,
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

    // Walk-in / admin booking bypass: only honored when the caller presents
    // a valid admin JWT. Without a verified admin token, treat the request
    // like a normal public booking so all validations apply.
    let isAdminBooking = false;
    if (sanitize(email) === "walkin@intern.local") {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const anonClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
          );
          const token = authHeader.replace("Bearer ", "");
          const { data: claimsData } = await anonClient.auth.getClaims(token);
          const userId = claimsData?.claims?.sub as string | undefined;
          if (userId) {
            const adminClient = createClient(
              Deno.env.get("SUPABASE_URL")!,
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );
            const { data: roleData } = await adminClient
              .from("user_roles")
              .select("role")
              .eq("user_id", userId)
              .eq("role", "admin")
              .maybeSingle();
            if (roleData) isAdminBooking = true;
          }
        } catch (e) {
          console.error("Admin booking auth check failed:", e);
        }
      }
      if (!isAdminBooking) {
        return new Response(
          JSON.stringify({ error: "Ungültige E-Mail-Adresse." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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
    // Billard ab 20:00 nicht mehr buchbar (gilt nicht für Admin/Walk-in)
    if (!isAdminBooking && zone === "billard" && time && isValidTime(time)) {
      const [bH] = time.split(":").map(Number);
      if (bH >= 20) {
        errors.push("Billard ist ab 20:00 Uhr nicht mehr reservierbar.");
      }
    }
    if (!name || sanitize(name).length < 2 || sanitize(name).length > 100) errors.push("Name muss 2-100 Zeichen lang sein.");
    if (!isAdminBooking) {
      if (!email || !isValidEmail(sanitize(email))) errors.push("Ungültige E-Mail-Adresse.");
      if (!phone || sanitize(phone).length < 3 || sanitize(phone).length > 30) errors.push("Ungültige Telefonnummer (mind. 3 Zeichen).");
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

    // Effective capacity = number of non-blocked units in this zone.
    // Falls back to the static ZONE_CAPACITY when no units are defined.
    let zoneCapacity = ZONE_CAPACITY[zone] ?? 1;
    {
      const { data: zoneUnitsForCap } = await supabase
        .from("units")
        .select("id, status")
        .eq("area", zone);
      if (zoneUnitsForCap && zoneUnitsForCap.length > 0) {
        const available = zoneUnitsForCap.filter(u => u.status !== "blocked").length;
        zoneCapacity = available;
      }
    }

    if (zoneCapacity <= 0) {
      return new Response(
        JSON.stringify({ error: "Dieser Bereich ist aktuell nicht verfügbar." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load duration setting for overlap calculation
    const { data: settingsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "reservation_duration")
      .single();
    const durMin = settingsData?.value ? Number(settingsData.value) : 120;

    // Billard: block the full booked play time (capped at 2h) so two
    // reservations cannot land on the same table within that window.
    // The live-timer model only governs the in-house check-in flow,
    // not future reservation conflicts.
    const overlapDur = zone === "billard" ? Math.min(durMin, 120) : durMin;

    const [newH, newM] = time.split(":").map(Number);
    const newStart = newH * 60 + newM;
    const newEnd = newStart + overlapDur;

    // ---- Billard: route through atomic RPCs to prevent race conditions ----
    // Two simultaneous billard requests previously could both pick the same
    // free table because the JS auto-assign read & wrote in separate steps.
    // The DB RPCs use a per-day advisory lock so concurrent picks are serialized.
    if (zone === "billard" && unit_id) {
      const payload = {
        customer_name: sanitize(name),
        customer_email: sanitize(email),
        customer_phone: sanitize(phone),
        guest_count: guests,
        zone,
        occasion: anlass,
        status: "confirmed",
        message: message ? sanitize(message).substring(0, 1000) : "",
      };

      let billardResId: string | null = null;
      const billardUnitId: string | null = unit_id;

      {
        const { data: rid, error: rpcErr } = await supabase.rpc("reserve_atomic", {
          p_unit_id: unit_id,
          p_date: date,
          p_time: time,
          p_duration_min: overlapDur,
          p_payload: payload,
        });
        if (rpcErr) {
          if (rpcErr.message?.includes("unit_conflict") || rpcErr.code === "23505") {
            return new Response(
              JSON.stringify({ error: "Dieser Billardtisch ist zur gewählten Uhrzeit bereits belegt. Bitte wähle einen anderen Tisch oder eine andere Uhrzeit." }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          console.error("reserve_atomic error:", rpcErr.message);
          return new Response(
            JSON.stringify({ error: "Fehler beim Speichern der Reservierung." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        billardResId = rid as string;
      }

      // Fire-and-forget confirmation email (skip for Walk-ins)
      const isWalkInEmail = sanitize(email) === "walkin@intern.local";
      try {
        if (isWalkInEmail) throw new Error("__skip_walkin_email__");
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
              id: billardResId,
              customer_name: sanitize(name),
              customer_email: sanitize(email),
              reservation_date: date,
              reservation_time: time,
              guest_count: guests,
              zone,
              occasion: anlass,
              message: message ? sanitize(message).substring(0, 1000) : "",
            },
          }),
        });
      } catch (emailErr) {
        if ((emailErr as Error)?.message !== "__skip_walkin_email__") {
          console.error("Email sending failed (non-blocking):", emailErr);
        }
      }

      return new Response(
        JSON.stringify({ success: true, reservation_id: billardResId, unit_id: billardUnitId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If a specific unit_id is provided, check for overlapping reservations on that unit
    if (unit_id) {
      const { data: unitConflicts } = await supabase
        .from("reservations")
        .select("id, reservation_time")
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
        return new Response(
          JSON.stringify({ error: "Dieser Tisch ist zur gewählten Uhrzeit bereits belegt. Bitte wähle einen anderen Tisch oder eine andere Uhrzeit." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Auto-Zuweisung eines konkreten Tisches, wenn der Kunde keinen
    // bestimmten Tisch ausgewählt hat. Verhindert "leere" Reservierungen
    // ohne Tischnummer (vorher: nur Bereichsname sichtbar -> Chaos).
    // Walk-Ins / Admin-Buchungen dürfen weiterhin ohne unit_id bleiben,
    // damit das Personal Tische selbst zuweisen kann.
    if (!unit_id && !isAdminBooking) {
      const { data: zoneUnits } = await supabase
        .from("units")
        .select("id, name, status, position_index, capacity")
        .eq("area", zone);

      const candidates = (zoneUnits || [])
        .filter((u) => u.status !== "blocked")
        // Pflicht: ausreichende Kapazität für die Personenanzahl
        .filter((u) => (u.capacity ?? 99) >= guests)
        .sort((a: any, b: any) => {
          // Kleinste passende Kapazität zuerst (verschwendet keine großen Tische)
          const ca = a.capacity ?? 99;
          const cb = b.capacity ?? 99;
          if (ca !== cb) return ca - cb;
          const ap = a.position_index ?? 999;
          const bp = b.position_index ?? 999;
          if (ap !== bp) return ap - bp;
          return String(a.name).localeCompare(String(b.name));
        });

      if (candidates.length > 0) {
        const { data: unitRes } = await supabase
          .from("reservations")
          .select("unit_id, reservation_time")
          .eq("reservation_date", date)
          .eq("zone", zone)
          .not("unit_id", "is", null)
          .not("status", "in", '("cancelled","checked_out")');

        const busy = new Set<string>();
        for (const r of unitRes || []) {
          if (!r.unit_id) continue;
          const [rh, rm] = (r.reservation_time as string).split(":").map(Number);
          const rStart = rh * 60 + rm;
          const rEnd = rStart + overlapDur;
          if (newStart < rEnd && newEnd > rStart) busy.add(r.unit_id as string);
        }

        const picked = candidates.find((u) => !busy.has(u.id));
        if (picked) unit_id = picked.id;
      }

      // Kein freier passender Tisch -> klare Fehlermeldung statt
      // Reservierung ohne Tischnummer (vermeidet Chaos im Dashboard).
      if (!unit_id) {
        return new Response(
          JSON.stringify({
            error:
              "Für diese Personenanzahl ist zur gewählten Uhrzeit kein passender Tisch verfügbar. Bitte wähle eine andere Uhrzeit oder einen anderen Bereich.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
      if (sanitize(email) === "walkin@intern.local") throw new Error("__skip_walkin_email__");
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
      if ((emailErr as Error)?.message !== "__skip_walkin_email__") {
        console.error("Email sending failed (non-blocking):", emailErr);
      }
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
