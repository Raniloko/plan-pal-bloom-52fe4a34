import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ZONES = ["hauptbereich", "billard", "vip", "podest", "fenster"];
const VALID_OCCASIONS = ["sport", "feier", "essen", "billard", "sonstiges"];
const VALID_TIMES: string[] = [];
for (let h = 14; h <= 23; h++) {
  for (const m of ["00", "15", "30", "45"]) {
    VALID_TIMES.push(`${h}:${m}`);
  }
}

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
        if (!VALID_TIMES.includes(time)) errors.push("Ungültige Uhrzeit.");
        if (!guests || typeof guests !== "number" || guests < 1 || guests > 50) errors.push("Personenanzahl ungültig.");
        if (!VALID_ZONES.includes(zone)) errors.push("Ungültiger Bereich.");
        if (!VALID_OCCASIONS.includes(occasion)) errors.push("Ungültiger Anlass.");

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

        const sanitizedMessage = (message || "").substring(0, 1000).replace(/<[^>]*>/g, "");

        const { error: updateError } = await supabase.from("reservations").update({
          reservation_date: date,
          reservation_time: time,
          guest_count: guests,
          zone,
          occasion,
          message: sanitizedMessage,
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
