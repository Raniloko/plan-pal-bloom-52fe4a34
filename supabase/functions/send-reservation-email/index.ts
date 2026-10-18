import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { escapeHtml, formatDateShort } from "../_shared/email.ts";
import { buildCancellationEmail, buildEmail } from "./templates.ts";

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
      reservation_time: String(dbRes.reservation_time).slice(0, 5),
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

    let mail: { html: string; text: string };
    let subjectPrefix: string;

    if (is_cancellation) {
      mail = buildCancellationEmail(safeReservation, safeCancelReason, APP_URL);
      subjectPrefix = "Reservierung storniert";
    } else {
      mail = buildEmail(safeReservation, {
        modifyUrl: cancellationToken ? modifyUrl : `${APP_URL}/reservierung`,
        cancelUrl: cancellationToken ? cancelUrl : `${APP_URL}/reservierung`,
        isModification: !!is_modification,
        appUrl: APP_URL,
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
        from: EMAIL_FROM,
        to: [dbRes.customer_email],
        subject: `${subjectPrefix} – ${formatDateShort(dbRes.reservation_date)}, ${String(dbRes.reservation_time).slice(0, 5)} Uhr`,
        html: mail.html,
        text: mail.text,
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
