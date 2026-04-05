import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (per instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max attempts
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (req.method === "POST") {
      const body = await req.json();
      const { action, id, token } = body;

      // Input validation
      if (!id || typeof id !== "string" || !token || typeof token !== "string") {
        return new Response(JSON.stringify({ error: "Ungültiger Link." }), { status: 400, headers: jsonHeaders });
      }

      // UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id) || !uuidRegex.test(token)) {
        return new Response(JSON.stringify({ error: "Ungültiger Link." }), { status: 400, headers: jsonHeaders });
      }

      // Rate limit by reservation ID
      if (isRateLimited(`cancel:${id}`)) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte versuche es später erneut." }), { status: 429, headers: jsonHeaders });
      }

      const { data: reservation, error: fetchError } = await supabase
        .from("reservations")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !reservation) {
        return new Response(JSON.stringify({ error: "Reservierung nicht gefunden." }), { status: 404, headers: jsonHeaders });
      }

      // Constant-time-ish token comparison
      if (!reservation.cancellation_token || reservation.cancellation_token !== token) {
        return new Response(JSON.stringify({ error: "Ungültiger Link." }), { status: 403, headers: jsonHeaders });
      }

      if (action === "get") {
        if (reservation.status === "cancelled") {
          return new Response(JSON.stringify({ error: "Bereits storniert.", status: "cancelled" }), { status: 410, headers: jsonHeaders });
        }
        // Only return non-sensitive fields
        return new Response(JSON.stringify({
          reservation: {
            id: reservation.id,
            reservation_date: reservation.reservation_date,
            reservation_time: reservation.reservation_time,
            guest_count: reservation.guest_count,
            zone: reservation.zone,
            occasion: reservation.occasion,
            customer_name: reservation.customer_name,
            status: reservation.status,
          }
        }), { status: 200, headers: jsonHeaders });
      }

      if (action === "cancel") {
        if (reservation.status === "cancelled") {
          return new Response(JSON.stringify({ error: "Bereits storniert.", status: "cancelled" }), { status: 410, headers: jsonHeaders });
        }

        // Invalidate token after cancellation to prevent reuse
        const { error: updateError } = await supabase
          .from("reservations")
          .update({ status: "cancelled", cancellation_token: null })
          .eq("id", id);

        if (updateError) {
          console.error("Cancel error:", updateError);
          return new Response(JSON.stringify({ error: "Stornierung fehlgeschlagen." }), { status: 500, headers: jsonHeaders });
        }

        // Send cancellation email (non-blocking)
        try {
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY) {
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
            const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            await fetch(`${SUPABASE_URL}/functions/v1/send-reservation-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
              body: JSON.stringify({
                reservation: {
                  id: reservation.id,
                  customer_name: reservation.customer_name,
                  customer_email: reservation.customer_email,
                  reservation_date: reservation.reservation_date,
                  reservation_time: reservation.reservation_time,
                  guest_count: reservation.guest_count,
                  zone: reservation.zone,
                  occasion: reservation.occasion,
                },
                is_cancellation: true,
                cancel_reason: "Vom Gast storniert",
              }),
            });
          }
        } catch (emailErr) {
          console.error("Cancel email failed:", emailErr);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
      }

      return new Response(JSON.stringify({ error: "Ungültige Aktion." }), { status: 400, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: "Methode nicht erlaubt." }), { status: 405, headers: jsonHeaders });
  } catch (err) {
    console.error("Cancel error:", err);
    return new Response(JSON.stringify({ error: "Unerwarteter Fehler." }), { status: 500, headers: jsonHeaders });
  }
});
