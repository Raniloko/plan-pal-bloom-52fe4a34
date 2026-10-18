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

const OCCASION_LABELS: Record<string, string> = {
  sport: "Live-Sport schauen",
  feier: "Private Feier",
  essen: "Essen & Trinken",
  billard: "Billard / Kicker / Dart",
  sonstiges: "Sonstiges",
};

export function occasionLabel(occasion: string | null | undefined): string {
  return String(occasion || "")
    .split(",")
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => p.startsWith("sonstiges:") ? p.slice("sonstiges:".length).trim() : (OCCASION_LABELS[p] || p))
    .join(", ");
}

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

/** Google Calendar "add event" link for a 2-hour visit. */
export function calendarUrl(dateStr: string, time: string, title: string, details: string): string {
  const start = parseDate(dateStr);
  const [h, min] = time.split(":").map(Number);
  start.setHours(h, min, 0, 0);
  if (h < 6) start.setDate(start.getDate() + 1); // after midnight = next calendar day
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    ctz: "Europe/Berlin",
    location: `${VENUE.name}, ${VENUE.street}, ${VENUE.city}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const C = {
  page: "#f2f1ee",
  card: "#ffffff",
  ink: "#111111",
  text: "#2b2b2b",
  muted: "#777777",
  line: "#ececec",
  brand: "#ffda00",
};

export type Tone = "success" | "info" | "danger" | "brand";
const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: "#e7f6ec", fg: "#17803d" },
  info: { bg: "#e8f0fe", fg: "#1d5fd1" },
  danger: { bg: "#fdecec", fg: "#c62828" },
  brand: { bg: "#fff6bf", fg: "#7a6200" },
};

export interface EmailDetail { label: string; value: string; highlight?: boolean }
export interface EmailAction { label: string; url: string; style: "primary" | "secondary" | "link" }

export interface EmailContent {
  /** Hidden preview line shown in the inbox list */
  preheader: string;
  badge: { text: string; tone: Tone };
  title: string;
  /** Already escaped HTML */
  intro: string;
  /** Big date/time ticket; struck through for cancellations */
  when?: { date: string; time: string; struck?: boolean };
  details?: EmailDetail[];
  /** Quoted block, e.g. guest message or cancellation reason (escaped) */
  quote?: { label: string; text: string };
  actions?: EmailAction[];
  /** Small helper links under the buttons (calendar, route) */
  links?: { label: string; url: string }[];
  /** "Gut zu wissen" bullet list (escaped) */
  notes?: string[];
  reference?: string;
  appUrl: string;
}

const button = (a: EmailAction) => {
  const primary = a.style === "primary";
  return `<a href="${a.url}" style="display:block;padding:15px 12px;border-radius:10px;text-align:center;text-decoration:none;font-family:${FONT};font-size:15px;font-weight:700;${
    primary ? `background:${C.brand};color:${C.ink};border:1px solid ${C.brand};` : `background:${C.card};color:${C.ink};border:1px solid #d6d6d6;`
  }">${a.label}</a>`;
};

export function renderEmail(c: EmailContent): string {
  const tone = TONES[c.badge.tone];
  const logo = `${c.appUrl}/images/rondo-logo.png`;

  const when = c.when ? (() => {
    const d = parseDate(c.when.date);
    const strike = c.when.struck ? "text-decoration:line-through;opacity:.55;" : "";
    return `
    <tr><td class="px" style="padding:8px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:14px;">
        <tr>
          <td width="96" align="center" valign="middle" style="background:${C.ink};border-radius:13px 0 0 13px;padding:16px 8px;${strike}">
            <div style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:1.5px;color:${C.brand};text-transform:uppercase;">${WEEKDAYS[d.getDay()].slice(0, 2)}</div>
            <div style="font-family:${FONT};font-size:34px;line-height:1.1;font-weight:800;color:#ffffff;">${d.getDate()}</div>
            <div style="font-family:${FONT};font-size:12px;font-weight:600;color:#bdbdbd;text-transform:uppercase;letter-spacing:1px;">${MONTHS[d.getMonth()]}</div>
          </td>
          <td valign="middle" style="padding:16px 20px;${strike}">
            <div style="font-family:${FONT};font-size:13px;color:${C.muted};">${WEEKDAYS[d.getDay()]}, ${formatDateShort(c.when.date).slice(4)}</div>
            <div style="font-family:${FONT};font-size:28px;font-weight:800;color:${C.ink};margin-top:2px;">${escapeHtml(c.when.time)} Uhr</div>
          </td>
        </tr>
      </table>
    </td></tr>`;
  })() : "";

  const details = c.details?.length ? `
    <tr><td class="px" style="padding:20px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${c.details.map((r, i) => `
        <tr>
          <td style="padding:12px 0;${i < c.details!.length - 1 ? `border-bottom:1px solid ${C.line};` : ""}font-family:${FONT};font-size:14px;color:${C.muted};white-space:nowrap;padding-right:12px;">${r.label}</td>
          <td align="right" style="padding:12px 0;${i < c.details!.length - 1 ? `border-bottom:1px solid ${C.line};` : ""}font-family:${FONT};font-size:15px;font-weight:600;color:${C.ink};">${r.highlight ? `<span style="background:${C.brand};padding:2px 8px;border-radius:6px;">${r.value}</span>` : r.value}</td>
        </tr>`).join("")}
      </table>
    </td></tr>` : "";

  const quote = c.quote ? `
    <tr><td class="px" style="padding:16px 32px 0;">
      <div style="background:#f7f7f5;border-left:3px solid ${C.brand};border-radius:0 10px 10px 0;padding:12px 16px;">
        <div style="font-family:${FONT};font-size:12px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:1px;">${c.quote.label}</div>
        <div style="font-family:${FONT};font-size:14px;color:${C.text};line-height:1.55;margin-top:4px;">${c.quote.text}</div>
      </div>
    </td></tr>` : "";

  const buttons = (c.actions || []).filter(a => a.style !== "link");
  const actions = buttons.length ? `
    <tr><td class="px" style="padding:28px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        ${buttons.map((a, i) => `<td width="${Math.floor(100 / buttons.length)}%" style="${i > 0 ? "padding-left:6px;" : ""}${i < buttons.length - 1 ? "padding-right:6px;" : ""}">${button(a)}</td>`).join("")}
      </tr></table>
    </td></tr>` : "";

  const links = c.links?.length ? `
    <tr><td class="px" align="center" style="padding:16px 32px 0;font-family:${FONT};font-size:14px;">
      ${c.links.map(l => `<a href="${l.url}" style="color:${C.ink};font-weight:600;text-decoration:underline;text-decoration-color:${C.brand};text-underline-offset:3px;">${l.label}</a>`).join(`<span style="color:#c4c4c4;padding:0 10px;">·</span>`)}
    </td></tr>` : "";

  const notes = c.notes?.length ? `
    <tr><td class="px" style="padding:28px 32px 0;">
      <div style="background:#fafaf8;border:1px solid ${C.line};border-radius:12px;padding:16px 18px;">
        <div style="font-family:${FONT};font-size:13px;font-weight:700;color:${C.ink};margin-bottom:6px;">Gut zu wissen</div>
        ${c.notes.map(n => `<div style="font-family:${FONT};font-size:13px;line-height:1.55;color:${C.text};padding:3px 0 3px 14px;position:relative;">• ${n}</div>`).join("")}
      </div>
    </td></tr>` : "";

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${c.title}</title>
  <style>
    @media (max-width: 480px) {
      .px { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${c.preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
    <tr><td align="center" style="padding:24px 12px 32px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td class="px" style="background:${C.ink};border-radius:16px 16px 0 0;padding:20px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><img src="${logo}" alt="Rondo Sportsbar" height="40" style="display:block;height:40px;width:auto;border:0;"></td>
            <td align="right" style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:2px;color:${C.brand};">SPORTSBAR · HANAU</td>
          </tr></table>
        </td></tr>
        <tr><td style="height:4px;background:${C.brand};font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Card -->
        <tr><td style="background:${C.card};border-radius:0 0 16px 16px;padding-bottom:32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td class="px" style="padding:32px 32px 0;">
              <span style="display:inline-block;background:${tone.bg};color:${tone.fg};font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:.5px;padding:6px 12px;border-radius:999px;">${c.badge.text}</span>
              <h1 style="margin:16px 0 0;font-family:${FONT};font-size:28px;line-height:1.2;font-weight:800;color:${C.ink};">${c.title}</h1>
              <p style="margin:10px 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.text};">${c.intro}</p>
            </td></tr>
            <tr><td style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>
            ${when}
            ${details}
            ${quote}
            ${actions}
            ${links}
            ${notes}
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:24px 24px 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${C.muted};">
          <strong style="color:${C.text};">${VENUE.name}</strong><br>
          <a href="${VENUE.mapsUrl}" style="color:${C.muted};text-decoration:none;">${VENUE.street} · ${VENUE.city}</a><br>
          <a href="${VENUE.website}" style="color:${C.muted};">rondo-sportsbar.de</a>
          <span style="padding:0 6px;">·</span>
          <a href="${c.appUrl}/impressum" style="color:${C.muted};">Impressum</a>
          ${c.reference ? `<br><span style="font-size:11px;color:#a5a5a5;letter-spacing:1px;">Buchungsnummer ${c.reference}</span>` : ""}
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
