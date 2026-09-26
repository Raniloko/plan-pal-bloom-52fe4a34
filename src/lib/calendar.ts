// Kalender-Export für Reservierungen (Apple/Outlook via .ics, Google Kalender via Link)

export type CalendarEvent = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMin?: number;
  title: string;
  description: string;
  location: string;
};

const LOCATION = "Rondo Sportsbar";

const pad = (n: number) => String(n).padStart(2, "0");

/** Lokale Start-/Endzeit als Date-Objekte. Slots vor 06:00 gehören zum Folgetag. */
const getRange = (e: CalendarEvent) => {
  const [y, m, d] = e.date.split("-").map(Number);
  const [hh, mm] = e.time.split(":").map(Number);
  const start = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (hh < 6) start.setDate(start.getDate() + 1);
  const end = new Date(start.getTime() + (e.durationMin ?? 120) * 60000);
  return { start, end };
};

const toUtcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

const escapeIcs = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export const buildIcs = (e: CalendarEvent): string => {
  const { start, end } = getRange(e);
  const uid = `rondo-${start.getTime()}-${Math.random().toString(36).slice(2, 10)}@rondo-sportsbar`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rondo Sportsbar//Reservierung//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    `DESCRIPTION:${escapeIcs(e.description)}`,
    `LOCATION:${escapeIcs(e.location || LOCATION)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(e.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
};

export const downloadIcs = (e: CalendarEvent, filename = "rondo-reservierung.ics") => {
  const blob = new Blob([buildIcs(e)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const googleCalendarUrl = (e: CalendarEvent): string => {
  const { start, end } = getRange(e);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
    details: e.description,
    location: e.location || LOCATION,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
