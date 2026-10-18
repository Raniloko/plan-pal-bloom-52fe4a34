import { supabase } from "@/integrations/supabase/client";

/** Shared data and helpers for the guest change / cancel pages (links from emails). */

export const ZONE_OPTIONS = [
  { value: "hauptbereich", label: "Restaurant am 140-Zoll-Screen", desc: "Direkt vor dem großen LED-Screen" },
  { value: "fenster", label: "Restaurant am 75-Zoll-Screen", desc: "Tische mit Fensterblick" },
  { value: "billard", label: "Billard-Tisch", desc: "0,23 €/Min · bis 20 Uhr reservierbar" },
  { value: "vip", label: "VIP-Raum", desc: "Privat, für Gruppen ab 11 Personen" },
  { value: "podest", label: "Podest", desc: "Erhöht mit guter Sicht" },
  { value: "salitos", label: "Salitos Lounge / Outdoor", desc: "Lounge & Outdoor" },
] as const;

export const zoneLabel = (zone: string) => ZONE_OPTIONS.find(z => z.value === zone)?.label ?? zone;

export const OCCASION_OPTIONS = [
  { value: "sport", label: "Live-Sport" },
  { value: "feier", label: "Private Feier" },
  { value: "essen", label: "Essen & Trinken" },
  { value: "billard", label: "Billard / Kicker / Dart" },
  { value: "sonstiges", label: "Sonstiges" },
] as const;

/** "sport, sonstiges: Geburtstag" -> { keys: ["sport", "sonstiges"], other: "Geburtstag" } */
export const parseOccasion = (occasion: string | null | undefined) => {
  const keys: string[] = [];
  let other = "";
  for (const part of String(occasion || "").split(",").map(p => p.trim()).filter(Boolean)) {
    if (part.startsWith("sonstiges:")) {
      other = part.slice("sonstiges:".length).trim();
      if (!keys.includes("sonstiges")) keys.push("sonstiges");
    } else if (!keys.includes(part)) {
      keys.push(part);
    }
  }
  return { keys, other };
};

/** Inverse of parseOccasion, same format the booking form sends. */
export const serializeOccasion = (keys: string[], other: string) => {
  const text = other.trim().replace(/,/g, ";");
  return keys
    .map(k => (k === "sonstiges" && text ? `sonstiges: ${text}` : k))
    .join(", ");
};

export const occasionText = (occasion: string | null | undefined) => {
  const { keys, other } = parseOccasion(occasion);
  return keys
    .map(k => (k === "sonstiges" && other ? other : OCCASION_OPTIONS.find(o => o.value === k)?.label ?? k))
    .join(", ");
};

export const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseIsoDate = (iso: string) => new Date(iso + "T00:00:00");

/** "2026-10-18" -> "Samstag, 18. Oktober 2026" */
export const formatDateLong = (iso: string) =>
  parseIsoDate(iso).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export interface GuestReservation {
  id: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  zone: string;
  occasion: string;
  message?: string | null;
  customer_name: string;
  status: string;
}

/**
 * Calls a public edge function and keeps the HTTP status, which the pages
 * need to tell "already cancelled" (410) and "handled by the team" (403) apart.
 */
export const callGuestFunction = async <T,>(name: string, body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return { status: 200, data: data as T, error: undefined };
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.status === "number") {
    const json = await ctx.json().catch(() => null) as ({ error?: string } & Record<string, unknown>) | null;
    return { status: ctx.status, data: json as T | null, error: json?.error };
  }
  return { status: 0, data: null, error: "Verbindungsfehler. Bitte prüfe deine Internetverbindung." };
};

/** Downloads an .ics file so the visit lands in any calendar app. */
export const downloadIcs = (r: Pick<GuestReservation, "id" | "reservation_date" | "reservation_time" | "guest_count" | "zone">) => {
  const start = parseIsoDate(r.reservation_date);
  const [h, m] = r.reservation_time.split(":").map(Number);
  start.setHours(h, m, 0, 0);
  if (h < 6) start.setDate(start.getDate() + 1);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rondo Sportsbar//Reservierung//DE", "BEGIN:VEVENT",
    `UID:${r.id}@rondo-sportsbar`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    "SUMMARY:Reservierung Rondo Sportsbar",
    `DESCRIPTION:${r.guest_count} Personen · ${zoneLabel(r.zone)}`,
    "LOCATION:Rondo Sportsbar\\, Otto-Hahn-Str. 18\\, 63456 Hanau",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "rondo-reservierung.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
