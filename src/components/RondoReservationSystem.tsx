import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarDays,
  Users,
  MapPin,
  Utensils,
  User,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Minus,
  Plus,
  Info,
} from "lucide-react";
import { useOpeningHours } from "@/hooks/useOpeningHours";

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

type ActiveReservation = {
  reservation_time: string;
  zone: Exclude<ReservationZone, "">;
};

type ZoneKey = Exclude<ReservationZone, "">;
type AvailabilityMap = Record<string, Partial<Record<ZoneKey, number>>>;

const ZONE_CAPACITY: Record<ZoneKey, number> = {
  hauptbereich: 7,
  fenster: 3,
  billard: 8,
  vip: 6,
  podest: 4,
  salitos: 15,
};

const STEPS = [
  { icon: <CalendarDays size={18} />, label: "Termin", short: "Termin" },
  { icon: <Users size={18} />, label: "Personen", short: "Gäste" },
  { icon: <MapPin size={18} />, label: "Bereich", short: "Bereich" },
  { icon: <Utensils size={18} />, label: "Anlass", short: "Anlass" },
  { icon: <User size={18} />, label: "Kontaktdaten", short: "Kontakt" },
  { icon: <CheckCircle size={18} />, label: "Bestätigung", short: "Check" },
];

// Reusable input style — thin border, primary glow on focus, generous touch target
const inputClass =
  "w-full bg-muted/40 border border-border/80 rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-muted/60";
const inputWithIconClass =
  "w-full bg-muted/40 border border-border/80 rounded-xl pl-11 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-muted/60";

const RondoReservationSystem = () => {
  const { getTimesForDate } = useOpeningHours();
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
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
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const zoneKeys = useMemo(() => Object.keys(ZONE_CAPACITY) as ZoneKey[], []);

  const fetchAvailability = useCallback(async (date: string) => {
    if (!date) {
      setAvailability({});
      return;
    }

    setAvailabilityLoading(true);
    const { data: activeReservations, error } = await supabase
      .from("reservations")
      .select("reservation_time, zone")
      .eq("reservation_date", date)
      .not("status", "in", '("cancelled","checked_out")')
      .in("zone", zoneKeys);

    if (error) {
      setAvailabilityLoading(false);
      return;
    }

    const grouped = (activeReservations as ActiveReservation[]).reduce<AvailabilityMap>((acc, reservation) => {
      if (!acc[reservation.reservation_time]) {
        acc[reservation.reservation_time] = {};
      }
      const current = acc[reservation.reservation_time][reservation.zone] ?? 0;
      acc[reservation.reservation_time][reservation.zone] = current + 1;
      return acc;
    }, {});

    setAvailability(grouped);
    setAvailabilityLoading(false);
  }, [zoneKeys]);

  useEffect(() => {
    void fetchAvailability(data.date);
  }, [data.date, fetchAvailability]);

  useEffect(() => {
    if (!data.date) return;

    const channel = supabase
      .channel(`availability-${data.date}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `reservation_date=eq.${data.date}` }, () => {
        void fetchAvailability(data.date);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [data.date, fetchAvailability]);

  const getCountForZoneAtTime = useCallback((time: string, zone: ZoneKey) => {
    return availability[time]?.[zone] ?? 0;
  }, [availability]);

  const isZoneFullyBooked = useCallback((zone: ZoneKey, time: string) => {
    return getCountForZoneAtTime(time, zone) >= ZONE_CAPACITY[zone];
  }, [getCountForZoneAtTime]);

  const isTimeInPast = useCallback((date: string, time: string) => {
    if (!date) return true;
    const today = new Date().toISOString().split("T")[0];
    if (date !== today) return false;

    const [hour, minute] = time.split(":").map(Number);
    const selectedDateTime = new Date();
    selectedDateTime.setHours(hour, minute, 0, 0);
    return selectedDateTime.getTime() <= Date.now();
  }, []);

  const isTimeFullyBooked = useCallback((time: string) => {
    return zoneKeys.every((zone) => isZoneFullyBooked(zone, time));
  }, [isZoneFullyBooked, zoneKeys]);

  const canNext = () => {
    switch (step) {
      case 0: return data.date && data.time;
      case 1: return data.guests >= 1;
      case 2: return data.zone !== "";
      case 3: return data.anlass.length > 0 && (!data.anlass.includes("sonstiges") || data.sonstigesText.trim().length > 0);
      case 4: return data.name.trim() && data.email.trim() && data.phone.trim();
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");

    try {
      await fetchAvailability(data.date);

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

      setSubmitted(true);
    } catch {
      setSubmitError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

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
          Wir haben deine Reservierung für <strong>{data.guests} Personen</strong> am <strong>{data.date}</strong> um <strong>{data.time} Uhr</strong> erhalten.
        </p>
        <div className="bg-muted/40 border border-border rounded-2xl p-6 inline-block text-left max-w-sm">
          <p className="text-sm"><strong>Bereich:</strong> {ZONES.find(z => z.value === data.zone)?.label}</p>
              <p className="text-sm"><strong>Anlass:</strong> {data.anlass.map(a => {
                const found = ANLAESSE.find(x => x.value === a);
                if (a === "sonstiges" && data.sonstigesText.trim()) return `Sonstiges: ${data.sonstigesText.trim()}`;
                return found?.label ?? a;
              }).join(", ")}</p>
          <p className="text-sm"><strong>E-Mail:</strong> {data.email}</p>
          <p className="text-sm"><strong>Telefon:</strong> {data.phone}</p>
          {data.message && <p className="text-sm"><strong>Nachricht:</strong> {data.message}</p>}
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Wir bestätigen deine Reservierung telefonisch oder per E-Mail.
        </p>
        <button
          onClick={() => { setSubmitted(false); setStep(0); setData({ date: "", time: "", guests: 2, zone: "", anlass: [], sonstigesText: "", name: "", email: "", phone: "", message: "" }); }}
          className="mt-6 inline-flex items-center gap-2 border border-primary text-primary px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
        >
          Neue Reservierung
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {/* Modern Stepper */}
      <div className="mb-8 md:mb-10">
        {/* Mobile: condensed progress + label */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
              Schritt {step + 1} von {STEPS.length}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              {STEPS[step].icon}
              {STEPS[step].label}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop: dot-stepper with connectors */}
        <div className="hidden sm:flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex-1 flex items-center last:flex-none">
                <div className="flex flex-col items-center gap-2 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_0_6px_rgba(255,218,0,0.12)]"
                        : isDone
                          ? "bg-primary/15 text-primary border-primary/40"
                          : "bg-muted/50 text-muted-foreground border-border"
                    }`}
                  >
                    {isDone ? <CheckCircle size={18} /> : s.icon}
                  </div>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                      isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.short}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2 mb-6 bg-gradient-to-r from-border via-border to-border relative">
                    <div
                      className="absolute inset-0 bg-primary transition-all duration-500"
                      style={{ width: i < step ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[420px] sm:min-h-[380px]">
        {step === 0 && (
          <div className="animate-fade-in">
            <h3 className="font-display text-3xl md:text-4xl mb-1.5 leading-tight">Wann möchtest du kommen?</h3>
            <p className="text-sm text-muted-foreground mb-6">Wähle Datum und gewünschte Uhrzeit.</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/90">Datum</label>
                <div className="relative">
                  <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                  <input
                    type="date"
                    value={data.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setData({ ...data, date: e.target.value, time: "", zone: "" })}
                    className={inputWithIconClass}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Bitte wähle ein Datum für deine Reservierung.</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-foreground/90">
                  <Clock size={16} className="text-primary" /> Uhrzeit
                </label>
                {!data.date ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3.5 text-sm text-muted-foreground">
                    Bitte zuerst ein Datum wählen.
                  </div>
                ) : (
                  <>
                    {availabilityLoading && (
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Lädt...
                      </p>
                    )}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                      {getTimesForDate(data.date).map((t) => {
                        const disabled = isTimeInPast(data.date, t) || isTimeFullyBooked(t);
                        return (
                          <button
                            key={t}
                            disabled={disabled}
                            onClick={() => setData({ ...data, time: t, zone: "" })}
                            className={`min-h-[44px] px-3 py-2.5 text-sm font-semibold rounded-xl border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                              data.time === t
                                ? "bg-gradient-to-b from-primary to-primary/85 text-primary-foreground border-primary shadow-[0_4px_12px_-2px_rgba(255,218,0,0.35)] scale-[1.02]"
                                : disabled
                                  ? "bg-muted/30 border-border/50 text-muted-foreground"
                                  : "bg-muted/40 border-border/80 hover:border-primary/60 hover:bg-muted/70 active:scale-95"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Wähle deine gewünschte Uhrzeit.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h3 className="font-display text-3xl md:text-4xl mb-1.5 leading-tight">Wie viele Personen?</h3>
            <p className="text-sm text-muted-foreground mb-6">Anzahl der Gäste auswählen.</p>
            <div className="flex items-center gap-6 justify-center py-10">
              <button
                aria-label="Weniger Personen"
                onClick={() => setData({ ...data, guests: Math.max(1, data.guests - 1) })}
                className="w-14 h-14 rounded-2xl border border-border bg-muted/40 flex items-center justify-center hover:border-primary hover:bg-primary/10 hover:text-primary active:scale-95 transition-all"
              >
                <Minus size={22} />
              </button>
              <div className="flex flex-col items-center min-w-[110px]">
                <span className="font-display text-7xl text-primary leading-none tabular-nums">{data.guests}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2">{data.guests === 1 ? "Person" : "Personen"}</span>
              </div>
              <button
                aria-label="Mehr Personen"
                onClick={() => setData({ ...data, guests: Math.min(50, data.guests + 1) })}
                className="w-14 h-14 rounded-2xl border border-border bg-muted/40 flex items-center justify-center hover:border-primary hover:bg-primary/10 hover:text-primary active:scale-95 transition-all"
              >
                <Plus size={22} />
              </button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Für Gruppen ab 11 Personen empfehlen wir unseren VIP-Raum.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h3 className="font-display text-3xl md:text-4xl mb-1.5 leading-tight">Welchen Bereich bevorzugst du?</h3>
            <p className="text-sm text-muted-foreground mb-6">Wähle den passenden Bereich für deinen Besuch.</p>

            {data.time && (
              <div className="mb-4 bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <CalendarDays size={14} className="text-primary" />
                Reservierung für <span className="text-foreground font-semibold">{data.date}</span> um <span className="text-foreground font-semibold">{data.time} Uhr</span>
              </div>
            )}

            {/* Zone-specific info box - shown FIRST so customers see it immediately */}
            {data.zone && ZONES.find(z => z.value === data.zone)?.info && (
              <div className="mb-4 bg-primary/10 border border-primary/30 rounded-xl p-4 animate-fade-in">
                <p className="text-sm font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <Info size={14} /> Wichtige Info zu: {ZONES.find(z => z.value === data.zone)?.label}
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
                const capacity = ZONE_CAPACITY[zone];
                const isFull = Boolean(data.time) && booked >= capacity;

                return (
                  <button
                    key={z.value}
                    disabled={isFull}
                    onClick={() => setData({ ...data, zone: z.value as ReservationZone })}
                    className={`text-left p-4 min-h-[80px] rounded-xl border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
                      data.zone === z.value
                        ? "border-primary bg-primary/10 shadow-[0_4px_20px_-6px_rgba(255,218,0,0.3)] scale-[1.01]"
                        : isFull
                          ? "border-border bg-muted/40"
                          : "border-border/80 bg-muted/40 hover:border-primary/60 hover:bg-muted/70 active:scale-[0.99]"
                    }`}
                  >
                    <p className="font-semibold text-base">{z.label}</p>
                    <p className="text-xs text-muted-foreground">{z.desc}</p>
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h3 className="font-display text-3xl md:text-4xl mb-1.5 leading-tight">Was ist der Anlass?</h3>
            <p className="text-sm text-muted-foreground mb-6">Du kannst mehrere Anlässe auswählen.</p>
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
                    className={`text-left p-4 min-h-[60px] rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                      selected
                        ? "border-primary bg-primary/10 shadow-[0_4px_20px_-6px_rgba(255,218,0,0.3)]"
                        : "border-border/80 bg-muted/40 hover:border-primary/60 hover:bg-muted/70 active:scale-[0.99]"
                    }`}
                  >
                    <p className="font-semibold">{a.label}</p>
                    {selected && <CheckCircle size={18} className="text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
            {data.anlass.includes("sonstiges") && (
              <div className="mt-5">
                <label className="block text-sm font-semibold mb-2 text-foreground/90">Was genau? *</label>
                <input
                  type="text"
                  value={data.sonstigesText}
                  onChange={(e) => setData({ ...data, sonstigesText: e.target.value })}
                  placeholder="z.B. Geburtstag, Firmenevent..."
                  className={inputClass}
                />
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in">
            <h3 className="font-display text-3xl md:text-4xl mb-1.5 leading-tight">Deine Kontaktdaten</h3>
            <p className="text-sm text-muted-foreground mb-6">Wir benötigen diese Daten zur Bestätigung.</p>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/90">Name *</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    placeholder="Dein Name"
                    className={inputWithIconClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/90">E-Mail *</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    placeholder="deine@email.de"
                    className={inputWithIconClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/90">Telefon *</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                  <input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                    placeholder="+49 ..."
                    className={inputWithIconClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/90">Nachricht (optional)</label>
                <div className="relative">
                  <MessageSquare size={18} className="absolute left-4 top-4 text-primary pointer-events-none" />
                  <textarea
                    value={data.message}
                    onChange={(e) => setData({ ...data, message: e.target.value })}
                    placeholder="Besondere Wünsche..."
                    rows={3}
                    className={`${inputWithIconClass} resize-none`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-fade-in">
            <h3 className="font-display text-3xl md:text-4xl mb-1.5 leading-tight">Zusammenfassung</h3>
            <p className="text-sm text-muted-foreground mb-6">Bitte prüfe deine Angaben vor dem Absenden.</p>

            {/* Zone info prominently shown */}
            {data.zone && ZONES.find(z => z.value === data.zone)?.info && (
              <div className="mb-4 bg-primary/10 border border-primary/30 rounded-xl p-4">
                <p className="text-sm font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <Info size={14} /> Wichtige Info: {ZONES.find(z => z.value === data.zone)?.label}
                </p>
                <p className="text-sm text-foreground">
                  {ZONES.find(z => z.value === data.zone)?.info}
                </p>
              </div>
            )}

            <div className="bg-muted/40 border border-border rounded-2xl p-6 max-w-md divide-y divide-border/60">
              {[
                { label: "Datum", value: data.date },
                { label: "Uhrzeit", value: `${data.time} Uhr` },
                { label: "Personen", value: data.guests },
                { label: "Bereich", value: ZONES.find(z => z.value === data.zone)?.label },
                {
                  label: "Anlass",
                  value: data.anlass.map(a => {
                    const found = ANLAESSE.find(x => x.value === a);
                    if (a === "sonstiges" && data.sonstigesText.trim()) return `Sonstiges: ${data.sonstigesText.trim()}`;
                    return found?.label ?? a;
                  }).join(", "),
                },
                { label: "Name", value: data.name },
                { label: "E-Mail", value: data.email },
                { label: "Telefon", value: data.phone },
                ...(data.message ? [{ label: "Nachricht", value: data.message }] : []),
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0 text-sm">
                  <span className="text-muted-foreground font-medium">{row.label}</span>
                  <span className="text-foreground font-semibold text-right break-words">{row.value}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Nach dem Absenden erhältst du eine Bestätigungs-E-Mail mit allen Details und einer Stornierungsmöglichkeit.
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center gap-3 mt-10 pt-6 border-t border-border/60">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 min-h-[48px] border border-border text-foreground rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/60 hover:bg-muted/50 active:scale-95 transition-all font-semibold"
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Zurück</span>
        </button>
        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="group inline-flex items-center gap-2 px-6 sm:px-8 py-3 min-h-[48px] bg-gradient-to-b from-primary to-primary/85 text-primary-foreground rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_8px_24px_-4px_rgba(255,218,0,0.45)] hover:from-primary hover:to-primary active:scale-95 transition-all font-bold tracking-wide"
          >
            Weiter <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        ) : (
          <div className="flex flex-col items-end gap-2">
            {submitError && <p className="text-destructive text-sm font-medium">{submitError}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="group inline-flex items-center gap-2 px-6 sm:px-8 py-3 min-h-[48px] bg-gradient-to-b from-primary to-primary/85 text-primary-foreground rounded-xl hover:shadow-[0_8px_24px_-4px_rgba(255,218,0,0.45)] hover:from-primary hover:to-primary active:scale-95 transition-all font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Wird gesendet…
                </>
              ) : (
                <>
                  Reservierung absenden <CheckCircle size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RondoReservationSystem;
