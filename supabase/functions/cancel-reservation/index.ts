import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // JSON API mode (POST)
    if (req.method === "POST") {
      const body = await req.json();
      const { action, id, token } = body;

      if (!id || !token) {
        return new Response(JSON.stringify({ error: "Ungültiger Link." }), { status: 400, headers: jsonHeaders });
      }

      const { data: reservation, error: fetchError } = await supabase
        .from("reservations")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !reservation) {
        return new Response(JSON.stringify({ error: "Reservierung nicht gefunden." }), { status: 404, headers: jsonHeaders });
      }

      if (reservation.cancellation_token !== token) {
        return new Response(JSON.stringify({ error: "Ungültiger Link." }), { status: 403, headers: jsonHeaders });
      }

      if (action === "get") {
        if (reservation.status === "cancelled") {
          return new Response(JSON.stringify({ error: "Bereits storniert.", status: "cancelled" }), { status: 410, headers: jsonHeaders });
        }
        return new Response(JSON.stringify({ reservation }), { status: 200, headers: jsonHeaders });
      }

      if (action === "cancel") {
        if (reservation.status === "cancelled") {
          return new Response(JSON.stringify({ error: "Bereits storniert.", status: "cancelled" }), { status: 410, headers: jsonHeaders });
        }

        const { error: updateError } = await supabase
          .from("reservations")
          .update({ status: "cancelled" })
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
