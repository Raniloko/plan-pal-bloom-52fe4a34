import {
  calendarUrl, escapeHtml, formatDateShort, occasionLabel, renderEmail, renderText, VENUE, ZONE_LABELS,
} from "../_shared/email.ts";

// All values in MailReservation that end up in HTML must already be escaped.
export interface MailReservation {
  id: string;
  customer_name: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  zone: string;
  occasion: string;
  message?: string;
  unit_name?: string;
}

const reference = (id: string) => id.slice(0, 8).toUpperCase();

export function buildEmail(r: MailReservation, opts: { modifyUrl: string; cancelUrl: string; isModification: boolean; appUrl: string }) {
  const zoneLabel = escapeHtml(ZONE_LABELS[r.zone] || r.zone);
  const when = `${formatDateShort(r.reservation_date)}, ${r.reservation_time} Uhr`;
  const occasion = escapeHtml(occasionLabel(r.occasion));
  const isBillard = r.zone === "billard";

  const notes = [
    "Ändern oder stornieren kannst du jederzeit bis 10 Minuten vor Beginn über die Buttons oben.",
    ...(isBillard ? [
      "Billard: Wir können Reservierungen nur bei einer Verspätung von maximal fünf Minuten gewährleisten.",
      "Freitag bis Sonntag gilt eine maximale Spieldauer von 2 Stunden. Abgerechnet wird mit 0,23 € pro Minute vor Ort.",
    ] : []),
    "Du möchtest ein bestimmtes Spiel sehen? Trag es über „Ändern“ in die Nachricht ein, dann setzen wir dich vor den passenden Screen.",
  ];

  const html = renderEmail({
    appUrl: opts.appUrl,
    preheader: opts.isModification
      ? `Deine Reservierung wurde aktualisiert: ${when}.`
      : `Wir freuen uns auf dich am ${when}.`,
    badge: opts.isModification ? { text: "Geändert", tone: "info" } : { text: "✓ Bestätigt", tone: "success" },
    title: opts.isModification ? "Deine Reservierung wurde geändert" : "Dein Platz ist reserviert",
    intro: opts.isModification
      ? `Hallo ${r.customer_name}, deine Änderung ist bei uns angekommen. Hier sind die neuen Details.`
      : `Hallo ${r.customer_name}, danke für deine Reservierung! Wir freuen uns auf dich.`,
    when: { date: r.reservation_date, time: r.reservation_time },
    details: [
      { label: "Personen", value: String(r.guest_count) },
      { label: "Bereich", value: zoneLabel },
      ...(isBillard && r.unit_name ? [{ label: "Billard-Tisch", value: r.unit_name, highlight: true }] : []),
      ...(occasion ? [{ label: "Anlass", value: occasion }] : []),
    ],
    quote: r.message ? { label: "Deine Nachricht", text: r.message } : undefined,
    actions: [
      { label: "Ändern", url: opts.modifyUrl, style: "primary" },
      { label: "Stornieren", url: opts.cancelUrl, style: "secondary" },
    ],
    links: [
      { label: "In Kalender eintragen", url: calendarUrl(r.reservation_date, r.reservation_time, "Reservierung Rondo Sportsbar", `${r.guest_count} Personen · ${ZONE_LABELS[r.zone] || r.zone}`) },
      { label: "Route planen", url: VENUE.mapsUrl },
    ],
    notes,
    reference: reference(r.id),
  });

  const text = renderText([
    opts.isModification ? "Deine Reservierung wurde geändert." : "Deine Reservierung im Rondo ist bestätigt.",
    "",
    `Wann: ${when}`,
    `Personen: ${r.guest_count}`,
    `Bereich: ${ZONE_LABELS[r.zone] || r.zone}`,
    isBillard && r.unit_name ? `Billard-Tisch: ${r.unit_name}` : null,
    "",
    `Ändern: ${opts.modifyUrl}`,
    `Stornieren: ${opts.cancelUrl}`,
    "",
    `${VENUE.name}, ${VENUE.street}, ${VENUE.city}`,
    `Buchungsnummer ${reference(r.id)}`,
  ]);

  return { html, text };
}

export function buildCancellationEmail(r: MailReservation, cancelReason: string, appUrl: string) {
  const when = `${formatDateShort(r.reservation_date)}, ${r.reservation_time} Uhr`;
  const html = renderEmail({
    appUrl,
    preheader: `Deine Reservierung am ${when} wurde storniert.`,
    badge: { text: "Storniert", tone: "danger" },
    title: "Deine Reservierung ist storniert",
    intro: `Hallo ${r.customer_name}, schade, dass es diesmal nicht klappt. Wir haben deine Reservierung storniert – du musst nichts weiter tun.`,
    when: { date: r.reservation_date, time: r.reservation_time, struck: true },
    details: [
      { label: "Personen", value: String(r.guest_count) },
      { label: "Bereich", value: escapeHtml(ZONE_LABELS[r.zone] || r.zone) },
    ],
    quote: cancelReason ? { label: "Grund", text: cancelReason } : undefined,
    actions: [{ label: "Neu reservieren", url: `${appUrl}/reservierung`, style: "primary" }],
    reference: reference(r.id),
  });
  const text = renderText([
    "Deine Reservierung im Rondo wurde storniert.",
    "",
    `Wann: ${when}`,
    `Neu reservieren: ${appUrl}/reservierung`,
    "",
    `${VENUE.name}, ${VENUE.street}, ${VENUE.city}`,
  ]);
  return { html, text };
}
