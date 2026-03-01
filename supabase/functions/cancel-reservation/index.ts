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
      return htmlResponse("Fehler", "Keine Reservierungs-ID angegeben.", false);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get reservation first
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !reservation) {
      return htmlResponse("Nicht gefunden", "Diese Reservierung wurde nicht gefunden.", false);
    }

    if (reservation.status === "cancelled") {
      return htmlResponse("Bereits storniert", "Diese Reservierung wurde bereits storniert.", false);
    }

    // Cancel it
    const { error: updateError } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (updateError) {
      console.error("Cancel error:", updateError);
      return htmlResponse("Fehler", "Die Reservierung konnte nicht storniert werden. Bitte kontaktiere uns direkt.", false);
    }

    // Send cancellation confirmation email
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Rondo Sportsbar <info@dev-lab24.de>",
            to: [reservation.customer_email],
            subject: `Reservierung storniert – ${formatDate(reservation.reservation_date)}`,
            html: buildCancelEmailHtml(reservation),
          }),
        });
      }
    } catch (emailErr) {
      console.error("Cancel email failed (non-blocking):", emailErr);
    }

    return htmlResponse(
      "Reservierung storniert",
      `Deine Reservierung für den ${formatDate(reservation.reservation_date)} um ${reservation.reservation_time} Uhr wurde erfolgreich storniert. Du erhältst eine Bestätigung per E-Mail.`,
      true
    );
  } catch (err) {
    console.error("Cancel error:", err);
    return htmlResponse("Fehler", "Ein unerwarteter Fehler ist aufgetreten.", false);
  }
});

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

const ZONE_LABELS: Record<string, string> = {
  hauptbereich: "Restaurantbereich am 140-Zoll Screen",
  fenster: "Restaurantbereich am 75-Zoll Screen",
  billard: "Billard-Tisch",
  vip: "VIP-Raum",
  podest: "Podest",
};

function buildCancelEmailHtml(reservation: any): string {
  const zoneLabel = ZONE_LABELS[reservation.zone] || reservation.zone;
  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#c8a960,#b8963f);padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:28px;color:#0a0a0a;font-weight:800;letter-spacing:1px;">RONDO SPORTSBAR</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#1a1a1a;letter-spacing:2px;">ESSEN · SPORT · BILLIARD</p>
        </td></tr>
        <tr><td style="background-color:#141414;padding:28px 40px;text-align:center;border-bottom:1px solid #222;">
          <div style="display:inline-block;background-color:#3a1a1a;border:1px solid #5a2d2d;border-radius:8px;padding:12px 24px;">
            <span style="color:#f87171;font-size:18px;font-weight:700;">✕ Reservierung storniert</span>
          </div>
          <p style="color:#999;font-size:14px;margin:12px 0 0;">Hallo <strong style="color:#e5e5e5;">${reservation.customer_name}</strong>, deine Reservierung wurde storniert.</p>
        </td></tr>
        <tr><td style="background-color:#141414;padding:24px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:12px 16px;background-color:#1a1a1a;border-radius:8px 8px 0 0;border-bottom:1px solid #222;">
              <table width="100%"><tr><td style="color:#999;font-size:13px;">📅 Datum</td><td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;text-decoration:line-through;opacity:.6;">${formatDate(reservation.reservation_date)}</td></tr></table>
            </td></tr>
            <tr><td style="padding:12px 16px;background-color:#1a1a1a;border-bottom:1px solid #222;">
              <table width="100%"><tr><td style="color:#999;font-size:13px;">🕐 Uhrzeit</td><td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;text-decoration:line-through;opacity:.6;">${reservation.reservation_time} Uhr</td></tr></table>
            </td></tr>
            <tr><td style="padding:12px 16px;background-color:#1a1a1a;border-bottom:1px solid #222;">
              <table width="100%"><tr><td style="color:#999;font-size:13px;">👥 Personen</td><td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;text-decoration:line-through;opacity:.6;">${reservation.guest_count}</td></tr></table>
            </td></tr>
            <tr><td style="padding:12px 16px;background-color:#1a1a1a;border-radius:0 0 8px 8px;">
              <table width="100%"><tr><td style="color:#999;font-size:13px;">📍 Bereich</td><td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;text-decoration:line-through;opacity:.6;">${zoneLabel}</td></tr></table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color:#141414;padding:0 40px 24px;text-align:center;">
          <p style="color:#999;font-size:13px;margin:0;">Du möchtest erneut reservieren? Besuche unsere Website.</p>
        </td></tr>
        <tr><td style="background-color:#0d0d0d;padding:24px 40px;border-radius:0 0 12px 12px;border-top:1px solid #222;text-align:center;">
          <p style="margin:0;color:#666;font-size:12px;">Rondo Sportsbar · Essen · Sport · Billiard</p>
          <p style="margin:8px 0 0;color:#444;font-size:11px;">Reservierungs-ID: ${reservation.id}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function htmlResponse(title: string, message: string, success: boolean): Response {
  const color = success ? "#4ade80" : "#f87171";
  const icon = success ? "✓" : "✕";

  const html = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} – Rondo Sportsbar</title>
<style>
  body { margin:0; padding:0; background:#0a0a0a; font-family:'Helvetica Neue',Arial,sans-serif; color:#e5e5e5; display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .card { background:#141414; border:1px solid #222; border-radius:16px; padding:48px; max-width:480px; width:90%; text-align:center; }
  .icon { width:64px; height:64px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:32px; margin-bottom:24px; }
  .icon.success { background:#1a3d1a; border:2px solid #2d5a2d; color:#4ade80; }
  .icon.error { background:#3a1a1a; border:2px solid #5a2d2d; color:#f87171; }
  h1 { font-size:24px; margin:0 0 12px; color:${color}; }
  p { color:#999; font-size:15px; line-height:1.6; margin:0; }
  .brand { margin-top:32px; padding-top:24px; border-top:1px solid #222; }
  .brand p { font-size:12px; color:#555; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon ${success ? 'success' : 'error'}">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="brand">
      <p style="color:#c8a960;font-weight:700;font-size:14px;letter-spacing:1px;">RONDO SPORTSBAR</p>
      <p>Essen · Sport · Billiard</p>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
