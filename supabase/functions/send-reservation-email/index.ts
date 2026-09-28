import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZONE_LABELS: Record<string, string> = {
  hauptbereich: "Restaurant (140-Zoll Screen)",
  fenster: "Restaurant (75-Zoll Screen)",
  billard: "Billard",
  vip: "VIP-Raum",
  podest: "Podest",
};

function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return `${days[date.getDay()]}, ${d}.${m}.${y}`;
}

function buildEmailHtml(reservation: {
  id: string;
  customer_name: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  zone: string;
  occasion: string;
  message?: string;
  cancel_url: string;
  modify_url: string;
  is_modification?: boolean;
  unit_name?: string;
}): string {
  const zoneLabel = ZONE_LABELS[reservation.zone] || reservation.zone;
  const title = reservation.is_modification ? "Reservierung geändert" : "Reservierung bestätigt";
  const kicker = reservation.is_modification ? "AKTUALISIERT" : "BESTÄTIGT";

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'DM Sans',-apple-system,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:24px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#111111;border-radius:4px;overflow:hidden;">

        <!-- Brand bar -->
        <tr><td style="background:#ffda00;padding:18px 32px;">
          <table width="100%"><tr>
            <td style="font-family:'DM Sans',Arial,sans-serif;font-size:18px;font-weight:800;color:#111111;letter-spacing:2px;">RONDO</td>
            <td align="right" style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:#111111;letter-spacing:2px;">SPORTSBAR · HANAU</td>
          </tr></table>
        </td></tr>

        <!-- Hero -->
        <tr><td style="padding:48px 32px 24px;text-align:left;">
          <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:#ffda00;letter-spacing:3px;">${kicker}</p>
          <h1 style="margin:12px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:34px;line-height:1.1;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${title}.</h1>
          <p style="margin:18px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#a8a8a8;line-height:1.5;">Hallo ${reservation.customer_name}, wir freuen uns auf dich.</p>
        </td></tr>

        <!-- Yellow divider -->
        <tr><td style="padding:32px 32px 0;">
          <div style="height:2px;background:#ffda00;width:48px;"></div>
        </td></tr>

        <!-- Details -->
        <tr><td style="padding:24px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:14px 0;border-bottom:1px solid #222;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Datum</td>
              <td style="padding:14px 0;border-bottom:1px solid #222;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-align:right;">${formatDate(reservation.reservation_date)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0;border-bottom:1px solid #222;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Uhrzeit</td>
              <td style="padding:14px 0;border-bottom:1px solid #222;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-align:right;">${reservation.reservation_time} Uhr</td>
            </tr>
            <tr>
              <td style="padding:14px 0;border-bottom:1px solid #222;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Personen</td>
              <td style="padding:14px 0;border-bottom:1px solid #222;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-align:right;">${reservation.guest_count}</td>
            </tr>
            <tr>
              <td style="padding:14px 0;${reservation.zone === "billard" && reservation.unit_name ? "border-bottom:1px solid #222;" : ""}font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Bereich</td>
              <td style="padding:14px 0;${reservation.zone === "billard" && reservation.unit_name ? "border-bottom:1px solid #222;" : ""}font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-align:right;">${zoneLabel}</td>
            </tr>
            ${reservation.zone === "billard" && reservation.unit_name ? `
            <tr>
              <td style="padding:14px 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Billard-Tisch</td>
              <td style="padding:14px 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffda00;text-align:right;">${reservation.unit_name}</td>
            </tr>` : ""}
          </table>
        </td></tr>

        ${reservation.message ? `
        <tr><td style="padding:16px 32px 8px;">
          <div style="border-left:2px solid #ffda00;padding:8px 0 8px 16px;">
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#888;letter-spacing:1px;text-transform:uppercase;">Deine Nachricht</p>
            <p style="margin:6px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#d4d4d4;line-height:1.5;">${reservation.message}</p>
          </div>
        </td></tr>` : ""}

        <!-- Actions -->
        <tr><td style="padding:32px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="50%" style="padding-right:6px;">
              <a href="${reservation.modify_url}" style="display:block;background:#ffda00;color:#111111;text-decoration:none;padding:16px 0;text-align:center;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;">Ändern</a>
            </td>
            <td width="50%" style="padding-left:6px;">
              <a href="${reservation.cancel_url}" style="display:block;background:transparent;color:#ffffff;text-decoration:none;padding:14px 0;text-align:center;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border:2px solid #2a2a2a;border-radius:2px;">Stornieren</a>
            </td>
          </tr></table>
        </td></tr>

        <!-- Address block -->
        <tr><td style="padding:32px 32px 16px;">
          <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#666;letter-spacing:2px;text-transform:uppercase;">Wir sehen uns hier</p>
          <p style="margin:8px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#d4d4d4;line-height:1.6;">
            Rondo Sportsbar<br>
            Hanau
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #1f1f1f;text-align:center;">
          <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;color:#555;letter-spacing:1px;">RONDO SPORTSBAR · ID ${reservation.id.slice(0, 8).toUpperCase()}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildCancellationEmailHtml(reservation: {
  id: string;
  customer_name: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  zone: string;
}, cancelReason: string): string {
  const zoneLabel = ZONE_LABELS[reservation.zone] || reservation.zone;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'DM Sans',-apple-system,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:24px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#111111;border-radius:4px;overflow:hidden;">

        <tr><td style="background:#ffda00;padding:18px 32px;">
          <table width="100%"><tr>
            <td style="font-family:'DM Sans',Arial,sans-serif;font-size:18px;font-weight:800;color:#111111;letter-spacing:2px;">RONDO</td>
            <td align="right" style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:#111111;letter-spacing:2px;">SPORTSBAR · HANAU</td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:48px 32px 24px;">
          <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:#888;letter-spacing:3px;">STORNIERT</p>
          <h1 style="margin:12px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:34px;line-height:1.1;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Reservierung storniert.</h1>
          <p style="margin:18px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#a8a8a8;line-height:1.5;">Hallo ${reservation.customer_name}, deine Reservierung wurde erfolgreich storniert. Schade — wir hoffen, dich bald wiederzusehen.</p>
        </td></tr>

        <tr><td style="padding:24px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:14px 0;border-bottom:1px solid #222;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Datum</td>
              <td style="padding:14px 0;border-bottom:1px solid #222;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:500;color:#666;text-align:right;text-decoration:line-through;">${formatDate(reservation.reservation_date)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0;border-bottom:1px solid #222;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Uhrzeit</td>
              <td style="padding:14px 0;border-bottom:1px solid #222;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:500;color:#666;text-align:right;text-decoration:line-through;">${reservation.reservation_time} Uhr</td>
            </tr>
            <tr>
              <td style="padding:14px 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Bereich</td>
              <td style="padding:14px 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:500;color:#666;text-align:right;text-decoration:line-through;">${zoneLabel}</td>
            </tr>
          </table>
        </td></tr>

        ${cancelReason ? `
        <tr><td style="padding:16px 32px 8px;">
          <div style="border-left:2px solid #ffda00;padding:8px 0 8px 16px;">
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#888;letter-spacing:1px;text-transform:uppercase;">Grund</p>
            <p style="margin:6px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#d4d4d4;line-height:1.5;">${cancelReason}</p>
          </div>
        </td></tr>` : ""}

        <tr><td style="padding:32px 32px 16px;">
          <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#d4d4d4;line-height:1.6;">Du möchtest neu reservieren? Wir sind jederzeit für dich da.</p>
        </td></tr>

        <tr><td style="padding:24px 32px;border-top:1px solid #1f1f1f;text-align:center;">
          <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;color:#555;letter-spacing:1px;">RONDO SPORTSBAR · ID ${reservation.id.slice(0, 8).toUpperCase()}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: only callers presenting the service-role key may send emails.
    // This prevents abuse via spoofed recipients / phishing using our verified domain.
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!provided || provided !== SERVICE_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { reservation, is_modification, is_cancellation, cancel_reason } = body;

    if (!reservation || !reservation.id || !reservation.customer_email) {
      return new Response(
        JSON.stringify({ error: "Missing reservation data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the reservation actually exists and use stored values (prevents spoofed payloads).
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      SERVICE_KEY
    );
    const { data: dbRes, error: dbErr } = await supabaseAdmin
      .from("reservations")
      .select("id, customer_name, customer_email, reservation_date, reservation_time, guest_count, zone, occasion, message, cancellation_token, unit_id")
      .eq("id", reservation.id)
      .single();
    if (dbErr || !dbRes) {
      return new Response(
        JSON.stringify({ error: "Reservation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Walk-ins use the internal placeholder address – never send emails for them.
    if ((dbRes.customer_email || "").toLowerCase() === "walkin@intern.local") {
      return new Response(
        JSON.stringify({ success: true, skipped: "walkin" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch unit name for billard reservations
    let unitName = "";
    if (dbRes.zone === "billard" && (dbRes as any).unit_id) {
      const { data: unitRow } = await supabaseAdmin
        .from("units")
        .select("name")
        .eq("id", (dbRes as any).unit_id)
        .maybeSingle();
      if (unitRow?.name) unitName = escapeHtml(unitRow.name);
    }

    // Escape every user-controlled field that gets interpolated into HTML.
    const safeReservation = {
      id: dbRes.id,
      customer_name: escapeHtml(dbRes.customer_name),
      customer_email: dbRes.customer_email, // used as recipient header, not in HTML
      reservation_date: dbRes.reservation_date,
      reservation_time: dbRes.reservation_time,
      guest_count: dbRes.guest_count,
      zone: dbRes.zone,
      occasion: dbRes.occasion,
      message: dbRes.message ? escapeHtml(dbRes.message) : "",
      unit_name: unitName,
    };
    const safeCancelReason = escapeHtml(cancel_reason || "");

    const cancellationToken = !is_cancellation ? (dbRes.cancellation_token || "") : "";
    
    // Use app URLs instead of raw Edge Function URLs
    const APP_URL = Deno.env.get("APP_URL") || "https://rondo-sportsbar-reservieren.de";
    const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "Rondo Sportsbar <reservierung@rondo-sportsbar-reservieren.de>";
    const cancelUrl = `${APP_URL}/reservierung/stornieren?id=${encodeURIComponent(dbRes.id)}&token=${encodeURIComponent(cancellationToken)}`;
    const modifyUrl = `${APP_URL}/reservierung/aendern?id=${encodeURIComponent(dbRes.id)}&token=${encodeURIComponent(cancellationToken)}`;

    let html: string;
    let subjectPrefix: string;

    if (is_cancellation) {
      html = buildCancellationEmailHtml(safeReservation as any, safeCancelReason);
      subjectPrefix = "Reservierung storniert";
    } else {
      html = buildEmailHtml({
        ...(safeReservation as any),
        cancel_url: cancelUrl,
        modify_url: modifyUrl,
        is_modification: !!is_modification,
        unit_name: unitName,
      });
      subjectPrefix = is_modification ? "Reservierung geändert" : "Reservierung bestätigt";
    }
    
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rondo Sportsbar <info@dev-lab24.de>",
        to: [dbRes.customer_email],
        subject: `${subjectPrefix} – ${formatDate(dbRes.reservation_date)}, ${dbRes.reservation_time} Uhr`,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("Resend error:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, email_id: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Email error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error sending email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
