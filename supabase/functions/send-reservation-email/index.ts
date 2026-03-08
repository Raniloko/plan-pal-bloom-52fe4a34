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
}): string {
  const zoneLabel = ZONE_LABELS[reservation.zone] || reservation.zone;
  const title = reservation.is_modification ? "Reservierung geändert" : "Reservierung bestätigt";
  const accent = reservation.is_modification ? "#3b82f6" : "#22c55e";

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        
        <!-- Header -->
        <tr><td style="padding:28px 32px 20px;text-align:center;border-bottom:1px solid #f0f0f0;">
          <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a1a;letter-spacing:1px;">RONDO SPORTSBAR</p>
        </td></tr>

        <!-- Status -->
        <tr><td style="padding:24px 32px 16px;text-align:center;">
          <p style="margin:0;font-size:20px;font-weight:700;color:${accent};">${reservation.is_modification ? "✏️" : "✓"} ${title}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#666;">Hallo ${reservation.customer_name}!</p>
        </td></tr>

        <!-- Details -->
        <tr><td style="padding:8px 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;border:1px solid #eee;">
            <tr><td style="padding:14px 16px;border-bottom:1px solid #eee;">
              <table width="100%"><tr>
                <td style="color:#888;font-size:13px;">Datum</td>
                <td style="color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">${formatDate(reservation.reservation_date)}</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:14px 16px;border-bottom:1px solid #eee;">
              <table width="100%"><tr>
                <td style="color:#888;font-size:13px;">Uhrzeit</td>
                <td style="color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">${reservation.reservation_time} Uhr</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:14px 16px;border-bottom:1px solid #eee;">
              <table width="100%"><tr>
                <td style="color:#888;font-size:13px;">Personen</td>
                <td style="color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">${reservation.guest_count}</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:14px 16px;">
              <table width="100%"><tr>
                <td style="color:#888;font-size:13px;">Bereich</td>
                <td style="color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">${zoneLabel}</td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>

        ${reservation.message ? `
        <tr><td style="padding:0 32px 20px;">
          <p style="margin:0;color:#888;font-size:12px;margin-bottom:4px;">Deine Nachricht:</p>
          <p style="margin:0;color:#555;font-size:13px;font-style:italic;">"${reservation.message}"</p>
        </td></tr>` : ""}

        <!-- Actions -->
        <tr><td style="padding:0 32px 28px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0 0 12px;">Reservierung verwalten:</p>
          <a href="${reservation.modify_url}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600;margin-right:8px;">Ändern</a>
          <a href="${reservation.cancel_url}" style="display:inline-block;background:#fff;color:#dc2626;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600;border:1px solid #fca5a5;">Stornieren</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
          <p style="margin:0;color:#bbb;font-size:11px;">Rondo Sportsbar · ID: ${reservation.id.slice(0, 8).toUpperCase()}</p>
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
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr><td style="padding:28px 32px 20px;text-align:center;border-bottom:1px solid #f0f0f0;">
          <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a1a;letter-spacing:1px;">RONDO SPORTSBAR</p>
        </td></tr>
        <tr><td style="padding:24px 32px 16px;text-align:center;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#dc2626;">Reservierung storniert</p>
          <p style="margin:8px 0 0;font-size:14px;color:#666;">Hallo ${reservation.customer_name}, deine Reservierung wurde storniert.</p>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;border:1px solid #eee;">
            <tr><td style="padding:14px 16px;border-bottom:1px solid #eee;">
              <table width="100%"><tr>
                <td style="color:#888;font-size:13px;">Datum</td>
                <td style="color:#999;font-size:14px;text-align:right;text-decoration:line-through;">${formatDate(reservation.reservation_date)}</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:14px 16px;border-bottom:1px solid #eee;">
              <table width="100%"><tr>
                <td style="color:#888;font-size:13px;">Uhrzeit</td>
                <td style="color:#999;font-size:14px;text-align:right;text-decoration:line-through;">${reservation.reservation_time} Uhr</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:14px 16px;">
              <table width="100%"><tr>
                <td style="color:#888;font-size:13px;">Bereich</td>
                <td style="color:#999;font-size:14px;text-align:right;text-decoration:line-through;">${zoneLabel}</td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
        ${cancelReason ? `
        <tr><td style="padding:0 32px 20px;">
          <p style="margin:0;padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;color:#991b1b;font-size:13px;">
            <strong>Grund:</strong> ${cancelReason}
          </p>
        </td></tr>` : ""}
        <tr><td style="padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
          <p style="margin:0;color:#bbb;font-size:11px;">Rondo Sportsbar · ID: ${reservation.id.slice(0, 8).toUpperCase()}</p>
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

    if (!reservation || !reservation.customer_email) {
      return new Response(
        JSON.stringify({ error: "Missing reservation data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    
    // Fetch cancellation_token for secure links
    let cancellationToken = "";
    if (!is_cancellation) {
      const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: tokenData } = await supabase
        .from("reservations")
        .select("cancellation_token")
        .eq("id", reservation.id)
        .single();
      cancellationToken = tokenData?.cancellation_token || "";
    }
    
    const cancelUrl = `${SUPABASE_URL}/functions/v1/cancel-reservation?id=${reservation.id}&token=${cancellationToken}`;
    const modifyUrl = `${SUPABASE_URL}/functions/v1/modify-reservation?id=${reservation.id}&token=${cancellationToken}`;

    let html: string;
    let subjectPrefix: string;

    if (is_cancellation) {
      html = buildCancellationEmailHtml(reservation, cancel_reason || "");
      subjectPrefix = "Reservierung storniert";
    } else {
      html = buildEmailHtml({
        ...reservation,
        cancel_url: cancelUrl,
        modify_url: modifyUrl,
        is_modification: !!is_modification,
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
        to: [reservation.customer_email],
        subject: `${subjectPrefix} – ${formatDate(reservation.reservation_date)}, ${reservation.reservation_time} Uhr`,
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
