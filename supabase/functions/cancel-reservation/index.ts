import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return styledPage("Fehler", "Keine Reservierungs-ID angegeben.", false);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !reservation) {
      return styledPage("Nicht gefunden", "Diese Reservierung wurde nicht gefunden.", false);
    }

    if (reservation.status === "cancelled") {
      return styledPage("Bereits storniert", "Diese Reservierung wurde bereits storniert.", false);
    }

    const { error: updateError } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (updateError) {
      console.error("Cancel error:", updateError);
      return styledPage("Fehler", "Die Stornierung konnte nicht durchgeführt werden. Bitte kontaktiere uns direkt.", false);
    }

    // Send cancellation email (non-blocking)
    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
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
      console.error("Cancel email failed (non-blocking):", emailErr);
    }

    const [y, m, d] = reservation.reservation_date.split("-");
    return styledPage(
      "Reservierung storniert",
      `Deine Reservierung am ${d}.${m}.${y} um ${reservation.reservation_time} Uhr wurde erfolgreich storniert. Eine Bestätigung wurde per E-Mail gesendet.`,
      true
    );
  } catch (err) {
    console.error("Cancel error:", err);
    return styledPage("Fehler", "Ein unerwarteter Fehler ist aufgetreten.", false);
  }
});

function styledPage(title: string, message: string, success: boolean): Response {
  const accent = success ? "#22c55e" : "#dc2626";
  const icon = success ? "✓" : "✕";
  const iconBg = success ? "#f0fdf4" : "#fef2f2";
  const iconBorder = success ? "#bbf7d0" : "#fecaca";

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} – Rondo Sportsbar</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#f5f5f5; font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
    .card { background:#fff; border:1px solid #e5e5e5; border-radius:16px; padding:48px 40px; max-width:440px; width:100%; text-align:center; }
    .brand { font-size:14px; font-weight:800; color:#1a1a1a; letter-spacing:1px; margin-bottom:28px; }
    .icon { width:56px; height:56px; border-radius:50%; background:${iconBg}; border:2px solid ${iconBorder}; display:inline-flex; align-items:center; justify-content:center; font-size:28px; color:${accent}; margin-bottom:20px; }
    h1 { font-size:22px; color:#1a1a1a; margin-bottom:12px; font-weight:700; }
    p { color:#666; font-size:14px; line-height:1.6; }
    .footer { margin-top:28px; padding-top:20px; border-top:1px solid #f0f0f0; }
    .footer p { font-size:11px; color:#bbb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">RONDO SPORTSBAR</div>
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="footer"><p>Rondo Sportsbar</p></div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
