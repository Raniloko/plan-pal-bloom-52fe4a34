// Shared HTML layout for all guest emails (confirmation, change,
// cancellation, waitlist). Table-based with inline styles so it renders in
// Gmail, Outlook and Apple Mail. Every dynamic value must be escaped by the
// caller (or passed through escapeHtml here).

export const VENUE = {
  name: "Rondo Sportsbar",
  street: "Otto-Hahn-Str. 18",
  city: "63456 Hanau",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Rondo Sportsbar, Otto-Hahn-Str. 18, 63456 Hanau"),
  website: "https://www.rondo-sportsbar.de",
};

export const ZONE_LABELS: Record<string, string> = {
  hauptbereich: "Restaurant am 140-Zoll-Screen",
  fenster: "Restaurant am 75-Zoll-Screen",
  billard: "Billard",
  vip: "VIP-Raum",
  podest: "Podest",
  salitos: "Salitos Lounge / Outdoor",
};

export function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONTHS = ["Jan", "Feb", "März", "Apr", "Mai", "Juni", "Juli", "Aug", "Sep", "Okt", "Nov", "Dez"];

const parseDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** "Sa, 18.10.2026" – used in subjects and plain text. */
export function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${WEEKDAYS[parseDate(dateStr).getDay()].slice(0, 2)}, ${d}.${m}.${y}`;
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const INK = "#111111";
const MUTED = "#6b6b6b";
const LINE = "#e8e8e8";
const BRAND = "#ffda00";

export type Tone = "success" | "info" | "danger" | "brand";
const TONE_COLORS: Record<Tone, string> = {
  success: "#17803d",
  info: "#1d5fd1",
  danger: "#c62828",
  brand: "#8a6d00",
};

export interface EmailAction { label: string; url: string; primary?: boolean }

export interface EmailContent {
  /** Hidden preview line shown in the inbox list */
  preheader: string;
  status: { text: string; tone: Tone };
  title: string;
  /** Already escaped HTML, one or two sentences */
  intro: string;
  /** Date/time block; struck through for cancellations */
  when?: { date: string; time: string; struck?: boolean };
  /** One line under the time, e.g. "4 Personen · Billard (Tisch 3)" – escaped */
  summary?: string;
  actions?: EmailAction[];
  reference?: string;
  appUrl: string;
}

/**
 * Deliberately small: one card, no nested layout tables beyond what Outlook
 * needs, a 5 KB logo and a single media query for phones.
 */
export function renderEmail(c: EmailContent): string {
  const strike = c.when?.struck ? "text-decoration:line-through;opacity:.5;" : "";
  const d = c.when ? parseDate(c.when.date) : null;

  const when = c.when && d ? `
          <tr><td class="px" style="padding:20px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-radius:12px;">
              <tr>
                <td width="72" align="center" style="background:${INK};border-radius:11px 0 0 11px;padding:12px 6px;font-family:${FONT};${strike}">
                  <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:${BRAND};">${WEEKDAYS[d.getDay()].slice(0, 2).toUpperCase()}</div>
                  <div style="font-size:26px;line-height:1.1;font-weight:800;color:#ffffff;">${d.getDate()}</div>
                  <div style="font-size:11px;color:#bdbdbd;">${MONTHS[d.getMonth()]}</div>
                </td>
                <td style="padding:12px 16px;font-family:${FONT};${strike}">
                  <div style="font-size:22px;font-weight:800;color:${INK};">${escapeHtml(c.when.time)} Uhr</div>
                  ${c.summary ? `<div style="font-size:14px;color:${MUTED};margin-top:2px;">${c.summary}</div>` : ""}
                </td>
              </tr>
            </table>
          </td></tr>` : "";

  const actions = c.actions?.length ? `
          <tr><td class="px" style="padding:24px 32px 0;">
            ${c.actions.map((a, i) => `<a class="btn" href="${a.url}" style="display:inline-block;margin:0 ${i < c.actions!.length - 1 ? "8px" : "0"} 8px 0;padding:13px 22px;border-radius:8px;font-family:${FONT};font-size:15px;font-weight:700;text-decoration:none;${
              a.primary ? `background:${BRAND};color:${INK};` : `background:#ffffff;color:${INK};border:1px solid #d0d0d0;`
            }">${a.label}</a>`).join("")}
          </td></tr>` : "";

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light only">
<title>${c.title}</title>
<style>
@media (max-width:480px){
  .px{padding-left:20px!important;padding-right:20px!important}
  .btn{display:block!important;margin:0 0 8px 0!important;text-align:center}
  h1{font-size:22px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background:#f2f1ee;">
<div style="display:none;max-height:0;overflow:hidden;">${c.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ee;">
  <tr><td align="center" style="padding:20px 10px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;">
      <tr><td align="center" style="background:${INK};border-bottom:3px solid ${BRAND};padding:16px;">
        <img src="${c.appUrl}/images/email-logo.png" alt="Rondo Sportsbar" width="120" height="40" style="display:block;border:0;">
      </td></tr>
      <tr><td class="px" style="padding:28px 32px 0;font-family:${FONT};">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${TONE_COLORS[c.status.tone]};">${c.status.text}</div>
        <h1 style="margin:6px 0 0;font-size:24px;line-height:1.25;font-weight:800;color:${INK};">${c.title}</h1>
        <p style="margin:8px 0 0;font-size:15px;line-height:1.55;color:#333333;">${c.intro}</p>
      </td></tr>
      ${when}
      ${actions}
      <tr><td class="px" style="padding:24px 32px 24px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
        <a href="${VENUE.mapsUrl}" style="color:${MUTED};">${VENUE.name} · ${VENUE.street} · ${VENUE.city}</a><br>
        ${c.reference ? `Buchungsnummer ${c.reference} · ` : ""}<a href="${c.appUrl}/impressum" style="color:${MUTED};">Impressum</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Plain-text alternative; improves deliverability and helps text-only clients. */
export function renderText(lines: (string | false | null | undefined)[]): string {
  return lines.filter((l): l is string => typeof l === "string").join("\n");
}
