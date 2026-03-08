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

const OCCASION_LABELS: Record<string, string> = {
  sport: "Live-Sport schauen",
  feier: "Private Feier",
  essen: "Essen & Trinken",
  billard: "Billard spielen",
  sonstiges: "Sonstiges",
};

const VALID_ZONES = ["hauptbereich", "billard", "vip", "podest", "fenster"];
const VALID_OCCASIONS = ["sport", "feier", "essen", "billard", "sonstiges"];
const VALID_TIMES = [
  "14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30",
  "22:00","22:30","23:00",
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function styledPage(title: string, body: string): Response {
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} – Rondo Sportsbar</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#f5f5f5; font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; color:#1a1a1a; }
    .card { background:#fff; border:1px solid #e5e5e5; border-radius:16px; padding:40px; max-width:480px; width:100%; }
    .brand { text-align:center; font-size:14px; font-weight:800; color:#1a1a1a; letter-spacing:1px; margin-bottom:24px; }
    h2 { font-size:20px; font-weight:700; text-align:center; margin-bottom:20px; }
    label { display:block; color:#888; font-size:12px; font-weight:600; margin-bottom:4px; margin-top:14px; text-transform:uppercase; letter-spacing:0.5px; }
    input, select, textarea { width:100%; background:#fafafa; border:1px solid #e5e5e5; color:#1a1a1a; border-radius:8px; padding:10px 14px; font-size:14px; outline:none; font-family:inherit; }
    input:focus, select:focus, textarea:focus { border-color:#1a1a1a; }
    textarea { resize:vertical; min-height:60px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .btn { display:block; width:100%; text-align:center; padding:12px; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; border:none; margin-top:20px; }
    .btn-primary { background:#1a1a1a; color:#fff; }
    .btn-primary:hover { background:#333; }
    .current { background:#fafafa; border:1px solid #eee; border-radius:8px; padding:12px 16px; margin-bottom:8px; }
    .current span { color:#888; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
    .current p { color:#1a1a1a; font-size:14px; font-weight:600; margin-top:4px; }
    .icon { width:56px; height:56px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:16px; }
    .icon-ok { background:#f0fdf4; border:2px solid #bbf7d0; color:#22c55e; }
    .icon-err { background:#fef2f2; border:2px solid #fecaca; color:#dc2626; }
    .msg { text-align:center; }
    .msg p { color:#666; font-size:14px; line-height:1.6; }
    .footer { text-align:center; margin-top:24px; padding-top:16px; border-top:1px solid #f0f0f0; }
    .footer p { color:#bbb; font-size:11px; }
    .back-link { display:inline-block; margin-top:12px; color:#1a1a1a; font-size:13px; font-weight:600; text-decoration:none; }
    .back-link:hover { text-decoration:underline; }
  </style>
</head>
<body><div class="card">${body}</div></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");

  if (!id || !token) {
    return styledPage("Fehler", `<div class="msg"><div class="icon icon-err">✕</div><h2>Fehler</h2><p>Ungültiger Link.</p></div>`);
  }

  // Verify cancellation_token matches
  const { data: tokenCheck } = await supabase.from("reservations").select("cancellation_token").eq("id", id).single();
  if (!tokenCheck || tokenCheck.cancellation_token !== token) {
    return styledPage("Fehler", `<div class="msg"><div class="icon icon-err">✕</div><h2>Zugriff verweigert</h2><p>Dieser Link ist ungültig oder abgelaufen.</p></div>`);
  }

  if (req.method === "GET") {
    const { data: r, error } = await supabase.from("reservations").select("*").eq("id", id).single();
    if (error || !r) {
      return styledPage("Nicht gefunden", `<div class="msg"><div class="icon icon-err">✕</div><h2>Nicht gefunden</h2><p>Diese Reservierung wurde nicht gefunden.</p></div>`);
    }
    if (r.status === "cancelled") {
      return styledPage("Storniert", `<div class="msg"><div class="icon icon-err">✕</div><h2>Storniert</h2><p>Diese Reservierung wurde bereits storniert.</p></div>`);
    }

    const zoneOptions = VALID_ZONES.map(z => `<option value="${z}" ${r.zone === z ? "selected" : ""}>${ZONE_LABELS[z] || z}</option>`).join("");
    const occasionOptions = VALID_OCCASIONS.map(o => `<option value="${o}" ${r.occasion === o ? "selected" : ""}>${OCCASION_LABELS[o] || o}</option>`).join("");
    const timeOptions = VALID_TIMES.map(t => `<option value="${t}" ${r.reservation_time === t ? "selected" : ""}>${t} Uhr</option>`).join("");

    const body = `
      <div class="brand">RONDO SPORTSBAR</div>
      <h2>Reservierung ändern</h2>
      <div class="current">
        <span>Aktuelle Reservierung</span>
        <p>${formatDate(r.reservation_date)} · ${r.reservation_time} Uhr · ${r.guest_count} Pers. · ${ZONE_LABELS[r.zone] || r.zone}</p>
      </div>
      <form method="POST" action="?id=${id}">
        <div class="grid2">
          <div><label>Datum</label><input type="date" name="date" value="${r.reservation_date}" min="${new Date().toISOString().split("T")[0]}" required></div>
          <div><label>Uhrzeit</label><select name="time" required>${timeOptions}</select></div>
        </div>
        <label>Personen</label>
        <input type="number" name="guests" value="${r.guest_count}" min="1" max="50" required>
        <label>Bereich</label>
        <select name="zone" required>${zoneOptions}</select>
        <label>Anlass</label>
        <select name="occasion" required>${occasionOptions}</select>
        <label>Nachricht (optional)</label>
        <textarea name="message">${r.message || ""}</textarea>
        <button type="submit" class="btn btn-primary">Änderungen speichern</button>
      </form>
      <div class="footer"><p>ID: ${id.slice(0, 8).toUpperCase()}</p></div>`;

    return styledPage("Reservierung ändern", body);
  }

  if (req.method === "POST") {
    try {
      const formData = await req.formData();
      const date = formData.get("date") as string;
      const time = formData.get("time") as string;
      const guests = parseInt(formData.get("guests") as string);
      const zone = formData.get("zone") as string;
      const occasion = formData.get("occasion") as string;
      const message = (formData.get("message") as string || "").trim();

      const errors: string[] = [];
      if (!date) errors.push("Datum fehlt.");
      if (!VALID_TIMES.includes(time)) errors.push("Ungültige Uhrzeit.");
      if (!guests || guests < 1 || guests > 50) errors.push("Personenanzahl ungültig.");
      if (!VALID_ZONES.includes(zone)) errors.push("Ungültiger Bereich.");
      if (!VALID_OCCASIONS.includes(occasion)) errors.push("Ungültiger Anlass.");

      if (errors.length > 0) {
        return styledPage("Fehler", `<div class="msg"><div class="icon icon-err">✕</div><h2>Fehler</h2><p>${errors.join(" ")}</p></div><div class="footer"><a href="?id=${id}" class="back-link">← Zurück</a></div>`);
      }

      const { data: original } = await supabase.from("reservations").select("*").eq("id", id).single();
      if (!original || original.status === "cancelled") {
        return styledPage("Fehler", `<div class="msg"><div class="icon icon-err">✕</div><h2>Fehler</h2><p>Reservierung nicht gefunden oder storniert.</p></div>`);
      }

      const { error: updateError } = await supabase.from("reservations").update({
        reservation_date: date,
        reservation_time: time,
        guest_count: guests,
        zone,
        occasion,
        message: message.substring(0, 1000),
      }).eq("id", id);

      if (updateError) {
        console.error("Update error:", updateError);
        return styledPage("Fehler", `<div class="msg"><div class="icon icon-err">✕</div><h2>Fehler</h2><p>Die Änderung konnte nicht gespeichert werden.</p></div><div class="footer"><a href="?id=${id}" class="back-link">← Zurück</a></div>`);
      }

      // Send modification email (non-blocking)
      try {
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
              id,
              customer_name: original.customer_name,
              customer_email: original.customer_email,
              reservation_date: date,
              reservation_time: time,
              guest_count: guests,
              zone,
              occasion,
              message,
            },
            is_modification: true,
          }),
        });
      } catch (emailErr) {
        console.error("Email failed (non-blocking):", emailErr);
      }

      const body = `
        <div class="brand">RONDO SPORTSBAR</div>
        <div class="msg">
          <div class="icon icon-ok">✓</div>
          <h2>Reservierung geändert</h2>
          <p>Deine Reservierung wurde aktualisiert.</p>
        </div>
        <div class="current" style="margin-top:16px;">
          <p>${formatDate(date)} · ${time} Uhr · ${guests} Pers.</p>
          <p>${ZONE_LABELS[zone] || zone}</p>
        </div>
        <p style="text-align:center;color:#888;font-size:12px;margin-top:12px;">Bestätigung per E-Mail gesendet.</p>
        <div class="footer"><p>ID: ${id.slice(0, 8).toUpperCase()}</p></div>`;

      return styledPage("Reservierung geändert", body);
    } catch (err) {
      console.error("Modify error:", err);
      return styledPage("Fehler", `<div class="msg"><div class="icon icon-err">✕</div><h2>Fehler</h2><p>Ein unerwarteter Fehler ist aufgetreten.</p></div>`);
    }
  }

  return styledPage("Fehler", `<div class="msg"><div class="icon icon-err">✕</div><h2>Ungültige Anfrage</h2></div>`);
});
