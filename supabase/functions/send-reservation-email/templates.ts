import { escapeHtml, formatDateShort, renderEmail, renderText, VENUE, ZONE_LABELS } from "../_shared/email.ts";

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

const summaryLine = (r: MailReservation) => {
  // A billard table name ("Billard 3") already says the area.
  const place = r.zone === "billard" && r.unit_name ? r.unit_name : escapeHtml(ZONE_LABELS[r.zone] || r.zone);
  return `${r.guest_count} ${r.guest_count === 1 ? "Person" : "Personen"} · ${place}`;
};

export function buildEmail(r: MailReservation, opts: { modifyUrl: string; cancelUrl: string; isModification: boolean; appUrl: string }) {
  const when = `${formatDateShort(r.reservation_date)}, ${r.reservation_time} Uhr`;

  const html = renderEmail({
    appUrl: opts.appUrl,
    preheader: opts.isModification ? `Neue Zeit: ${when}` : `Wir sehen uns am ${when}`,
    status: opts.isModification ? { text: "Geändert", tone: "info" } : { text: "Bestätigt", tone: "success" },
    title: opts.isModification ? "Reservierung geändert" : "Dein Platz ist reserviert",
    intro: opts.isModification
      ? `Hallo ${r.customer_name}, hier sind deine neuen Daten.`
      : `Hallo ${r.customer_name}, wir freuen uns auf dich!`,
    when: { date: r.reservation_date, time: r.reservation_time },
    summary: summaryLine(r),
    actions: [
      { label: "Ändern", url: opts.modifyUrl, primary: true },
      { label: "Stornieren", url: opts.cancelUrl },
    ],
    reference: reference(r.id),
  });

  const text = renderText([
    opts.isModification ? "Deine Reservierung wurde geändert." : "Deine Reservierung im Rondo ist bestätigt.",
    "",
    `Wann: ${when}`,
    `Personen: ${r.guest_count}`,
    `Bereich: ${ZONE_LABELS[r.zone] || r.zone}`,
    r.zone === "billard" && r.unit_name ? `Billard-Tisch: ${r.unit_name}` : null,
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
    preheader: `Storniert: ${when}`,
    status: { text: "Storniert", tone: "danger" },
    title: "Reservierung storniert",
    // The guest's own cancellation needs no reason line; a reason from the team does.
    intro: `Hallo ${r.customer_name}, deine Reservierung wurde storniert.${
      cancelReason && cancelReason !== "Vom Gast storniert" ? ` Grund: ${cancelReason}.` : ""
    } Schade – vielleicht bis bald!`,
    when: { date: r.reservation_date, time: r.reservation_time, struck: true },
    summary: summaryLine(r),
    actions: [{ label: "Neu reservieren", url: `${appUrl}/reservierung`, primary: true }],
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
