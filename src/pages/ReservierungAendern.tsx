import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarPlus, Check, Loader2, Minus, Plus, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingState, ManageShell, ReservationTicket, StatusHeader } from "@/components/reservation/ManageShell";
import { useOpeningHours } from "@/hooks/useOpeningHours";
import { isTimeInPast, useZoneAvailability, type ZoneKey } from "@/hooks/useZoneAvailability";
import {
  callGuestFunction, downloadIcs, OCCASION_OPTIONS, parseOccasion, serializeOccasion, toIsoDate,
  ZONE_OPTIONS, type GuestReservation,
} from "@/lib/guestReservation";

type ViewState = "loading" | "form" | "success" | "error" | "handled";

const QUICK_DAYS = 14;
const TIME_PERIODS = [
  { key: "day", label: "Bis 17 Uhr", match: (h: number) => h >= 6 && h < 17 },
  { key: "evening", label: "17 – 21 Uhr", match: (h: number) => h >= 17 && h < 21 },
  { key: "late", label: "Ab 21 Uhr", match: (h: number) => h >= 21 || h < 6 },
] as const;
type PeriodKey = (typeof TIME_PERIODS)[number]["key"];
const periodOf = (t: string): PeriodKey => TIME_PERIODS.find(p => p.match(Number(t.slice(0, 2))))!.key;

const Section = ({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) => (
  <section className="border-t border-border pt-5">
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
    {children}
  </section>
);

const chip = (selected: boolean) => cn(
  "rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40",
  selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted hover:border-primary/50",
);

const ReservierungAendern = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  const [view, setView] = useState<ViewState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [original, setOriginal] = useState<GuestReservation | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(2);
  const [zone, setZone] = useState("");
  const [occasionKeys, setOccasionKeys] = useState<string[]>([]);
  const [occasionOther, setOccasionOther] = useState("");
  const [message, setMessage] = useState("");
  const [period, setPeriod] = useState<PeriodKey | null>(null);

  const { getTimesForDate } = useOpeningHours();
  const ignore = useMemo(() => original
    ? { date: original.reservation_date, time: original.reservation_time, zone: original.zone }
    : null, [original]);
  const { dayFullyBlocked, isAreaBlocked, isZoneFullyBooked, loading: availabilityLoading } = useZoneAvailability(date, ignore);

  useEffect(() => {
    if (!id || !token) {
      setErrorMsg("Dieser Link ist unvollständig. Bitte öffne ihn direkt aus deiner Bestätigungs-E-Mail.");
      setView("error");
      return;
    }
    (async () => {
      const res = await callGuestFunction<{ reservation: GuestReservation; status?: string }>("modify-reservation", { action: "get", id, token });
      if (res.status === 200 && res.data?.reservation) {
        const r = { ...res.data.reservation, reservation_time: res.data.reservation.reservation_time.slice(0, 5) };
        setOriginal(r);
        setDate(r.reservation_date);
        setTime(r.reservation_time);
        setGuests(r.guest_count);
        setZone(r.zone);
        const occ = parseOccasion(r.occasion);
        setOccasionKeys(occ.keys);
        setOccasionOther(occ.other);
        setMessage(r.message || "");
        setView("form");
      } else if (res.status === 403 || res.status === 410 || res.data?.status === "cancelled") {
        setView("handled");
      } else {
        setErrorMsg(res.error || "Reservierung nicht gefunden.");
        setView("error");
      }
    })();
  }, [id, token]);

  const occasion = serializeOccasion(occasionKeys, occasionOther);
  const changed = !!original && (
    date !== original.reservation_date || time !== original.reservation_time || guests !== original.guest_count
    || zone !== original.zone || occasion !== serializeOccasion(parseOccasion(original.occasion).keys, parseOccasion(original.occasion).other)
    || message !== (original.message || "")
  );

  // Times that are still bookable in the chosen area
  const times = date ? getTimesForDate(date) : [];
  const timeBlocked = (t: string) => {
    if (isTimeInPast(date, t)) return true;
    if (zone === "billard" && Number(t.slice(0, 2)) >= 20) return true;
    return zone ? isZoneFullyBooked(zone as ZoneKey, t) : false;
  };
  const periods = TIME_PERIODS.filter(p => times.some(t => p.match(Number(t.slice(0, 2)))));
  const activePeriod = (period && periods.some(p => p.key === period) ? period : undefined)
    ?? (time ? periodOf(time) : undefined) ?? periods[0]?.key;

  const zoneUnavailable = (z: string) => {
    if (isAreaBlocked(z)) return "An diesem Tag gesperrt";
    if (z === "billard" && time && Number(time.slice(0, 2)) >= 20) return "Ab 20 Uhr nicht reservierbar";
    if (time && isZoneFullyBooked(z as ZoneKey, time)) return `Um ${time} Uhr belegt`;
    return null;
  };

  const timeValid = !!time && times.includes(time) && !timeBlocked(time);
  const occasionValid = occasionKeys.length > 0 && (!occasionKeys.includes("sonstiges") || occasionOther.trim().length > 0);
  const canSave = changed && !!date && !dayFullyBlocked && timeValid && !!zone && !zoneUnavailable(zone) && occasionValid && !saving;

  const pickDate = (iso: string) => { setDate(iso); setPeriod(null); };

  const handleSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError("");
    const res = await callGuestFunction<{ status?: string }>("modify-reservation", {
      action: "update", id, token, date, time, guests, zone, occasion, message,
    });
    setSaving(false);
    if (res.status === 200) {
      setView("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (res.status === 403 || res.data?.status === "cancelled") {
      setView("handled");
    } else {
      // Keep the form so the guest can pick something else (e.g. slot just got booked)
      setSaveError(res.error || "Die Änderung hat leider nicht geklappt. Bitte versuche es erneut.");
    }
  };

  const updated = original ? { ...original, reservation_date: date, reservation_time: time, guest_count: guests, zone } : null;
  const cancelUrl = `/reservierung/stornieren?id=${encodeURIComponent(id || "")}&token=${encodeURIComponent(token || "")}`;

  return (
    <ManageShell reference={id}>
      {view === "loading" && <LoadingState />}

      {view === "form" && original && (
        <>
          <h1 className="font-display text-3xl sm:text-4xl">Reservierung ändern</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hallo {original.customer_name.split(" ")[0]}, passe einfach an, was sich geändert hat.
          </p>

          <div className="mt-5">
            <ReservationTicket r={original} label="Aktuelle Reservierung" />
          </div>

          <div className="mt-6 flex flex-col gap-6">
            <Section title="Datum">
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                {Array.from({ length: QUICK_DAYS }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() + i);
                  const iso = toIsoDate(d);
                  const closed = getTimesForDate(iso).length === 0;
                  return (
                    <button key={iso} type="button" disabled={closed} onClick={() => pickDate(iso)}
                      className={cn(chip(date === iso), "flex w-[58px] shrink-0 flex-col items-center py-2")}>
                      <span className="text-[11px] font-medium opacity-80">
                        {i === 0 ? "Heute" : i === 1 ? "Morgen" : d.toLocaleDateString("de-DE", { weekday: "short" })}
                      </span>
                      <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                      <span className="text-[10px] opacity-70">{closed ? "zu" : d.toLocaleDateString("de-DE", { month: "short" })}</span>
                    </button>
                  );
                })}
              </div>
              <input
                type="date"
                value={date}
                min={toIsoDate(new Date())}
                onChange={(e) => e.target.value && pickDate(e.target.value)}
                className="mt-3 w-full rounded-md border border-border bg-muted px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {dayFullyBlocked && (
                <p className="mt-2 text-sm text-primary">
                  An diesem Tag sind keine Reservierungen möglich{dayFullyBlocked.reason ? `: ${dayFullyBlocked.reason}` : "."}
                </p>
              )}
            </Section>

            <Section title="Uhrzeit" hint={availabilityLoading ? <span className="inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Verfügbarkeit…</span> : undefined}>
              {times.length === 0 ? (
                <p className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">An diesem Tag haben wir geschlossen.</p>
              ) : (
                <>
                  {periods.length > 1 && (
                    <div className="mb-3 grid gap-1 rounded-lg bg-muted p-1" style={{ gridTemplateColumns: `repeat(${periods.length}, minmax(0, 1fr))` }}>
                      {periods.map(p => (
                        <button key={p.key} type="button" onClick={() => setPeriod(p.key)}
                          className={cn("rounded-md px-2 py-2 text-xs font-semibold transition-colors",
                            activePeriod === p.key ? "bg-card text-foreground shadow" : "text-muted-foreground")}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {times.filter(t => periodOf(t) === activePeriod).map(t => (
                      <button key={t} type="button" disabled={timeBlocked(t)} onClick={() => setTime(t)}
                        className={cn(chip(time === t), "px-2 py-2 text-sm")}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {time && !timeValid && (
                    <p className="mt-2 text-sm text-primary">Die bisherige Uhrzeit {time} Uhr ist so nicht mehr verfügbar – bitte wähle eine neue.</p>
                  )}
                </>
              )}
            </Section>

            <Section title="Personen" hint={guests >= 11 ? "Ab 11 Personen empfehlen wir den VIP-Raum" : undefined}>
              <div className="flex items-center justify-center gap-6 rounded-lg border border-border bg-muted py-3">
                <button type="button" aria-label="Weniger" onClick={() => setGuests(g => Math.max(1, g - 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border hover:border-primary"><Minus size={18} /></button>
                <span className="w-16 text-center font-display text-4xl text-primary">{guests}</span>
                <button type="button" aria-label="Mehr" onClick={() => setGuests(g => Math.min(50, g + 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border hover:border-primary"><Plus size={18} /></button>
              </div>
            </Section>

            <Section title="Bereich">
              <div className="flex flex-col gap-2">
                {ZONE_OPTIONS.map(z => {
                  const reason = zoneUnavailable(z.value);
                  const selected = zone === z.value;
                  return (
                    <button key={z.value} type="button" disabled={!!reason && !selected} onClick={() => setZone(z.value)}
                      className={cn("flex items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                        selected ? "border-primary bg-primary/10" : "border-border bg-muted hover:border-primary/50")}>
                      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                        {selected && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">{z.label}</span>
                        <span className={cn("block text-xs", reason ? "text-primary" : "text-muted-foreground")}>{reason ?? z.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {zone === "billard" && original.zone !== "billard" && (
                <p className="mt-2 text-xs text-muted-foreground">Den Billard-Tisch teilt dir unser Team vor Ort zu.</p>
              )}
            </Section>

            <Section title="Anlass" hint="Mehrfachauswahl möglich">
              <div className="flex flex-wrap gap-2">
                {OCCASION_OPTIONS.map(o => {
                  const selected = occasionKeys.includes(o.value);
                  return (
                    <button key={o.value} type="button"
                      onClick={() => setOccasionKeys(keys => selected ? keys.filter(k => k !== o.value) : [...keys, o.value])}
                      className={cn(chip(selected), "px-3 py-2 text-sm font-medium")}>
                      {o.label}
                    </button>
                  );
                })}
              </div>
              {occasionKeys.includes("sonstiges") && (
                <input value={occasionOther} onChange={e => setOccasionOther(e.target.value)} placeholder="Was genau? z. B. Geburtstag"
                  className="mt-3 w-full rounded-md border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              )}
            </Section>

            <Section title="Nachricht" hint="optional">
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={1000}
                placeholder="z. B. welches Spiel ihr sehen wollt"
                className="w-full resize-none rounded-md border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </Section>
          </div>

          {/* Save bar – pinned to the bottom on phones */}
          <div className="sticky bottom-0 z-10 -mx-5 mt-6 border-t border-border bg-card/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            {saveError && <p className="mb-2 text-sm text-destructive">{saveError}</p>}
            <button type="button" onClick={handleSubmit} disabled={!canSave}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Wird gespeichert…" : changed ? "Änderungen speichern" : "Noch nichts geändert"}
            </button>
          </div>
          <Link to={cancelUrl} className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-destructive">
            <XCircle size={15} /> Reservierung stattdessen stornieren
          </Link>
        </>
      )}

      {view === "success" && updated && (
        <>
          <StatusHeader tone="success" title="Reservierung geändert">
            Alles gespeichert! Die neue Bestätigung ist per E-Mail unterwegs.
          </StatusHeader>
          <div className="mt-6"><ReservationTicket r={updated} label="Neue Reservierung" /></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => downloadIcs(updated)}
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary/90">
              <CalendarPlus size={16} /> In Kalender eintragen
            </button>
            <button type="button" onClick={() => { setOriginal(updated); setView("form"); }}
              className="flex items-center justify-center rounded-md border border-border px-4 py-3 font-semibold hover:border-primary/60">
              Nochmal ändern
            </button>
          </div>
        </>
      )}

      {view === "handled" && (
        <StatusHeader tone="info" title="Nicht mehr änderbar">
          Diese Reservierung wurde bereits storniert oder von unserem Team bearbeitet und kann hier nicht mehr geändert werden.
          Bitte melde dich direkt bei uns im Rondo, wenn du etwas ändern möchtest.
        </StatusHeader>
      )}

      {view === "error" && (
        <>
          <StatusHeader tone="danger" title="Das hat nicht geklappt">{errorMsg}</StatusHeader>
          <Link to="/reservierung" className="mt-6 flex items-center justify-center rounded-md border border-border px-6 py-3 font-semibold hover:border-primary/60">
            Zur Reservierung
          </Link>
        </>
      )}
    </ManageShell>
  );
};

export default ReservierungAendern;
