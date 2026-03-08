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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load auto-cancel threshold from settings (default: 15 min)
    const { data: settingsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "auto_cancel_minutes")
      .single();
    const thresholdMin = settingsData?.value ? Number(settingsData.value) : 15;

    // Get today's date in Europe/Berlin timezone
    const now = new Date();
    const berlinFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const today = berlinFormatter.format(now);

    // Get current time in Berlin
    const timeFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const currentTime = timeFormatter.format(now);
    const [nowH, nowM] = currentTime.split(":").map(Number);
    const nowMinutes = nowH * 60 + nowM;

    // Fetch all confirmed/pending reservations for today (not checked_in, not cancelled, not checked_out)
    const { data: reservations, error: fetchErr } = await supabase
      .from("reservations")
      .select("id, reservation_time, customer_name, zone")
      .eq("reservation_date", today)
      .in("status", ["confirmed", "pending"]);

    if (fetchErr) {
      console.error("Fetch error:", fetchErr.message);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find overdue reservations (start time + threshold < now)
    const toCancel = (reservations || []).filter((r) => {
      const [h, m] = r.reservation_time.split(":").map(Number);
      const startMin = h * 60 + m;
      return nowMinutes >= startMin + thresholdMin;
    });

    let cancelledCount = 0;

    for (const r of toCancel) {
      const { error: updateErr } = await supabase
        .from("reservations")
        .update({
          status: "cancelled",
          cancellation_reason: `Automatisch storniert – nicht eingecheckt nach ${thresholdMin} Min.`,
        })
        .eq("id", r.id);

      if (!updateErr) {
        cancelledCount++;
        // Log activity
        await supabase.from("activity_log").insert({
          action: "auto_cancel",
          entity_type: "reservation",
          entity_id: r.id,
          details: `${r.customer_name} (${r.zone}) – ${thresholdMin} Min. überfällig`,
        });
        // Create notification
        await supabase.from("notifications").insert({
          title: "Automatische Stornierung",
          message: `${r.customer_name} (${r.reservation_time}, ${r.zone}) wurde automatisch storniert – nicht eingecheckt nach ${thresholdMin} Min.`,
          type: "warning",
          reservation_id: r.id,
        });
      }
    }

    console.log(`Auto-cancel: ${cancelledCount} of ${toCancel.length} cancelled (threshold: ${thresholdMin}min)`);

    return new Response(
      JSON.stringify({ success: true, checked: reservations?.length || 0, cancelled: cancelledCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
