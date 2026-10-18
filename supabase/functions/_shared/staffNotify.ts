// Staff notifications: a row in the admin "Benachrichtigungen" feed plus a
// push to the staff phones (Median app with OneSignal). The push is skipped
// silently when ONESIGNAL_APP_ID / ONESIGNAL_API_KEY are not configured, so
// bookings never fail because of notifications.

// deno-lint-ignore no-explicit-any
type Supabase = any;

export type StaffEvent = "new" | "modified" | "cancelled" | "overdue";

const ZONES: Record<string, string> = {
  hauptbereich: "Restaurant 140 Zoll",
  fenster: "Restaurant 75 Zoll",
  salitos: "Salitos Lounge",
  billard: "Billard",
  vip: "VIP-Raum",
  podest: "Podest",
};

const TITLES: Record<StaffEvent, string> = {
  new: "Neue Reservierung",
  modified: "Reservierung geändert",
  cancelled: "Reservierung storniert",
  overdue: "Gast überfällig",
};

const TYPES: Record<StaffEvent, string> = {
  new: "info",
  modified: "info",
  cancelled: "warning",
  overdue: "overdue",
};

/** External ID the admin page registers with OneSignal (see src/lib/medianPush.ts). */
export const staffExternalId = (userId: string) => `rondo-staff-${userId}`;

export interface StaffReservation {
  id: string;
  customer_name: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  zone: string;
}

const shortDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][date.getDay()]} ${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.`;
};

export function staffMessage(event: StaffEvent, r: StaffReservation, extra = ""): string {
  const time = String(r.reservation_time).slice(0, 5);
  const base = `${r.customer_name} · ${r.guest_count} Pers. · ${shortDate(r.reservation_date)} ${time} Uhr · ${ZONES[r.zone] || r.zone}`;
  return extra ? `${base} – ${extra}` : base;
}

async function sendPush(supabase: Supabase, title: string, message: string, reservationId: string) {
  const appId = Deno.env.get("ONESIGNAL_APP_ID");
  const apiKey = Deno.env.get("ONESIGNAL_API_KEY");
  if (!appId || !apiKey) {
    console.warn("Staff push skipped: OneSignal secrets are not configured");
    return;
  }

  const { data: admins, error } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  if (error) {
    console.error("Staff push failed: admin recipients could not be loaded");
    return;
  }
  const externalIds = (admins || []).map((a: { user_id: string }) => staffExternalId(a.user_id));
  if (externalIds.length === 0) {
    console.warn("Staff push skipped: no admin recipients");
    return;
  }

  const appUrl = Deno.env.get("APP_URL") || "https://rondo-sportsbar-reservieren.de";
  const res = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${apiKey}` },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      include_aliases: { external_id: externalIds },
      headings: { en: title, de: title },
      contents: { en: message, de: message },
      url: `${appUrl}/backstage`,
      data: { reservation_id: reservationId },
    }),
  });
  // A 2xx response can still mean no push was created (e.g. no subscribed
  // devices). Never log the raw provider response, which may contain secrets.
  const result = await res.json().catch(() => null);
  if (!res.ok) {
    console.error("OneSignal push rejected:", res.status);
  } else if (!result?.id) {
    console.warn("OneSignal push not created: no eligible subscribed devices or invalid recipients");
  } else {
    console.info("OneSignal push accepted:", JSON.stringify({ notification_id: result.id, reservation_id: reservationId }));
  }
}

/** Never throws – notifications must not break the booking flow. */
export async function notifyStaff(supabase: Supabase, event: StaffEvent, r: StaffReservation, extra = "") {
  const title = TITLES[event];
  const message = staffMessage(event, r, extra);
  try {
    const { error } = await supabase.from("notifications").insert({ title, message, type: TYPES[event], reservation_id: r.id });
    if (error) console.error("Notification insert failed");
  } catch {
    console.error("Notification insert failed");
  }
  try {
    await sendPush(supabase, title, message, r.id);
  } catch {
    console.error("Staff push failed: network or response error");
  }
}
