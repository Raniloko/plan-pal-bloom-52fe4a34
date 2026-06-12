import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// deno-lint-ignore no-explicit-any
async function logActivity(sb: any, action: string, entityType: string, entityId?: string, details?: string) {
  try {
    await sb.from("activity_log").insert({ action, entity_type: entityType, entity_id: entityId || null, details: details || null });
  } catch (e) { console.error("Activity log (non-blocking):", e); }
}

// Per-IP rate limit for login-attempt logging to prevent an unauthenticated
// attacker from spamming fake failures to lock out admin accounts.
const loginLogRate = new Map<string, { count: number; resetAt: number }>();
const LOGIN_LOG_LIMIT = 10;
const LOGIN_LOG_WINDOW_MS = 10 * 60 * 1000;
function loginLogRateLimited(ip: string): boolean {
  const now = Date.now();
  const e = loginLogRate.get(ip);
  if (!e || now > e.resetAt) {
    loginLogRate.set(ip, { count: 1, resetAt: now + LOGIN_LOG_WINDOW_MS });
    return false;
  }
  e.count++;
  return e.count > LOGIN_LOG_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse body first to check if action is public
    const body = await req.json();
    const { action } = body;

    // Public actions that don't require auth.
    // NOTE: `log_login_attempt` is intentionally NOT public — exposing it
    // would let attackers log fake failed attempts to lock out any admin.
    // It is now invoked internally by `check_login_attempts` instead.
    const PUBLIC_ACTIONS = ["check_login_attempts", "get_settings"];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!PUBLIC_ACTIONS.includes(action)) {
      // Auth check: verify the caller is an authenticated admin
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return error("Nicht autorisiert", 401);
      }

      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return error("Nicht autorisiert", 401);
      }

      const userId = claimsData.claims.sub as string;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        return error("Keine Admin-Berechtigung", 403);
      }
    }

    switch (action) {
      case "check_admin": {
        // Reaching this point already proves the caller is an authenticated admin
        // (the auth/role gate above runs for every non-public action).
        return ok({ admin: true });
      }

      case "fetch_dashboard": {
        const { date } = body;
        if (!date) return error("date required", 400);
        const [r, u, w, b] = await Promise.all([
          supabase.from("reservations").select("*").eq("reservation_date", date).neq("status", "cancelled"),
          supabase.from("units").select("*").order("position_index"),
          supabase.from("waitlist").select("*").in("status", ["waiting", "notified"]).order("desired_date").order("desired_time"),
          supabase.from("unit_blocks").select("*").lte("start_date", date).gte("end_date", date),
        ]);
        if (r.error) return error(r.error.message, 500);
        if (u.error) return error(u.error.message, 500);
        const blocks = b.data || [];
        const blockedSet = new Set(blocks.map((x: any) => x.unit_id));
        const units = (u.data || []).map((unit: any) => ({
          ...unit,
          status: blockedSet.has(unit.id) ? "blocked" : unit.status,
          active_block: blocks.find((x: any) => x.unit_id === unit.id) || null,
        }));
        return ok({ reservations: r.data, units, waitlist: w.data || [], unit_blocks: blocks });
      }

      case "check_in": {
        const { reservation_id, checked_in } = body;
        if (!reservation_id) return error("reservation_id required", 400);
        const newStatus = checked_in ? "confirmed" : "checked_in";
        const updatePayload: Record<string, unknown> = {
          status: newStatus,
          cancellation_token: null,
          // Set check-in timestamp on check-in, clear it on undo
          checked_in_at: checked_in ? null : new Date().toISOString(),
        };
        const { error: err } = await supabase
          .from("reservations")
          .update(updatePayload)
          .eq("id", reservation_id);
        if (err) return error(err.message, 500);
        await logActivity(supabase, checked_in ? "check_out" : "check_in", "reservation", reservation_id);
        return ok({ status: newStatus });
      }

      case "check_out": {
        const { reservation_id } = body;
        if (!reservation_id) return error("reservation_id required", 400);
        const { error: err } = await supabase
          .from("reservations")
          .update({ status: "checked_out", unit_id: null, cancellation_token: null })
          .eq("id", reservation_id);
        if (err) return error(err.message, 500);
        await logActivity(supabase, "check_out", "reservation", reservation_id);
        return ok({ status: "checked_out" });
      }

      case "cancel": {
        const { reservation_id, reason } = body;
        if (!reservation_id) return error("reservation_id required", 400);

        // Fetch reservation data first for the cancellation email
        const { data: cancelResData } = await supabase
          .from("reservations")
          .select("*")
          .eq("id", reservation_id)
          .single();

        const { error: err } = await supabase
          .from("reservations")
          .update({ status: "cancelled", cancellation_reason: reason || "Admin-Stornierung", cancellation_token: null })
          .eq("id", reservation_id);
        if (err) return error(err.message, 500);
        await logActivity(supabase, "cancel", "reservation", reservation_id, reason || "Admin-Stornierung");

        // Send cancellation email with full reservation data
        if (cancelResData) {
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
                  id: cancelResData.id,
                  customer_name: cancelResData.customer_name,
                  customer_email: cancelResData.customer_email,
                  reservation_date: cancelResData.reservation_date,
                  reservation_time: cancelResData.reservation_time,
                  guest_count: cancelResData.guest_count,
                  zone: cancelResData.zone,
                },
                is_cancellation: true,
                cancel_reason: reason || "Admin-Stornierung",
              }),
            });
          } catch (e) {
            console.error("Email error (non-blocking):", e);
          }
        }

        return ok({ status: "cancelled" });
      }

      case "block_unit": {
        const { unit_id, blocked, start_date, end_date, reason } = body;
        if (!unit_id) return error("unit_id required", 400);
        // `blocked` indicates current state: if true, the unit is already blocked → unblock.
        // If false, we create a new block for the given date range (default: today only).
        if (blocked) {
          // Unblock: remove all blocks for this unit that cover the reference date,
          // or all blocks if no date was provided.
          const ref = start_date || new Date().toISOString().slice(0, 10);
          const { data: existing } = await supabase
            .from("unit_blocks")
            .select("id")
            .eq("unit_id", unit_id)
            .lte("start_date", ref)
            .gte("end_date", ref);
          if (existing && existing.length > 0) {
            const ids = existing.map((x: any) => x.id);
            const { error: delErr } = await supabase.from("unit_blocks").delete().in("id", ids);
            if (delErr) return error(delErr.message, 500);
          }
          // Reset legacy units.status if it was blocked
          await supabase.from("units").update({ status: "free" }).eq("id", unit_id).eq("status", "blocked");
          await logActivity(supabase, "unblock_unit", "unit", unit_id);
          return ok({ status: "free" });
        } else {
          const today = new Date().toISOString().slice(0, 10);
          const s = start_date || today;
          const e = end_date || s;
          if (e < s) return error("end_date before start_date", 400);
          const { error: insErr } = await supabase
            .from("unit_blocks")
            .insert({ unit_id, start_date: s, end_date: e, reason: reason || null });
          if (insErr) return error(insErr.message, 500);
          await logActivity(supabase, "block_unit", "unit", unit_id, `${s} → ${e}`);
          return ok({ status: "blocked", start_date: s, end_date: e });
        }
      }

      case "update_notes": {
        const { unit_id, notes } = body;
        if (!unit_id) return error("unit_id required", 400);
        const { error: err } = await supabase
          .from("units")
          .update({ notes: notes || "" })
          .eq("id", unit_id);
        if (err) return error(err.message, 500);
        return ok({ saved: true });
      }

      case "assign_unit": {
        const { reservation_id, unit_id } = body;
        if (!reservation_id) return error("reservation_id required", 400);

        // Check for double-booking: is this unit already assigned to another active reservation at the same time?
        if (unit_id) {
          // Get the reservation being assigned
          const { data: thisRes } = await supabase
            .from("reservations")
            .select("reservation_date, reservation_time")
            .eq("id", reservation_id)
            .single();

          if (thisRes) {
            const { data: conflicts } = await supabase
              .from("reservations")
              .select("id, customer_name, reservation_time")
              .eq("unit_id", unit_id)
              .eq("reservation_date", thisRes.reservation_date)
              .neq("id", reservation_id)
              .not("status", "in", '("cancelled","checked_out")');

            // Check time overlap (within 2h window)
            if (conflicts && conflicts.length > 0) {
              // Load duration setting
              const { data: settingsData } = await supabase
                .from("settings")
                .select("value")
                .eq("key", "reservation_duration")
                .single();
              const durMin = settingsData?.value ? Number(settingsData.value) : 120;

              const [th, tm] = thisRes.reservation_time.split(":").map(Number);
              const thisStart = th * 60 + tm;
              const thisEnd = thisStart + durMin;

              const overlapping = conflicts.filter(c => {
                const [ch, cm] = c.reservation_time.split(":").map(Number);
                const cStart = ch * 60 + cm;
                const cEnd = cStart + durMin;
                return thisStart < cEnd && thisEnd > cStart;
              });

              if (overlapping.length > 0) {
                const c = overlapping[0];
                return error(
                  `Dieser Tisch ist bereits um ${c.reservation_time.slice(0, 5)} an ${c.customer_name} vergeben.`,
                  409
                );
              }
            }
          }
        }

        const { error: err } = await supabase
          .from("reservations")
          .update({ unit_id: unit_id || null })
          .eq("id", reservation_id);
        if (err) return error(err.message, 500);
        await logActivity(supabase, "assign_unit", "reservation", reservation_id, unit_id ? `Unit: ${unit_id}` : "Zuweisung entfernt");
        return ok({ assigned: true });
      }

      case "notify_waitlist": {
        const { waitlist_id } = body;
        if (!waitlist_id) return error("waitlist_id required", 400);
        const { data: wEntry, error: wErr } = await supabase
          .from("waitlist")
          .select("*")
          .eq("id", waitlist_id)
          .single();
        if (wErr || !wEntry) return error("Waitlist entry not found", 404);

        const { error: updErr } = await supabase
          .from("waitlist")
          .update({ status: "notified", notified_at: new Date().toISOString() })
          .eq("id", waitlist_id);
        if (updErr) return error(updErr.message, 500);

        try {
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY) {
            const escapeHtml = (s: unknown) =>
              String(s ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
              body: JSON.stringify({
                from: "Rondo <info@dev-lab24.de>",
                to: [wEntry.guest_email],
                subject: "Platz verfügbar – Rondo",
                html: `<p>Hallo ${escapeHtml(wEntry.guest_name)},</p><p>Es ist ein Platz für Sie verfügbar geworden! Bitte melden Sie sich zeitnah bei uns, um Ihre Reservierung zu bestätigen.</p><p>Gewünschtes Datum: ${escapeHtml(wEntry.desired_date)}<br>Gewünschte Uhrzeit: ${escapeHtml(wEntry.desired_time)}<br>Bereich: ${escapeHtml(wEntry.area)}</p><p>Mit freundlichen Grüßen,<br>Ihr Rondo Team</p>`,
              }),
            });
          }
        } catch (e) {
          console.error("Waitlist email error (non-blocking):", e);
        }

        return ok({ status: "notified" });
      }

      case "get_available_units": {
        const { area, date, time, guest_count } = body;
        if (!area || !date || !time) return error("area, date, time required", 400);

        // Load duration setting
        const { data: settingsData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "reservation_duration")
          .single();
        const baseDur = settingsData?.value ? Number(settingsData.value) : 120;
        // Billard: block the full booked play time (max 2h) so two reservations
        // never collide on the same table inside that window.
        const durMin = area === "billard" ? Math.min(baseDur, 120) : baseDur;

        // All units in area
        const areaFilter = area === "hauptbereich"
          ? ["hauptbereich", "restaurant"]
          : area === "billard"
          ? ["billard", "kicker", "dart"]
          : [area];
        const { data: allUnits } = await supabase
          .from("units")
          .select("*")
          .in("area", areaFilter)
          .order("position_index");

        // Date-range blocks
        const { data: dayBlocks } = await supabase
          .from("unit_blocks")
          .select("unit_id")
          .lte("start_date", date)
          .gte("end_date", date);
        const blockedIds = new Set((dayBlocks || []).map((b: any) => b.unit_id));

        // Active reservations same date/area
        const { data: dayRes } = await supabase
          .from("reservations")
          .select("unit_id, reservation_time, status")
          .eq("reservation_date", date)
          .not("status", "in", '("cancelled","checked_out")');

        const [hh, mm] = time.split(":").map(Number);
        const wantStart = hh * 60 + mm;
        const wantEnd = wantStart + durMin;

        const free = (allUnits || []).filter((u: any) => {
          if (u.status === "blocked") return false;
          if (blockedIds.has(u.id)) return false;
          const conflicts = (dayRes || []).filter((r: any) => r.unit_id === u.id).some((r: any) => {
            const [ch, cm] = (r.reservation_time as string).split(":").map(Number);
            const cStart = ch * 60 + cm;
            const cEnd = cStart + durMin;
            return wantStart < cEnd && wantEnd > cStart;
          });
          return !conflicts;
        });

        const gc = Number(guest_count) || 2;
        if (area === "billard") {
          // Billard: assign in numeric order 1..8 (only among free tables)
          const num = (n: string) => {
            const m = (n || "").match(/\d+/);
            return m ? parseInt(m[0], 10) : 9999;
          };
          free.sort((a: any, b: any) => num(a.name) - num(b.name));
        } else {
          // Sort: capacity >= guest_count first (smallest fitting), then rest by capacity asc
          free.sort((a: any, b: any) => {
            const fa = (a.capacity || 0) >= gc ? 0 : 1;
            const fb = (b.capacity || 0) >= gc ? 0 : 1;
            if (fa !== fb) return fa - fb;
            return (a.capacity || 0) - (b.capacity || 0);
          });
        }

        return ok({ units: free, duration: durMin });
      }

      case "convert_waitlist": {
        const { waitlist_id, unit_id, guest_count, reservation_time, reservation_date, allow_overbook } = body;
        if (!waitlist_id) return error("waitlist_id required", 400);

        const { data: wEntry, error: wErr } = await supabase
          .from("waitlist")
          .select("*")
          .eq("id", waitlist_id)
          .single();
        if (wErr || !wEntry) return error("Wartelisten-Eintrag nicht gefunden", 404);
        if (wEntry.status === "converted") return error("Bereits konvertiert", 409);

        const finalDate = reservation_date || wEntry.desired_date;
        const finalTime = (reservation_time || wEntry.desired_time || "").slice(0, 5);
        const finalGuests = Number(guest_count) || 2;
        const zone = wEntry.area;

        // Compute duration for overlap window
        const { data: settingsData } = await supabase
          .from("settings").select("value").eq("key", "reservation_duration").single();
        const baseDur = settingsData?.value ? Number(settingsData.value) : 120;
        const durMin = zone === "billard" ? Math.min(baseDur, 120) : baseDur;

        const payload = {
          customer_name: wEntry.guest_name,
          customer_email: wEntry.guest_email,
          customer_phone: wEntry.guest_phone,
          guest_count: finalGuests,
          zone,
          occasion: "Warteliste",
          status: "confirmed",
          message: "Aus Warteliste konvertiert",
        };

        let newResId: string | null = null;
        let assignedUnitId: string | null = unit_id || null;

        if (zone === "billard" && !unit_id && !allow_overbook) {
          // Atomic auto-pick of lowest-numbered free billard table
          const { data: autoData, error: autoErr } = await supabase.rpc("reserve_billard_auto", {
            p_date: finalDate,
            p_time: finalTime,
            p_duration_min: durMin,
            p_payload: payload,
          });
          if (autoErr) {
            if (autoErr.message?.includes("no_free_billard")) {
              return error("Kein Billardtisch mehr frei (Race-Condition vermieden)", 409);
            }
            return error(autoErr.message, 500);
          }
          const row = Array.isArray(autoData) ? autoData[0] : autoData;
          newResId = row?.reservation_id;
          assignedUnitId = row?.unit_id;
        } else {
          // Atomic insert with overlap recheck under per-day lock
          const { data: rid, error: rpcErr } = await supabase.rpc("reserve_atomic", {
            p_unit_id: allow_overbook ? null : assignedUnitId,
            p_date: finalDate,
            p_time: finalTime,
            p_duration_min: durMin,
            p_payload: payload,
          });
          if (rpcErr) {
            if (rpcErr.message?.includes("unit_conflict") || rpcErr.code === "23505") {
              return error("Tisch nicht mehr frei (gleichzeitige Buchung)", 409);
            }
            return error(rpcErr.message, 500);
          }
          newResId = rid as string;
        }

        const { data: newRes } = await supabase
          .from("reservations").select("*").eq("id", newResId!).single();
        if (!newRes) return error("Reservierung konnte nicht geladen werden", 500);

        await supabase
          .from("waitlist")
          .update({ status: "converted", notified_at: new Date().toISOString() })
          .eq("id", waitlist_id);

        await logActivity(supabase, "convert_waitlist", "reservation", newRes.id, `Aus Warteliste ${waitlist_id}`);

        // Send confirmation email (non-blocking)
        try {
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          await fetch(`${SUPABASE_URL}/functions/v1/send-reservation-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
            body: JSON.stringify({
              reservation: {
                id: newRes.id,
                customer_name: newRes.customer_name,
                customer_email: newRes.customer_email,
                reservation_date: newRes.reservation_date,
                reservation_time: newRes.reservation_time,
                guest_count: newRes.guest_count,
                zone: newRes.zone,
                occasion: newRes.occasion,
                message: newRes.message || "",
              },
            }),
          });
        } catch (e) {
          console.error("Confirmation email error (non-blocking):", e);
        }

        return ok({ reservation_id: newRes.id });
      }

      case "resend_email": {
        const { reservation_id } = body;
        if (!reservation_id) return error("reservation_id required", 400);
        const { data: resData, error: rErr } = await supabase
          .from("reservations")
          .select("*")
          .eq("id", reservation_id)
          .single();
        if (rErr || !resData) return error("Reservation not found", 404);

        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-reservation-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            reservation: {
              id: resData.id,
              customer_name: resData.customer_name,
              customer_email: resData.customer_email,
              reservation_date: resData.reservation_date,
              reservation_time: resData.reservation_time,
              guest_count: resData.guest_count,
              zone: resData.zone,
              occasion: resData.occasion,
              message: resData.message || "",
            },
          }),
        });
        const emailResult = await emailRes.json();
        if (!emailRes.ok) return error(emailResult?.error || "Email failed", 500);
        return ok({ sent: true });
      }

      case "update_reservation": {
        const { reservation_id, updates } = body;
        if (!reservation_id || !updates) return error("reservation_id and updates required", 400);
        const allowed: Record<string, unknown> = {};
        for (const key of ["guest_count", "reservation_time", "reservation_date", "zone", "occasion", "message", "status", "unit_id"]) {
          if (updates[key] !== undefined) allowed[key] = updates[key];
        }
        // Invalidate customer self-service token whenever the team modifies a reservation
        allowed.cancellation_token = null;
        const { error: err } = await supabase
          .from("reservations")
          .update(allowed)
          .eq("id", reservation_id);
        if (err) return error(err.message, 500);
        await logActivity(supabase, "update_reservation", "reservation", reservation_id, JSON.stringify(allowed));
        return ok({ updated: true });
      }

      case "get_settings": {
        const { data } = await supabase.from("settings").select("key, value");
        const settings: Record<string, unknown> = {};
        (data || []).forEach((s: { key: string; value: unknown }) => { settings[s.key] = s.value; });
        return ok({ settings });
      }

      case "save_settings": {
        const { settings } = body;
        if (!settings) return error("settings required", 400);
        for (const [key, value] of Object.entries(settings)) {
          await supabase.from("settings").upsert({ key, value: value as Record<string, unknown> }, { onConflict: "key" });
        }
        await logActivity(supabase, "save_settings", "settings", undefined, Object.keys(settings).join(", "));
        return ok({ saved: true });
      }

      case "fetch_activity_log": {
        const { data: logData } = await supabase
          .from("activity_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        return ok({ entries: logData || [] });
      }

      case "fetch_notifications": {
        // Nur Benachrichtigungen des heutigen Tages (lokale Zeit Europe/Berlin angenommen).
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .gte("created_at", todayStart)
          .order("created_at", { ascending: false })
          .limit(50);
        return ok({ notifications: data || [] });
      }

      case "mark_notification_read": {
        const { notification_id } = body;
        if (!notification_id) return error("notification_id required", 400);
        await supabase.from("notifications").update({ read: true }).eq("id", notification_id);
        return ok({ done: true });
      }

      case "check_login_attempts": {
        const { email, log_attempt, success } = body;
        if (!email) return error("email required", 400);

        // Optionally log the outcome of an actual login attempt. Rate-limited
        // per IP so an attacker cannot easily spam fake failures to lock out
        // an admin account.
        if (log_attempt === true) {
          const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
            || req.headers.get("cf-connecting-ip")
            || "unknown";
          if (!loginLogRateLimited(ip)) {
            try {
              await supabase.from("login_attempts").insert({ email, success: !!success });
              if (success) {
                const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                await supabase.from("login_attempts").delete().eq("email", email).lt("attempted_at", cutoff);
              }
            } catch (e) {
              console.error("login_attempts insert failed (non-blocking):", e);
            }
          }
        }

        const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: attempts } = await supabase
          .from("login_attempts")
          .select("*")
          .eq("email", email)
          .eq("success", false)
          .gte("attempted_at", cutoff)
          .order("attempted_at", { ascending: false });
        const failCount = attempts?.length || 0;
        if (failCount >= 5) {
          const lastAttempt = attempts?.[0]?.attempted_at;
          const lockEnd = new Date(new Date(lastAttempt).getTime() + 30 * 60 * 1000);
          const remaining = Math.ceil((lockEnd.getTime() - Date.now()) / 60000);
          return ok({ locked: true, minutes_remaining: Math.max(1, remaining) });
        }
        return ok({ locked: false, failed_attempts: failCount });
      }

      case "log_login_attempt": {
        // Now requires admin auth (no longer in PUBLIC_ACTIONS).
        // Kept for backwards compatibility / direct admin tooling.
        const { email, success } = body;
        if (!email) return error("email required", 400);
        await supabase.from("login_attempts").insert({ email, success: !!success });
        if (success) {
          const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          await supabase.from("login_attempts").delete().eq("email", email).lt("attempted_at", cutoff);
        }
        return ok({ logged: true });
      }

      default:
        return error(`Unknown action: ${action}`, 400);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return error("Unerwarteter Fehler", 500);
  }
});

function ok(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function error(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
