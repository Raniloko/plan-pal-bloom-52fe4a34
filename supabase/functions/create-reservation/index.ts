import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ZONES = ["hauptbereich", "billard", "vip", "podest", "fenster"];
const VALID_OCCASIONS = ["sport", "feier", "essen", "billard", "sonstiges"];
const VALID_TIMES = [
  "14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30",
  "22:00","22:30","23:00",
];

// Simple in-memory rate limiting (per function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 3600000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function sanitize(str: string): string {
  return str.replace(/[\r\n]/g, "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: "Zu viele Anfragen. Bitte versuche es später erneut." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { date, time, guests, zone, anlass, name, email, phone, message, honeypot } = body;

    // Honeypot check
    if (honeypot && honeypot.trim() !== "") {
      // Silently accept but don't save (bot detected)
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side validation
    const errors: string[] = [];

    if (!date || !isValidDate(date)) errors.push("Ungültiges Datum.");
    if (!time || !VALID_TIMES.includes(time)) errors.push("Ungültige Uhrzeit.");
    if (!guests || guests < 1 || guests > 50) errors.push("Personenanzahl muss zwischen 1 und 50 liegen.");
    if (!zone || !VALID_ZONES.includes(zone)) errors.push("Ungültiger Bereich.");
    if (!anlass || !VALID_OCCASIONS.includes(anlass)) errors.push("Ungültiger Anlass.");
    if (!name || sanitize(name).length < 2 || sanitize(name).length > 100) errors.push("Name muss 2-100 Zeichen lang sein.");
    if (!email || !isValidEmail(sanitize(email))) errors.push("Ungültige E-Mail-Adresse.");
    if (!phone || sanitize(phone).length < 5 || sanitize(phone).length > 30) errors.push("Ungültige Telefonnummer.");
    if (message && message.length > 1000) errors.push("Nachricht darf maximal 1000 Zeichen lang sein.");

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: errors.join(" ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.from("reservations").insert({
      reservation_date: date,
      reservation_time: time,
      guest_count: guests,
      zone: zone,
      occasion: anlass,
      customer_name: sanitize(name),
      customer_email: sanitize(email),
      customer_phone: sanitize(phone),
      message: message ? sanitize(message).substring(0, 1000) : "",
      honeypot: "",
      status: "confirmed",
    }).select().single();

    if (error) {
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({ error: "Dieser Zeitslot ist leider bereits belegt. Bitte wähle einen anderen." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("DB error:", error.message);
      return new Response(
        JSON.stringify({ error: "Fehler beim Speichern der Reservierung." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, reservation_id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unerwarteter Fehler." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
