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

  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (action) {
      case "check_in": {
        const { reservation_id, checked_in } = body;
        if (!reservation_id) return error("reservation_id required", 400);
        const newStatus = checked_in ? "confirmed" : "checked_in";
        const { error: err } = await supabase
          .from("reservations")
          .update({ status: newStatus })
          .eq("id", reservation_id);
        if (err) return error(err.message, 500);
        return ok({ status: newStatus });
      }

      case "cancel": {
        const { reservation_id, reason } = body;
        if (!reservation_id) return error("reservation_id required", 400);
        const { error: err } = await supabase
          .from("reservations")
          .update({ status: "cancelled", cancellation_reason: reason || "Admin-Stornierung" })
          .eq("id", reservation_id);
        if (err) return error(err.message, 500);

        // Try to send cancellation email
        try {
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          await fetch(`${SUPABASE_URL}/functions/v1/send-reservation-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({ reservation_id, type: "cancellation" }),
          });
        } catch (e) {
          console.error("Email error (non-blocking):", e);
        }

        return ok({ status: "cancelled" });
      }

      case "block_unit": {
        const { unit_id, blocked } = body;
        if (!unit_id) return error("unit_id required", 400);
        const newStatus = blocked ? "free" : "blocked";
        const { error: err } = await supabase
          .from("units")
          .update({ status: newStatus })
          .eq("id", unit_id);
        if (err) return error(err.message, 500);
        return ok({ status: newStatus });
      }

      case "update_notes": {
        const { unit_id, notes } = body;
        if (!unit_id) return error("unit_id required", 400);
        const { error: err } = await supabase
          .from("units")
          .update({ notes: notes || "" })
          .eq("id", unit_id);
        if (err) return error(err.message, 500);
        return ok({ saved: true });
      }

      case "assign_unit": {
        const { reservation_id, unit_id } = body;
        if (!reservation_id) return error("reservation_id required", 400);
        const { error: err } = await supabase
          .from("reservations")
          .update({ unit_id: unit_id || null })
          .eq("id", reservation_id);
        if (err) return error(err.message, 500);
        return ok({ assigned: true });
      }

      case "update_reservation": {
        const { reservation_id, updates } = body;
        if (!reservation_id || !updates) return error("reservation_id and updates required", 400);
        // Only allow safe fields
        const allowed: Record<string, unknown> = {};
        for (const key of ["guest_count", "reservation_time", "reservation_date", "zone", "occasion", "message", "status", "unit_id"]) {
          if (updates[key] !== undefined) allowed[key] = updates[key];
        }
        const { error: err } = await supabase
          .from("reservations")
          .update(allowed)
          .eq("id", reservation_id);
        if (err) return error(err.message, 500);
        return ok({ updated: true });
      }

      default:
        return error(`Unknown action: ${action}`, 400);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return error("Unerwarteter Fehler", 500);
  }
});

function ok(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function error(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
