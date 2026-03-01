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

    return htmlResponse(
      "Reservierung storniert",
      `Deine Reservierung für den ${formatDate(reservation.reservation_date)} um ${reservation.reservation_time} Uhr wurde erfolgreich storniert.`,
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
