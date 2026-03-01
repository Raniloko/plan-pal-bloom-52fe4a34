import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const OCCASION_LABELS: Record<string, string> = {
  sport: "Live-Sport schauen",
  feier: "Private Feier",
  essen: "Essen & Trinken",
  billard: "Billard / Kicker / Dart",
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

function htmlPage(title: string, body: string): Response {
  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} – Rondo Sportsbar</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background:#0a0a0a; font-family:'Helvetica Neue',Arial,sans-serif; color:#e5e5e5; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
  .card { background:#141414; border:1px solid #222; border-radius:16px; padding:40px; max-width:520px; width:100%; }
  .brand { text-align:center; margin-bottom:24px; }
  .brand h1 { color:#c8a960; font-size:20px; letter-spacing:2px; font-weight:800; }
  .brand p { color:#666; font-size:11px; letter-spacing:1px; }
  h2 { font-size:22px; margin-bottom:20px; text-align:center; }
  label { display:block; color:#999; font-size:13px; margin-bottom:4px; margin-top:16px; }
  input, select, textarea { width:100%; background:#1a1a1a; border:1px solid #333; color:#e5e5e5; border-radius:8px; padding:10px 14px; font-size:14px; outline:none; }
  input:focus, select:focus, textarea:focus { border-color:#c8a960; }
  select { appearance:none; cursor:pointer; }
  textarea { resize:vertical; min-height:60px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .btn { display:inline-block; width:100%; text-align:center; padding:14px; border-radius:8px; font-size:15px; font-weight:700; cursor:pointer; border:none; margin-top:24px; transition:opacity .2s; }
  .btn:hover { opacity:.9; }
  .btn-primary { background:linear-gradient(135deg,#c8a960,#b8963f); color:#0a0a0a; }
  .btn-cancel { background:#3a1a1a; border:1px solid #5a2d2d; color:#f87171; margin-top:12px; font-size:13px; padding:10px; }
  .current { background:#1a1a1a; border:1px solid #333; border-radius:8px; padding:12px 16px; margin-bottom:8px; }
  .current span { color:#999; font-size:12px; }
  .current p { color:#e5e5e5; font-size:14px; font-weight:600; }
  .success-icon { width:64px; height:64px; border-radius:50%; background:#1a3d1a; border:2px solid #2d5a2d; color:#4ade80; display:inline-flex; align-items:center; justify-content:center; font-size:32px; margin-bottom:16px; }
  .error-icon { width:64px; height:64px; border-radius:50%; background:#3a1a1a; border:2px solid #5a2d2d; color:#f87171; display:inline-flex; align-items:center; justify-content:center; font-size:32px; margin-bottom:16px; }
  .msg { text-align:center; }
  .msg p { color:#999; font-size:14px; line-height:1.6; }
  .footer { text-align:center; margin-top:24px; padding-top:20px; border-top:1px solid #222; }
  .footer p { color:#555; font-size:11px; }
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

  if (!id) {
    return htmlPage("Fehler", `<div class="msg"><div class="error-icon">✕</div><h2>Fehler</h2><p>Keine Reservierungs-ID angegeben.</p></div>`);
  }

  // GET = show form, POST = process update
  if (req.method === "GET") {
    const { data: r, error } = await supabase.from("reservations").select("*").eq("id", id).single();
    if (error || !r) {
      return htmlPage("Nicht gefunden", `<div class="msg"><div class="error-icon">✕</div><h2>Nicht gefunden</h2><p>Diese Reservierung wurde nicht gefunden.</p></div>`);
    }
    if (r.status === "cancelled") {
      return htmlPage("Storniert", `<div class="msg"><div class="error-icon">✕</div><h2>Bereits storniert</h2><p>Diese Reservierung wurde bereits storniert und kann nicht mehr geändert werden.</p></div>`);
    }

    const zoneOptions = VALID_ZONES.map(z => `<option value="${z}" ${r.zone === z ? "selected" : ""}>${ZONE_LABELS[z] || z}</option>`).join("");
    const occasionOptions = VALID_OCCASIONS.map(o => `<option value="${o}" ${r.occasion === o ? "selected" : ""}>${OCCASION_LABELS[o] || o}</option>`).join("");
    const timeOptions = VALID_TIMES.map(t => `<option value="${t}" ${r.reservation_time === t ? "selected" : ""}>${t} Uhr</option>`).join("");

    const body = `
      <div class="brand"><h1>RONDO SPORTSBAR</h1><p>ESSEN · SPORT · BILLIARD</p></div>
      <h2>✏️ Reservierung ändern</h2>
      <div class="current"><span>Aktuelle Reservierung</span><p>${formatDate(r.reservation_date)} um ${r.reservation_time} Uhr · ${r.guest_count} Personen · ${ZONE_LABELS[r.zone] || r.zone}</p></div>
      <form method="POST" action="?id=${id}">
        <div class="grid2">
          <div><label>📅 Datum</label><input type="date" name="date" value="${r.reservation_date}" min="${new Date().toISOString().split("T")[0]}" required></div>
          <div><label>🕐 Uhrzeit</label><select name="time" required>${timeOptions}</select></div>
        </div>
        <label>👥 Personenanzahl</label>
        <input type="number" name="guests" value="${r.guest_count}" min="1" max="50" required>
        <label>📍 Bereich</label>
        <select name="zone" required>${zoneOptions}</select>
        <label>🎯 Anlass</label>
        <select name="occasion" required>${occasionOptions}</select>
        <label>💬 Nachricht (optional)</label>
        <textarea name="message">${r.message || ""}</textarea>
        <button type="submit" class="btn btn-primary">Änderungen speichern</button>
      </form>
      <div class="footer"><p>Reservierungs-ID: ${id}</p></div>`;

    return htmlPage("Reservierung ändern", body);
  }

  // POST - process update
  if (req.method === "POST") {
    try {
      const formData = await req.formData();
      const date = formData.get("date") as string;
      const time = formData.get("time") as string;
      const guests = parseInt(formData.get("guests") as string);
      const zone = formData.get("zone") as string;
      const occasion = formData.get("occasion") as string;
      const message = (formData.get("message") as string || "").trim();

      // Validate
      const errors: string[] = [];
      if (!date) errors.push("Datum fehlt.");
      if (!VALID_TIMES.includes(time)) errors.push("Ungültige Uhrzeit.");
      if (!guests || guests < 1 || guests > 50) errors.push("Personenanzahl ungültig.");
      if (!VALID_ZONES.includes(zone)) errors.push("Ungültiger Bereich.");
      if (!VALID_OCCASIONS.includes(occasion)) errors.push("Ungültiger Anlass.");

      if (errors.length > 0) {
        return htmlPage("Fehler", `<div class="msg"><div class="error-icon">✕</div><h2>Fehler</h2><p>${errors.join(" ")}</p></div><div class="footer"><a href="?id=${id}" style="color:#c8a960;">← Zurück zum Formular</a></div>`);
      }

      // Get original reservation for email
      const { data: original } = await supabase.from("reservations").select("*").eq("id", id).single();
      if (!original || original.status === "cancelled") {
        return htmlPage("Fehler", `<div class="msg"><div class="error-icon">✕</div><h2>Fehler</h2><p>Reservierung nicht gefunden oder bereits storniert.</p></div>`);
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
        return htmlPage("Fehler", `<div class="msg"><div class="error-icon">✕</div><h2>Fehler</h2><p>Die Änderung konnte nicht gespeichert werden.</p></div><div class="footer"><a href="?id=${id}" style="color:#c8a960;">← Zurück zum Formular</a></div>`);
      }

      // Send confirmation email for the modification
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
        <div class="brand"><h1>RONDO SPORTSBAR</h1><p>ESSEN · SPORT · BILLIARD</p></div>
        <div class="msg">
          <div class="success-icon">✓</div>
          <h2 style="color:#4ade80;">Reservierung geändert!</h2>
          <p>Deine Reservierung wurde erfolgreich aktualisiert:</p>
        </div>
        <div class="current" style="margin-top:16px;">
          <p>📅 ${formatDate(date)} um ${time} Uhr</p>
          <p>👥 ${guests} Personen · ${ZONE_LABELS[zone] || zone}</p>
          <p>🎯 ${OCCASION_LABELS[occasion] || occasion}</p>
        </div>
        <p style="text-align:center;color:#666;font-size:13px;margin-top:16px;">Du erhältst eine aktualisierte Bestätigung per E-Mail.</p>
        <div class="footer"><p>Reservierungs-ID: ${id}</p></div>`;

      return htmlPage("Reservierung geändert", body);
    } catch (err) {
      console.error("Modify error:", err);
      return htmlPage("Fehler", `<div class="msg"><div class="error-icon">✕</div><h2>Fehler</h2><p>Ein unerwarteter Fehler ist aufgetreten.</p></div>`);
    }
  }

  return htmlPage("Fehler", `<div class="msg"><div class="error-icon">✕</div><h2>Ungültige Anfrage</h2></div>`);
});
