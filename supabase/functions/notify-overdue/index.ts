import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { notifyStaff } from "../_shared/staffNotify.ts";

// Runs every few minutes (scheduled job). Pushes "Gast überfällig" once per
// reservation when a guest has not been checked in OVERDUE_MIN minutes after
// the booked time – the same moment the dashboard marks the row red.
// The existing notifications row (type "overdue") prevents repeats.

const DEFAULT_OVERDUE_MIN = 10;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  // Accept the scheduler's cron secret or the service-role key (manual runs).
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (bearer !== serviceKey) {
    const denied = authenticateCronRequest(req);
    if (denied) return denied;
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

    const { data: setting } = await supabase
      .from("settings").select("value").eq("key", "overdue_notify_minutes").maybeSingle();
    const overdueMin = setting?.value ? Number(setting.value) : DEFAULT_OVERDUE_MIN;

    const now = new Date();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", hour12: false })
      .format(now).split(":").map(Number);
    const nowMin = h * 60 + m;

    const { data: open, error } = await supabase
      .from("reservations")
      .select("id, customer_name, reservation_date, reservation_time, guest_count, zone")
      .eq("reservation_date", today)
      .in("status", ["confirmed", "pending"]);
    if (error) return json({ error: error.message }, 500);

    const overdue = (open || []).filter(r => {
      const [rh, rm] = String(r.reservation_time).split(":").map(Number);
      return nowMin >= rh * 60 + rm + overdueMin;
    });
    if (overdue.length === 0) return json({ checked: open?.length || 0, notified: 0 });

    const { data: done } = await supabase
      .from("notifications").select("reservation_id").eq("type", "overdue")
      .in("reservation_id", overdue.map(r => r.id));
    const already = new Set((done || []).map((n: { reservation_id: string }) => n.reservation_id));

    let notified = 0;
    for (const r of overdue) {
      if (already.has(r.id)) continue;
      const [rh, rm] = String(r.reservation_time).split(":").map(Number);
      await notifyStaff(supabase, "overdue", r, `${nowMin - (rh * 60 + rm)} Min. nicht eingecheckt`);
      notified++;
    }
    return json({ checked: open?.length || 0, notified });
  } catch (err) {
    console.error("notify-overdue error:", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
