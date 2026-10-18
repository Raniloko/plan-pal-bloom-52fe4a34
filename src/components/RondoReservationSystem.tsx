import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Users, MapPin, Utensils, User, CheckCircle, ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useOpeningHours } from "@/hooks/useOpeningHours";
import { isTimeInPast, toMin, useZoneAvailability, type ZoneKey } from "@/hooks/useZoneAvailability";
import { announceChange } from "@/lib/adminSync";

const CONTACT_STORAGE_KEY = "rondo_guest_contact";

type ReservationZone = "hauptbereich" | "fenster" | "billard" | "vip" | "podest" | "salitos" | "";
type ReservationAnlass = "sport" | "feier" | "essen" | "billard" | "sonstiges";

interface ReservationData {
  date: string;
  time: string;
  guests: number;
  zone: ReservationZone;
  anlass: ReservationAnlass[];
  sonstigesText: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  billardUnitId: string;
  billardUnitName: string;
  acceptedTerms: boolean;
}

const ZONES = [
  { value: "hauptbereich", label: "Restaurantbereich am 140-Zoll Screen", desc: "Direkt vor dem großen 140-Zoll-LED-Screen", info: "" },
  { value: "fenster", label: "Restaurantbereich am 75-Zoll Screen", desc: "Gemütliche Tische am 75-Zoll-Screen mit Fensterblick", info: "" },
  {
    value: "billard",
    label: "Billard-Tisch",
    desc: "8 Olio-Billardtische · 0,23€/Min",
    info: "⏱ Abrechnung: 0,23 €/Min pro Tisch (ca. 13,80 €/Std). Die Abrechnung startet ab Spielbeginn und wird vor Ort bezahlt. Reservierung sichert dir einen Tisch – keine Vorauszahlung nötig.",
  },
  { value: "vip", label: "VIP-Raum", desc: "Privater Bereich für Gruppen ab 11 Personen", info: "👥 Mindestens 11 Personen erforderlich. Der VIP-Raum ist ein abgetrennter, privater Bereich mit eigenem Service." },
  { value: "podest", label: "Podest", desc: "Erhöhter Bereich mit guter Sicht", info: "📺 Erhöhter Bereich mit guter Sicht auf den 140-Zoll-LED-Screen." },
  { value: "salitos", label: "Salitos Lounge / Outdoor", desc: "Lounge- & Outdoor-Bereich mit entspannter Atmosphäre", info: "☀️ Outdoor-Lounge mit 15 Tischen. Bei schlechtem Wetter setzen wir uns mit dir in Verbindung." },
];

const ANLAESSE = [
  { value: "sport", label: "Live-Sport schauen" },
  { value: "feier", label: "Private Feier" },
  { value: "essen", label: "Essen & Trinken" },
  { value: "billard", label: "Billard / Kicker / Dart" },
  { value: "sonstiges", label: "Sonstiges" },
];

// TIMES are now dynamic from settings via useOpeningHours hook

const STEPS = [
  { icon: <CalendarDays size={20} />, label: "Datum & Uhrzeit" },
  { icon: <Users size={20} />, label: "Personenanzahl" },
  { icon: <MapPin size={20} />, label: "Bereich" },
  { icon: <Utensils size={20} />, label: "Anlass" },
  { icon: <User size={20} />, label: "Kontaktdaten" },
  { icon: <CheckCircle size={20} />, label: "Bestätigung" },
];

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** "2026-10-18" -> "Sa., 18.10.2026" */
const formatDateDe = (iso: string) => {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
};

const QUICK_DAYS = 14;

// Time slots are grouped so phones don't show 40 buttons at once.
const TIME_PERIODS = [
  { key: "day", label: "Bis 17 Uhr", match: (h: number) => h >= 6 && h < 17 },
  { key: "evening", label: "17 – 21 Uhr", match: (h: number) => h >= 17 && h < 21 },
  { key: "late", label: "Ab 21 Uhr", match: (h: number) => h >= 21 || h < 6 },
] as const;
type TimePeriod = (typeof TIME_PERIODS)[number]["key"];
const periodOf = (t: string): TimePeriod => TIME_PERIODS.find(p => p.match(Number(t.slice(0, 2))))!.key;

const RondoReservationSystem = () => {
  const { getTimesForDate } = useOpeningHours();
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const billardSectionRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const [data, setData] = useState<ReservationData>({
    date: "",
    time: "",
    guests: 2,
    zone: "",
    anlass: [],
    sonstigesText: "",
    name: "",
    email: "",
    phone: "",
    message: "",
    billardUnitId: "",
    billardUnitName: "",
    acceptedTerms: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [returningGuest, setReturningGuest] = useState(false);

  // Stammgast-Autofill: gespeicherte Kontaktdaten aus dem Browser übernehmen
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { name?: string; email?: string; phone?: string };
      if (!saved?.name && !saved?.email && !saved?.phone) return;
      setData(prev => ({
        ...prev,
        name: saved.name ?? prev.name,
        email: saved.email ?? prev.email,
        phone: saved.phone ?? prev.phone,
      }));
      setReturningGuest(true);
    } catch { /* noop */ }
  }, []);

  const clearSavedContact = () => {
    try { localStorage.removeItem(CONTACT_STORAGE_KEY); } catch { /* noop */ }
    setReturningGuest(false);
    setData(prev => ({ ...prev, name: "", email: "", phone: "" }));
  };
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  type BillardTable = { id: string; name: string; available: boolean; blocked: boolean };
  const [billardTables, setBillardTables] = useState<BillardTable[]>([]);
  const [billardLoading, setBillardLoading] = useState(false);

  const {
    availability, refresh: refreshAvailability, loading: availabilityLoading, dayFullyBlocked, isAreaBlocked, effectiveCapacity,
    getCountForZoneAtTime, isZoneFullyBooked, isTimeFullyBooked, freeSlotsAtTime,
  } = useZoneAvailability(data.date);

  // Find the earliest later time slot where the given zone has free capacity.
  const findNextFreeTimeForZone = useCallback((zone: ZoneKey, fromTime: string): string | null => {
    if (!data.date) return null;
    const slots = getTimesForDate(data.date);
    const fromMin = toMin(fromTime);
    for (const t of slots) {
      if (toMin(t) <= fromMin) continue;
      if (isTimeInPast(data.date, t)) continue;
      if (!isZoneFullyBooked(zone, t)) return t;
    }
    return null;
  }, [data.date, getTimesForDate, isZoneFullyBooked]);

  const canNext = () => {
    switch (step) {
      case 0: return data.date && data.time;
      case 1: return data.guests >= 1;
      case 2:
        if (data.zone === "") return false;
        if (data.zone === "billard" && !data.billardUnitId) return false;
        return true;
      case 3: return data.anlass.length > 0 && (!data.anlass.includes("sonstiges") || data.sonstigesText.trim().length > 0);
      case 4: return data.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) && data.phone.trim().length >= 3 && data.acceptedTerms;
      default: return true;
    }
  };

  // Billard tables: load per date+time when billard zone selected
  useEffect(() => {
    if (data.zone !== "billard" || !data.date || !data.time) {
      setBillardTables([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setBillardLoading(true);
      try {
        const base = import.meta.env.VITE_SUPABASE_URL as string;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
        const url = `${base}/functions/v1/billard-availability?date=${encodeURIComponent(data.date)}&time=${encodeURIComponent(data.time)}`;
        const r = await fetch(url, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
        const json = await r.json();
        if (!cancelled && json?.tables) {
          const tables = json.tables as BillardTable[];
          setBillardTables(tables);
          if (data.billardUnitId) {
            const stillFree = tables.find(t => t.id === data.billardUnitId && t.available);
            if (!stillFree) setData(prev => ({ ...prev, billardUnitId: "", billardUnitName: "" }));
          }
        }
      } catch { /* noop */ }
      finally { if (!cancelled) setBillardLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [data.zone, data.date, data.time, availability]);

  // Smooth-scroll to billard table picker on mobile when zone is selected and tables loaded
  useEffect(() => {
    if (data.zone === "billard" && billardTables.length > 0 && billardSectionRef.current) {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        setTimeout(() => {
          billardSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [data.zone, billardTables]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");

    try {
      await refreshAvailability();

      if (isTimeInPast(data.date, data.time)) {
        setSubmitError("Diese Uhrzeit liegt bereits in der Vergangenheit.");
        setStep(0);
        return;
      }

      if (data.zone && isZoneFullyBooked(data.zone as ZoneKey, data.time)) {
        setSubmitError("Der gewählte Bereich ist zu dieser Uhrzeit bereits vollständig belegt. Bitte wähle eine andere Zeit oder einen anderen Bereich.");
        setStep(2);
        return;
      }

      const response = await supabase.functions.invoke("create-reservation", {
        body: {
          date: data.date,
          time: data.time,
          guests: data.guests,
          zone: data.zone,
          anlass: data.anlass.includes("sonstiges") && data.sonstigesText.trim()
            ? [...data.anlass.filter(a => a !== "sonstiges"), `sonstiges: ${data.sonstigesText.trim().replace(/,/g, ";")}`].join(", ")
            : data.anlass.join(", "),
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          honeypot: "",
          unit_id: data.zone === "billard" ? data.billardUnitId : undefined,
        },
      });

      if (response.error) {
        const responseContext = (response.error as { context?: Response }).context;
        let detailedError = "";

        if (responseContext) {
          const parsed = await responseContext.json().catch(() => null) as { error?: string } | null;
          detailedError = parsed?.error ?? "";
        }

        setSubmitError(detailedError || "Reservierung konnte nicht gespeichert werden. Bitte prüfe Datum, Uhrzeit und Bereich.");
        return;
      }

      if (response.data?.error) {
        setSubmitError(response.data.error);
        return;
      }

      try {
        localStorage.setItem(
          CONTACT_STORAGE_KEY,
          JSON.stringify({ name: data.name, email: data.email, phone: data.phone }),
        );
      } catch { /* noop */ }

      void announceChange();
      setSubmitted(true);
    } catch {
      setSubmitError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  const [timePeriod, setTimePeriod] = useState<TimePeriod | null>(null);
  const timesForDate = data.date ? getTimesForDate(data.date) : [];
  const periodsForDate = TIME_PERIODS.filter(p => timesForDate.some(t => p.match(Number(t.slice(0, 2)))));
  const activePeriod: TimePeriod | undefined =
    (timePeriod && periodsForDate.some(p => p.key === timePeriod) ? timePeriod : undefined)
    ?? (data.time ? periodOf(data.time) : undefined)
    ?? periodsForDate.find(p => timesForDate.some(t => p.match(Number(t.slice(0, 2))) && !isTimeInPast(data.date, t) && !isTimeFullyBooked(t)))?.key
    ?? periodsForDate[0]?.key;

  const selectedTimeDisabled = Boolean(data.time) && (!data.date || isTimeInPast(data.date, data.time) || isTimeFullyBooked(data.time));

  useEffect(() => {
    if (!data.time) return;
    if (selectedTimeDisabled) {
      setData((prev) => ({ ...prev, time: "", zone: "" }));
    }
  }, [data.time, selectedTimeDisabled]);

  useEffect(() => {
    if (!data.zone || !data.time) return;
    if (isZoneFullyBooked(data.zone as ZoneKey, data.time)) {
      setData((prev) => ({ ...prev, zone: "" }));
    }
  }, [data.zone, data.time, isZoneFullyBooked]);

  // Prevent the page from jumping when changing steps – keep the form anchor stable
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
  }, [step]);


  if (submitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle size={64} className="text-primary mx-auto mb-6" />
        <h3 className="font-display text-3xl mb-4">Reservierung eingegangen!</h3>
        <p className="text-muted-foreground mb-2">Vielen Dank, <strong>{data.name}</strong>!</p>
        <p className="text-muted-foreground mb-6">
          Wir haben deine Reservierung für <strong>{data.guests} Personen</strong> am <strong>{formatDateDe(data.date)}</strong> um <strong>{data.time} Uhr</strong> erhalten.
        </p>
        <div className="bg-card border border-border rounded-lg p-6 inline-block text-left max-w-sm">
          <p className="text-sm"><strong>Bereich:</strong> {ZONES.find(z => z.value === data.zone)?.label}</p>
          {data.zone === "billard" && data.billardUnitName && (
            <p className="text-sm"><strong>Tisch:</strong> {data.billardUnitName}</p>
          )}
              <p className="text-sm"><strong>Anlass:</strong> {data.anlass.map(a => {
                const found = ANLAESSE.find(x => x.value === a);
                if (a === "sonstiges" && data.sonstigesText.trim()) return `Sonstiges: ${data.sonstigesText.trim()}`;
                return found?.label ?? a;
              }).join(", ")}</p>
          <p className="text-sm"><strong>E-Mail:</strong> {data.email}</p>
          <p className="text-sm"><strong>Telefon:</strong> {data.phone}</p>
          {data.message && <p className="text-sm"><strong>Nachricht:</strong> {data.message}</p>}
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          Wir bestätigen deine Reservierung telefonisch oder per E-Mail.
        </p>

        <button
          onClick={() => { setSubmitted(false); setStep(0); setData({ date: "", time: "", guests: 2, zone: "", anlass: [], sonstigesText: "", name: "", email: "", phone: "", message: "", billardUnitId: "", billardUnitName: "", acceptedTerms: false }); }}
          className="mt-6 border border-primary text-primary px-6 py-2 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Neue Reservierung
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {/* Step indicator: compact progress on phones, icon row from sm up */}
      <div className="mb-6 sm:hidden">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-primary">{STEPS[step].label}</span>
          <span className="text-muted-foreground">Schritt {step + 1} von {STEPS.length}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>
      <div className="mb-8 hidden items-center justify-between gap-1 overflow-x-auto sm:flex">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 text-xs font-medium whitespace-nowrap px-2 py-1 rounded-full transition-colors ${
              i === step ? "bg-primary text-primary-foreground" : i < step ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {s.icon}
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="sm:min-h-[360px]">
        {step === 0 && (
          <div>
            <h3 className="font-display text-2xl mb-4">Wann möchtest du kommen?</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="min-w-0">
                <label className="block text-sm font-medium mb-2">Datum</label>
                <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                  {Array.from({ length: QUICK_DAYS }, (_, i) => {
                    const d = new Date(); d.setDate(d.getDate() + i);
                    const iso = toIsoDate(d);
                    const closed = getTimesForDate(iso).length === 0;
                    const selected = data.date === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled={closed}
                        onClick={() => setData({ ...data, date: iso, time: "", zone: "" })}
                        className={`flex w-[58px] shrink-0 flex-col items-center rounded-lg border py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted hover:border-primary/50"
                        }`}
                      >
                        <span className={`text-[11px] font-medium ${selected ? "" : "text-muted-foreground"}`}>
                          {i === 0 ? "Heute" : i === 1 ? "Morgen" : d.toLocaleDateString("de-DE", { weekday: "short" })}
                        </span>
                        <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                        <span className={`text-[10px] ${selected ? "" : "text-muted-foreground"}`}>
                          {closed ? "zu" : d.toLocaleDateString("de-DE", { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="date"
                  value={data.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setData({ ...data, date: e.target.value, time: "", zone: "" })}
                  className="w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">Oder wähle oben direkt einen der nächsten Tage.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Uhrzeit</label>
                {!data.date ? (
                  <div className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                    Bitte zuerst ein Datum wählen.
                  </div>
                ) : dayFullyBlocked ? (
                  <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
                    <p className="font-semibold text-primary">An diesem Tag sind keine Reservierungen möglich.</p>
                    {dayFullyBlocked.reason && <p className="text-foreground mt-1">{dayFullyBlocked.reason}</p>}
                    <p className="text-muted-foreground mt-1">Bitte wähle ein anderes Datum.</p>
                  </div>
                ) : (
                  <>
                    {availabilityLoading && (
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Lädt...
                      </p>
                    )}
                    {getTimesForDate(data.date).length === 0 && (
                      <p className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                        An diesem Tag haben wir geschlossen. Bitte wähle ein anderes Datum.
                      </p>
                    )}
                    {periodsForDate.length > 1 && (
                      <div className="mb-3 grid gap-1 rounded-lg bg-muted p-1" style={{ gridTemplateColumns: `repeat(${periodsForDate.length}, minmax(0, 1fr))` }}>
                        {periodsForDate.map(p => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setTimePeriod(p.key)}
                            className={`rounded-md px-2 py-2 text-xs font-semibold transition-colors ${
                              activePeriod === p.key ? "bg-card text-foreground shadow" : "text-muted-foreground"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-2 sm:max-h-48 sm:overflow-y-auto">
                      {timesForDate.filter(t => !activePeriod || periodOf(t) === activePeriod).map((t) => {
                        const disabled = isTimeInPast(data.date, t) || isTimeFullyBooked(t);
                        const free = freeSlotsAtTime(t);
                        const scarce = !disabled && free > 0 && free <= 3;
                        return (
                          <button
                            key={t}
                            disabled={disabled}
                            title={disabled ? "Nicht verfügbar" : scarce ? `Nur noch ${free} Tische frei` : "Viele Tische frei"}
                            onClick={() => setData({ ...data, time: t, zone: "" })}
                            className={`relative px-3 py-2 text-sm rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                              data.time === t
                                ? "bg-primary text-primary-foreground border-primary"
                                : disabled
                                  ? "bg-muted border-border"
                                  : "bg-muted border-border hover:border-primary/50"
                            }`}
                          >
                            {t}
                            {!disabled && data.time !== t && (
                              <span
                                aria-hidden
                                className={`absolute top-1 right-1 h-1.5 w-1.5 rounded-full ${scarce ? "bg-amber-400" : "bg-emerald-500"}`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Viel frei</span>
                      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Fast ausgebucht</span>
                      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" /> Ausgebucht</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className="font-display text-2xl mb-4">Wie viele Personen?</h3>
            <div className="flex items-center gap-6 justify-center py-8">
              <button
                onClick={() => setData({ ...data, guests: Math.max(1, data.guests - 1) })}
                className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-2xl hover:border-primary transition-colors"
              >
                −
              </button>
              <span className="font-display text-6xl text-primary w-20 text-center">{data.guests}</span>
              <button
                onClick={() => setData({ ...data, guests: Math.min(50, data.guests + 1) })}
                className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-2xl hover:border-primary transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Für Gruppen ab 11 Personen empfehlen wir unseren VIP-Raum.
            </p>
            {data.guests >= 10 && (
              <div className="mt-6 max-w-md mx-auto bg-primary/10 border border-primary/30 rounded-lg p-4 text-left animate-fade-in">
                <p className="text-sm font-semibold text-primary mb-1">Große Gruppe – wir planen mit dir</p>
                <p className="text-sm text-foreground">
                  Ab 10 Personen kümmern wir uns persönlich um euch. Schreib uns im nächsten Schritt
                  kurz in die Nachricht, was ihr euch wünscht – z.&nbsp;B. welches Spiel laufen soll,
                  ob es ein Geburtstag ist oder ob ihr Snacks und Getränke vorbestellen wollt.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-display text-2xl mb-4">Welchen Bereich bevorzugst du?</h3>

            {data.time && (
              <div className="mb-4 bg-muted border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground">
                Reservierung für <span className="text-foreground font-semibold">{formatDateDe(data.date)}</span> um <span className="text-foreground font-semibold">{data.time} Uhr</span>
              </div>
            )}

            {/* Zone-specific info box - shown FIRST so customers see it immediately */}
            {data.zone && ZONES.find(z => z.value === data.zone)?.info && (
              <div className="mb-4 bg-primary/10 border border-primary/30 rounded-lg p-4 animate-fade-in">
                <p className="text-sm font-medium text-primary mb-1">
                  ℹ️ Wichtige Info zu: {ZONES.find(z => z.value === data.zone)?.label}
                </p>
                <p className="text-sm text-foreground">
                  {ZONES.find(z => z.value === data.zone)?.info}
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {ZONES.map((z) => {
                const zone = z.value as ZoneKey;
                const booked = data.time ? getCountForZoneAtTime(data.time, zone) : 0;
                const capacity = effectiveCapacity(zone);
                const noTables = capacity <= 0;
                const isFull = noTables || (Boolean(data.time) && booked >= capacity);
                // Billard kann ab 20:00 nicht mehr gebucht werden
                const billardClosed =
                  zone === "billard" &&
                  Boolean(data.time) &&
                  Number(data.time.split(":")[0]) >= 20;
                const areaBlocked = isAreaBlocked(zone);
                const disabled = isFull || billardClosed || areaBlocked;
                const nextFree = isFull && !billardClosed && !areaBlocked && data.time ? findNextFreeTimeForZone(zone, data.time) : null;

                return (
                  <button
                    key={z.value}
                    disabled={disabled}
                    onClick={() => setData({ ...data, zone: z.value as ReservationZone })}
                    className={`text-left p-4 rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                      data.zone === z.value
                        ? "border-primary bg-primary/10"
                        : disabled
                          ? "border-border bg-muted"
                          : "border-border bg-muted hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold">{z.label}</p>
                    <p className="text-xs text-muted-foreground">{z.desc}</p>
                    {areaBlocked && (
                      <p className="mt-2 text-xs font-semibold text-primary">
                        An diesem Tag gesperrt.
                      </p>
                    )}
                    {billardClosed && !areaBlocked && (
                      <p className="mt-2 text-xs font-semibold text-primary">
                        Ab 20:00 Uhr keine Billard-Reservierung mehr möglich.
                      </p>
                    )}
                    {noTables && !billardClosed && (
                      <p className="mt-2 text-xs font-semibold text-primary">
                        Aktuell nicht verfügbar.
                      </p>
                    )}
                    {isFull && !noTables && !billardClosed && (
                      <p className="mt-2 text-xs font-semibold text-primary">
                        Belegt um {data.time}.
                        {nextFree
                          ? <> Nächste freie Uhrzeit: <span className="underline">{nextFree}</span></>
                          : <> Heute keine freie Uhrzeit mehr.</>}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {data.zone === "billard" && (
              <div ref={billardSectionRef} className="mt-6">
                <h4 className="font-display text-lg mb-2">Billard-Tisch wählen</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Wähle deinen bevorzugten Tisch. Belegte oder gesperrte Tische sind ausgegraut.
                </p>
                {billardLoading ? (
                  <p className="text-sm text-muted-foreground">Verfügbarkeit wird geladen…</p>
                ) : billardTables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Tische gefunden.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {billardTables.map((t) => {
                      const disabled = !t.available;
                      const selected = data.billardUnitId === t.id;
                      return (
                        <button
                          key={t.id}
                          disabled={disabled}
                          onClick={() => setData({ ...data, billardUnitId: t.id, billardUnitName: t.name })}
                          className={`px-3 py-2 text-sm rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                            selected
                              ? "border-primary bg-primary/10 text-foreground"
                              : disabled
                                ? "border-border bg-muted text-muted-foreground"
                                : "border-border bg-muted hover:border-primary/50"
                          }`}
                        >
                          {t.name}
                          {t.blocked && <span className="block text-[10px] text-muted-foreground">Gesperrt</span>}
                          {!t.blocked && !t.available && <span className="block text-[10px] text-muted-foreground">Belegt</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-display text-2xl mb-4">Was ist der Anlass?</h3>
            <p className="text-sm text-muted-foreground mb-3">Du kannst mehrere Anlässe auswählen.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {ANLAESSE.map((a) => {
                const selected = data.anlass.includes(a.value as ReservationAnlass);
                return (
                  <button
                    key={a.value}
                    onClick={() => {
                      const val = a.value as ReservationAnlass;
                      setData({
                        ...data,
                        anlass: selected
                          ? data.anlass.filter(x => x !== val)
                          : [...data.anlass, val],
                        ...(a.value !== "sonstiges" ? {} : {}),
                      });
                    }}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold">{a.label}</p>
                  </button>
                );
              })}
            </div>
            {data.anlass.includes("sonstiges") && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Was genau? *</label>
                <input
                  type="text"
                  value={data.sonstigesText}
                  onChange={(e) => setData({ ...data, sonstigesText: e.target.value })}
                  placeholder="z.B. Geburtstag, Firmenevent..."
                  className="w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="font-display text-2xl mb-4">Deine Kontaktdaten</h3>
            {returningGuest && (
              <div className="mb-4 max-w-md flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
                <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-foreground">Willkommen zurück! Wir haben deine Daten vorausgefüllt.</p>
                  <button
                    onClick={clearSavedContact}
                    className="text-primary underline hover:no-underline text-xs mt-1"
                  >
                    Daten löschen
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  placeholder="Dein Name"
                  className="w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-Mail *</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="deine@email.de"
                  className="w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefon *</label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  placeholder="+49 ..."
                  className="w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nachricht (optional)</label>
                <textarea
                  value={data.message}
                  onChange={(e) => setData({ ...data, message: e.target.value })}
                  placeholder="Besondere Wünsche..."
                  rows={3}
                  className="w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={data.acceptedTerms}
                  onChange={(e) => setData({ ...data, acceptedTerms: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-primary cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-muted-foreground">
                  Ich habe die <a href="https://www.rondo-sportsbar.de/datenschutz/" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Datenschutzerklärung</a> gelesen und akzeptiere diese. *
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h3 className="font-display text-2xl mb-4">Zusammenfassung</h3>

            {/* Zone info prominently shown */}
            {data.zone && ZONES.find(z => z.value === data.zone)?.info && (
              <div className="mb-4 bg-primary/10 border border-primary/30 rounded-lg p-4">
                <p className="text-sm font-medium text-primary mb-1">
                  ℹ️ Wichtige Info: {ZONES.find(z => z.value === data.zone)?.label}
                </p>
                <p className="text-sm text-foreground">
                  {ZONES.find(z => z.value === data.zone)?.info}
                </p>
              </div>
            )}

            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-3 max-w-md text-sm sm:text-base">
              <p><strong>Datum:</strong> {formatDateDe(data.date)}</p>
              <p><strong>Uhrzeit:</strong> {data.time} Uhr</p>
              <p><strong>Personen:</strong> {data.guests}</p>
              <p><strong>Bereich:</strong> {ZONES.find(z => z.value === data.zone)?.label}</p>
              {data.zone === "billard" && data.billardUnitName && (
                <p><strong>Tisch:</strong> {data.billardUnitName}</p>
              )}
              <p><strong>Anlass:</strong> {data.anlass.map(a => {
                const found = ANLAESSE.find(x => x.value === a);
                if (a === "sonstiges" && data.sonstigesText.trim()) return `Sonstiges: ${data.sonstigesText.trim()}`;
                return found?.label ?? a;
              }).join(", ")}</p>
              <p><strong>Name:</strong> {data.name}</p>
              <p><strong>E-Mail:</strong> {data.email}</p>
              <p><strong>Telefon:</strong> {data.phone}</p>
              {data.message && <p><strong>Nachricht:</strong> {data.message}</p>}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Nach dem Absenden erhältst du eine Bestätigungs-E-Mail mit allen Details und einer Stornierungsmöglichkeit.
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons – pinned to the bottom of the screen on phones */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex items-center gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mt-8 sm:justify-between sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          aria-label="Zurück"
          className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-3 text-foreground transition-colors hover:border-primary/50 disabled:opacity-30 sm:px-6 sm:py-2.5"
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Zurück</span>
        </button>
        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30 sm:flex-none sm:py-2.5"
          >
            Weiter <ArrowRight size={16} />
          </button>
        ) : (
          <div className="flex flex-1 flex-col items-stretch gap-2 sm:flex-none sm:items-end">
            {submitError && <p className="text-destructive text-sm">{submitError}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 sm:py-2.5"
            >
              {submitting ? "Wird gesendet..." : "Reservierung absenden"} <CheckCircle size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RondoReservationSystem;
