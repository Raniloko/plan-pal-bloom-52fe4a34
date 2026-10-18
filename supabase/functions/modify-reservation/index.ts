import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notifyStaff } from "../_shared/staffNotify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Same rules as create-reservation, so a booking can be changed to
// anything it could have been created with.
const VALID_ZONES = ["hauptbereich", "fenster", "billard", "vip", "podest", "salitos"];
const VALID_OCCASIONS = ["sport", "feier", "essen", "billard", "sonstiges"];
const ZONE_CAPACITY: Record<string, number> = {
  hauptbereich: 7, fenster: 3, billard: 8, vip: 6, podest: 4, salitos: 15,
};

function isValidTime(t: unknown): t is string {
  if (typeof t !== "string" || !/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(":").map(Number);
  return h >= 0 && h <= 23 && [0, 15, 30, 45].includes(m);
}

/** "sport, feier" or "sonstiges: Geburtstag" – every part must be known. */
function isValidOccasion(o: unknown): o is string {
  if (typeof o !== "string") return false;
  const parts = o.split(",").map(s => s.trim()).filter(Boolean);
  return parts.length > 0 && parts.every(p => VALID_OCCASIONS.includes(p) || p.startsWith("sonstiges:"));
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  if (req.method === "POST") {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const body = await req.json();
      const { action, id, token } = body;

      // Input validation
      if (!id || typeof id !== "string" || !token || typeof token !== "string") {
        return new Response(JSON.stringify({ error: "Ungültiger Link." }), { status: 400, headers: jsonHeaders });
      }
      if (!uuidRegex.test(id) || !uuidRegex.test(token)) {
        return new Response(JSON.stringify({ error: "Ungültiger Link." }), { status: 400, headers: jsonHeaders });
      }

      // Rate limit
      if (isRateLimited(`modify:${id}`)) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte versuche es später erneut." }), { status: 429, headers: jsonHeaders });
      }

      const { data: tokenCheck } = await supabase.from("reservations").select("cancellation_token, status").eq("id", id).single();
      if (!tokenCheck || !tokenCheck.cancellation_token || tokenCheck.cancellation_token !== token) {
        return new Response(JSON.stringify({ error: "Zugriff verweigert." }), { status: 403, headers: jsonHeaders });
      }
      if (tokenCheck.status === "cancelled") {
        return new Response(JSON.stringify({ error: "Reservierung storniert.", status: "cancelled" }), { status: 410, headers: jsonHeaders });
      }

      if (action === "get") {
        const { data: r, error } = await supabase.from("reservations").select("*").eq("id", id).single();
        if (error || !r) {
          return new Response(JSON.stringify({ error: "Reservierung nicht gefunden." }), { status: 404, headers: jsonHeaders });
        }
        // Only return non-sensitive fields
        return new Response(JSON.stringify({
          reservation: {
            id: r.id,
            reservation_date: r.reservation_date,
            reservation_time: r.reservation_time,
            guest_count: r.guest_count,
            zone: r.zone,
            occasion: r.occasion,
            message: r.message,
            customer_name: r.customer_name,
            status: r.status,
          }
        }), { status: 200, headers: jsonHeaders });
      }

      if (action === "update") {
        const { date, time, guests, zone, occasion, message } = body;
        const errors: string[] = [];
        if (!date || typeof date !== "string") errors.push("Datum fehlt.");
        if (!isValidTime(time)) errors.push("Ungültige Uhrzeit.");
        if (!guests || typeof guests !== "number" || guests < 1 || guests > 50) errors.push("Personenanzahl ungültig.");
        if (!VALID_ZONES.includes(zone)) errors.push("Ungültiger Bereich.");
        if (!isValidOccasion(occasion) || occasion.length > 300) errors.push("Ungültiger Anlass.");
        if (zone === "billard" && isValidTime(time) && Number(time.slice(0, 2)) >= 20) {
          errors.push("Billard ist ab 20:00 Uhr nicht mehr reservierbar.");
        }

        // Validate date format (YYYY-MM-DD)
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push("Ungültiges Datumsformat.");

        // Prevent past dates
        if (date && new Date(date) < new Date(new Date().toISOString().split("T")[0])) {
          errors.push("Datum liegt in der Vergangenheit.");
        }

        if (errors.length > 0) {
          return new Response(JSON.stringify({ error: errors.join(" ") }), { status: 400, headers: jsonHeaders });
        }

        const { data: original } = await supabase.from("reservations").select("*").eq("id", id).single();
        if (!original || original.status === "cancelled") {
          return new Response(JSON.stringify({ error: "Reservierung nicht gefunden oder storniert." }), { status: 404, headers: jsonHeaders });
        }

        const slotChanged = original.reservation_date !== date
          || String(original.reservation_time).slice(0, 5) !== time
          || original.zone !== zone;

        if (slotChanged) {
          // Closed day or area?
          const { data: blocks } = await supabase
            .from("blocked_days").select("area").eq("block_date", date);
          if ((blocks || []).some((b: { area: string | null }) => b.area === null || b.area === zone)) {
            return new Response(JSON.stringify({ error: "An diesem Tag ist der Bereich leider gesperrt. Bitte wähle ein anderes Datum oder einen anderen Bereich." }), { status: 409, headers: jsonHeaders });
          }

          // Capacity in the target zone, not counting this booking itself.
          const { data: zoneUnits } = await supabase.from("units").select("id").eq("area", zone);
          const capacity = zoneUnits && zoneUnits.length > 0 ? zoneUnits.length : (ZONE_CAPACITY[zone] ?? 1);
          const { data: settingsRow } = await supabase.from("settings").select("value").eq("key", "reservation_duration").maybeSingle();
          const durMin = settingsRow?.value ? Number(settingsRow.value) : 120;
          const overlapDur = zone === "billard" ? Math.min(durMin, 120) : durMin;
          const { data: existing } = await supabase
            .from("reservations")
            .select("id, reservation_time")
            .eq("reservation_date", date)
            .eq("zone", zone)
            .neq("id", id)
            .not("status", "in", '("cancelled","checked_out")');
          const start = toMin(time);
          const overlapping = (existing || []).filter((r: { reservation_time: string }) => {
            const rStart = toMin(r.reservation_time);
            return start < rStart + overlapDur && start + overlapDur > rStart;
          }).length;
          if (overlapping >= capacity) {
            return new Response(JSON.stringify({ error: "Dieser Bereich ist zur gewählten Uhrzeit bereits vollständig belegt. Bitte wähle eine andere Uhrzeit oder einen anderen Bereich." }), { status: 409, headers: jsonHeaders });
          }
        }

        // A table assigned by the team only stays if it still fits: same
        // area and no other booking on that table in the new time window.
        let unitId: string | null = original.unit_id ?? null;
        if (unitId && slotChanged) {
          if (original.zone !== zone) {
            unitId = null;
          } else {
            const { data: sameUnit } = await supabase
              .from("reservations")
              .select("reservation_time")
              .eq("unit_id", unitId)
              .eq("reservation_date", date)
              .neq("id", id)
              .not("status", "in", '("cancelled","checked_out")');
            const start = toMin(time);
            if ((sameUnit || []).some((r: { reservation_time: string }) => Math.abs(toMin(r.reservation_time) - start) < 120)) {
              unitId = null;
            }
          }
        }

        const sanitizedMessage = (message || "").substring(0, 1000).replace(/<[^>]*>/g, "");

        const { error: updateError } = await supabase.from("reservations").update({
          reservation_date: date,
          reservation_time: time,
          guest_count: guests,
          zone,
          occasion,
          message: sanitizedMessage,
          unit_id: unitId,
        }).eq("id", id);

        if (updateError) {
          console.error("Update error:", updateError);
          return new Response(JSON.stringify({ error: "Änderung fehlgeschlagen." }), { status: 500, headers: jsonHeaders });
        }

        // Send modification email (non-blocking)
        try {
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          await fetch(`${SUPABASE_URL}/functions/v1/send-reservation-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
            body: JSON.stringify({
              reservation: {
                id,
                customer_name: original.customer_name,
                customer_email: original.customer_email,
                reservation_date: date,
                reservation_time: time,
                guest_count: guests,
                zone,
                occasion,
                message: sanitizedMessage,
              },
              is_modification: true,
            }),
          });
        } catch (emailErr) {
          console.error("Email failed:", emailErr);
        }

        const before = `vorher ${String(original.reservation_date).slice(8, 10)}.${String(original.reservation_date).slice(5, 7)}. ${String(original.reservation_time).slice(0, 5)} Uhr, ${original.guest_count} Pers.`;
        await notifyStaff(supabase, "modified", {
          id, customer_name: original.customer_name, reservation_date: date,
          reservation_time: time, guest_count: guests, zone,
        }, before);

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
      }

      return new Response(JSON.stringify({ error: "Ungültige Aktion." }), { status: 400, headers: jsonHeaders });
    } catch (err) {
      console.error("Modify error:", err);
      return new Response(JSON.stringify({ error: "Unerwarteter Fehler." }), { status: 500, headers: jsonHeaders });
    }
  }

  return new Response(JSON.stringify({ error: "Methode nicht erlaubt." }), { status: 405, headers: jsonHeaders });
});
