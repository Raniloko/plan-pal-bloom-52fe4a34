const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZONE_LABELS: Record<string, string> = {
  hauptbereich: "Restaurantbereich am 140-Zoll Screen",
  fenster: "Restaurantbereich am 75-Zoll Screen",
  billard: "Billard-Tisch",
  vip: "VIP-Raum",
  podest: "Podest",
};

const ZONE_INFO: Record<string, string> = {
  billard: "Abrechnung: 0,23 €/Min pro Tisch (ca. 13,80 €/Std). Die Abrechnung startet ab Spielbeginn und wird vor Ort bezahlt.",
  vip: "Mindestens 11 Personen erforderlich. Privater Bereich mit eigenem Service.",
  podest: "Erhöhter Bereich mit Platz für bis zu 33 Gäste.",
};

const OCCASION_LABELS: Record<string, string> = {
  sport: "Live-Sport schauen",
  feier: "Private Feier",
  essen: "Essen & Trinken",
  billard: "Billard / Kicker / Dart",
  sonstiges: "Sonstiges",
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
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
  const zoneInfo = ZONE_INFO[reservation.zone] || "";
  const occasionLabel = OCCASION_LABELS[reservation.occasion] || reservation.occasion;

  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#c8a960,#b8963f);padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:28px;color:#0a0a0a;font-weight:800;letter-spacing:1px;">RONDO SPORTSBAR</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#1a1a1a;letter-spacing:2px;">ESSEN · SPORT · BILLIARD</p>
        </td></tr>

        <!-- Confirmation Banner -->
        <tr><td style="background-color:#141414;padding:28px 40px;text-align:center;border-bottom:1px solid #222;">
          <div style="display:inline-block;background-color:${reservation.is_modification ? '#1a2a3a' : '#1a3d1a'};border:1px solid ${reservation.is_modification ? '#2d4a6d' : '#2d5a2d'};border-radius:8px;padding:12px 24px;">
            <span style="color:${reservation.is_modification ? '#60a5fa' : '#4ade80'};font-size:18px;font-weight:700;">${reservation.is_modification ? '✏️ Reservierung geändert' : '✓ Reservierung bestätigt'}</span>
          </div>
          <p style="color:#999;font-size:14px;margin:12px 0 0;">Hallo <strong style="color:#e5e5e5;">${reservation.customer_name}</strong>, ${reservation.is_modification ? 'deine Reservierung wurde aktualisiert!' : 'deine Reservierung ist eingegangen!'}</p>
        </td></tr>

        <!-- Details -->
        <tr><td style="background-color:#141414;padding:0 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr>
              <td style="padding:16px 20px;background-color:#1a1a1a;border-radius:8px 8px 0 0;border-bottom:1px solid #222;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#999;font-size:13px;width:40%;">📅 Datum</td>
                    <td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;">${formatDate(reservation.reservation_date)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;background-color:#1a1a1a;border-bottom:1px solid #222;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#999;font-size:13px;width:40%;">🕐 Uhrzeit</td>
                    <td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;">${reservation.reservation_time} Uhr</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;background-color:#1a1a1a;border-bottom:1px solid #222;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#999;font-size:13px;width:40%;">👥 Personen</td>
                    <td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;">${reservation.guest_count}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;background-color:#1a1a1a;border-bottom:1px solid #222;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#999;font-size:13px;width:40%;">📍 Bereich</td>
                    <td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;">${zoneLabel}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;background-color:#1a1a1a;border-radius:0 0 8px 8px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#999;font-size:13px;width:40%;">🎯 Anlass</td>
                    <td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;">${occasionLabel}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        ${zoneInfo ? `
        <!-- Zone Info -->
        <tr><td style="background-color:#141414;padding:0 40px 20px;">
          <div style="background-color:#2a2210;border:1px solid #c8a96040;border-radius:8px;padding:16px 20px;">
            <p style="margin:0;color:#c8a960;font-size:13px;font-weight:700;margin-bottom:4px;">ℹ️ Wichtige Info</p>
            <p style="margin:0;color:#d4c49a;font-size:13px;line-height:1.5;">${zoneInfo}</p>
          </div>
        </td></tr>
        ` : ""}

        ${reservation.message ? `
        <!-- Message -->
        <tr><td style="background-color:#141414;padding:0 40px 24px;">
          <p style="color:#999;font-size:13px;margin:0 0 4px;">💬 Deine Nachricht:</p>
          <p style="color:#ccc;font-size:14px;margin:0;font-style:italic;">"${reservation.message}"</p>
        </td></tr>
        ` : ""}

        <!-- Action Buttons -->
        <tr><td style="background-color:#141414;padding:0 40px 32px;text-align:center;">
          <p style="color:#666;font-size:13px;margin:0 0 16px;">Du möchtest etwas ändern?</p>
          <a href="${reservation.modify_url}" style="display:inline-block;background-color:#1a2a3a;border:1px solid #2d4a6d;color:#60a5fa;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;margin-right:12px;">
            ✏️ Reservierung ändern
          </a>
          <a href="${reservation.cancel_url}" style="display:inline-block;background-color:#3a1a1a;border:1px solid #5a2d2d;color:#f87171;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
            ✕ Stornieren
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#0d0d0d;padding:24px 40px;border-radius:0 0 12px 12px;border-top:1px solid #222;text-align:center;">
          <p style="margin:0;color:#666;font-size:12px;">Rondo Sportsbar · Essen · Sport · Billiard</p>
          <p style="margin:4px 0 0;color:#555;font-size:11px;">Wir bestätigen deine Reservierung ggf. noch telefonisch oder per E-Mail.</p>
          <p style="margin:8px 0 0;color:#444;font-size:11px;">Reservierungs-ID: ${reservation.id}</p>
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
  occasion: string;
}, cancelReason: string): string {
  const zoneLabel = ZONE_LABELS[reservation.zone] || reservation.zone;
  const occasionLabel = OCCASION_LABELS[reservation.occasion] || reservation.occasion;

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
          <p style="color:#999;font-size:14px;margin:12px 0 0;">Hallo <strong style="color:#e5e5e5;">${reservation.customer_name}</strong>, deine Reservierung wurde leider storniert.</p>
        </td></tr>
        <tr><td style="background-color:#141414;padding:0 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="padding:16px 20px;background-color:#1a1a1a;border-radius:8px 8px 0 0;border-bottom:1px solid #222;">
              <table width="100%"><tr><td style="color:#999;font-size:13px;">📅 Datum</td><td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;text-decoration:line-through;opacity:.6;">${formatDate(reservation.reservation_date)}</td></tr></table>
            </td></tr>
            <tr><td style="padding:16px 20px;background-color:#1a1a1a;border-bottom:1px solid #222;">
              <table width="100%"><tr><td style="color:#999;font-size:13px;">🕐 Uhrzeit</td><td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;text-decoration:line-through;opacity:.6;">${reservation.reservation_time} Uhr</td></tr></table>
            </td></tr>
            <tr><td style="padding:16px 20px;background-color:#1a1a1a;border-bottom:1px solid #222;">
              <table width="100%"><tr><td style="color:#999;font-size:13px;">👥 Personen</td><td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;text-decoration:line-through;opacity:.6;">${reservation.guest_count}</td></tr></table>
            </td></tr>
            <tr><td style="padding:16px 20px;background-color:#1a1a1a;border-radius:0 0 8px 8px;">
              <table width="100%"><tr><td style="color:#999;font-size:13px;">📍 Bereich</td><td style="color:#e5e5e5;font-size:15px;font-weight:600;text-align:right;text-decoration:line-through;opacity:.6;">${zoneLabel}</td></tr></table>
            </td></tr>
          </table>
        </td></tr>
        ${cancelReason ? `
        <tr><td style="background-color:#141414;padding:0 40px 24px;">
          <div style="background-color:#2a1a1a;border:1px solid #5a2d2d;border-radius:8px;padding:16px 20px;">
            <p style="margin:0;color:#f87171;font-size:13px;font-weight:700;margin-bottom:6px;">📋 Stornierungsgrund:</p>
            <p style="margin:0;color:#d4a4a4;font-size:14px;line-height:1.5;">${cancelReason}</p>
          </div>
        </td></tr>
        ` : ""}
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
    const cancelUrl = `${SUPABASE_URL}/functions/v1/cancel-reservation?id=${reservation.id}`;
    const modifyUrl = `${SUPABASE_URL}/functions/v1/modify-reservation?id=${reservation.id}`;

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
        subject: `${subjectPrefix} – ${formatDate(reservation.reservation_date)} um ${reservation.reservation_time} Uhr`,
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
