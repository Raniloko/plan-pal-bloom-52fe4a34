import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Users, MapPin, Utensils, User, CheckCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
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
  billardUnitId: string;
  billardUnitName: string;
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
// Per-zone list of booked start times (in minutes) for the selected date.
type AvailabilityMap = Partial<Record<ZoneKey, number[]>>;

const ZONE_CAPACITY: Record<ZoneKey, number> = {
  hauptbereich: 7,
  fenster: 3,
  billard: 8,
  vip: 6,
  podest: 4,
  salitos: 15,
};

// Reservation duration used for overlap calculations on the booking form.
// Backend caps Billard at 120 min and uses settings.reservation_duration for others.
// We use 120 min as a safe shared default — matches the backend default.
const SLOT_DURATION_MIN = 120;

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const STEPS = [
  { icon: <CalendarDays size={20} />, label: "Datum & Uhrzeit" },
  { icon: <Users size={20} />, label: "Personenanzahl" },
  { icon: <MapPin size={20} />, label: "Bereich" },
  { icon: <Utensils size={20} />, label: "Anlass" },
  { icon: <User size={20} />, label: "Kontaktdaten" },
  { icon: <CheckCircle size={20} />, label: "Bestätigung" },
];

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
    billardUnitId: "",
    billardUnitName: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  type BillardTable = { id: string; name: string; available: boolean; blocked: boolean };
  const [billardTables, setBillardTables] = useState<BillardTable[]>([]);
  const [billardLoading, setBillardLoading] = useState(false);

  const zoneKeys = useMemo(() => Object.keys(ZONE_CAPACITY) as ZoneKey[], []);

  // Effective capacity per zone = number of non-blocked units in that area.
  // Loaded once from `units`; fallback to ZONE_CAPACITY constant if empty.
  const [unitCapacity, setUnitCapacity] = useState<Partial<Record<ZoneKey, number>>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: units, error } = await supabase
        .from("units")
        .select("area, status");
      if (cancelled || error || !units) return;
      const counts: Partial<Record<ZoneKey, number>> = {};
      for (const u of units as { area: string; status: string | null }[]) {
        if (!zoneKeys.includes(u.area as ZoneKey)) continue;
        if (u.status === "blocked") continue;
        const k = u.area as ZoneKey;
        counts[k] = (counts[k] ?? 0) + 1;
      }
      setUnitCapacity(counts);
    })();
    return () => { cancelled = true; };
  }, [zoneKeys]);

  const effectiveCapacity = useCallback((zone: ZoneKey): number => {
    const fromUnits = unitCapacity[zone];
    if (fromUnits === undefined) return ZONE_CAPACITY[zone];
    return fromUnits;
  }, [unitCapacity]);

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

    const grouped: AvailabilityMap = {};
    (activeReservations as ActiveReservation[]).forEach(r => {
      const arr = grouped[r.zone] || [];
      arr.push(toMin(r.reservation_time));
      grouped[r.zone] = arr;
    });
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

  // Count reservations in a zone whose [start, start+dur) overlaps [time, time+dur).
  const getCountForZoneAtTime = useCallback((time: string, zone: ZoneKey) => {
    const list = availability[zone] || [];
    const start = toMin(time);
    const end = start + SLOT_DURATION_MIN;
    return list.filter(s => start < s + SLOT_DURATION_MIN && end > s).length;
  }, [availability]);

  const isZoneFullyBooked = useCallback((zone: ZoneKey, time: string) => {
    const cap = effectiveCapacity(zone);
    if (cap <= 0) return true;
    return getCountForZoneAtTime(time, zone) >= cap;
  }, [getCountForZoneAtTime, effectiveCapacity]);

  const isTimeInPast = useCallback((date: string, time: string) => {
    if (!date) return true;
    const today = new Date().toISOString().split("T")[0];
    if (date !== today) return false;

    const [hour, minute] = time.split(":").map(Number);
    const selectedDateTime = new Date();
    selectedDateTime.setHours(hour, minute, 0, 0);
    // Slots nach Mitternacht (z.B. 00:00–05:45) gehören zum nächsten Kalendertag
    // (Öffnungszeiten reichen über Mitternacht hinaus). Sonst würden sie
    // fälschlich als „Vergangenheit" markiert.
    if (hour < 6) {
      selectedDateTime.setDate(selectedDateTime.getDate() + 1);
    }
    return selectedDateTime.getTime() <= Date.now();
  }, []);

  const isTimeFullyBooked = useCallback((time: string) => {
    return zoneKeys.every((zone) => isZoneFullyBooked(zone, time));
  }, [isZoneFullyBooked, zoneKeys]);

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
  }, [data.date, getTimesForDate, isTimeInPast, isZoneFullyBooked]);

  const canNext = () => {
    switch (step) {
      case 0: return data.date && data.time;
      case 1: return data.guests >= 1;
      case 2:
        if (data.zone === "") return false;
        if (data.zone === "billard" && !data.billardUnitId) return false;
        return true;
      case 3: return data.anlass.length > 0 && (!data.anlass.includes("sonstiges") || data.sonstigesText.trim().length > 0);
      case 4: return data.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) && data.phone.trim().length >= 3;
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
        const res = await supabase.functions.invoke("billard-availability", {
          method: "GET",
        } as any);
        // functions.invoke doesn't support GET query string easily; use fetch instead
      } catch { /* noop */ }
      try {
        const url = `${(supabase as any).functionsUrl || ""}/billard-availability?date=${encodeURIComponent(data.date)}&time=${encodeURIComponent(data.time)}`;
        const anonKey = (supabase as any).supabaseKey || "";
        const r = await fetch(url, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
        const json = await r.json();
        if (!cancelled && json?.tables) {
          setBillardTables(json.tables as BillardTable[]);
          // Clear selection if no longer available
          if (data.billardUnitId) {
            const stillFree = (json.tables as BillardTable[]).find(t => t.id === data.billardUnitId && t.available);
            if (!stillFree) setData(prev => ({ ...prev, billardUnitId: "", billardUnitName: "" }));
          }
        }
      } catch { /* noop */ }
      finally { if (!cancelled) setBillardLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [data.zone, data.date, data.time, availability]);

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
        <div className="bg-card border border-border rounded-lg p-6 inline-block text-left max-w-sm">
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
          onClick={() => { setSubmitted(false); setStep(0); setData({ date: "", time: "", guests: 2, zone: "", anlass: [], sonstigesText: "", name: "", email: "", phone: "", message: "", billardUnitId: "", billardUnitName: "" }); }}
          className="mt-6 border border-primary text-primary px-6 py-2 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Neue Reservierung
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto gap-1">
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
      <div className="min-h-[420px] sm:min-h-[360px]">
        {step === 0 && (
          <div>
            <h3 className="font-display text-2xl mb-4">Wann möchtest du kommen?</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Datum</label>
                <input
                  type="date"
                  value={data.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setData({ ...data, date: e.target.value, time: "", zone: "" })}
                  className="w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">Bitte wähle ein Datum für deine Reservierung.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Uhrzeit</label>
                {!data.date ? (
                  <div className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                    Bitte zuerst ein Datum wählen.
                  </div>
                ) : (
                  <>
                    {availabilityLoading && (
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Lädt...
                      </p>
                    )}
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {getTimesForDate(data.date).map((t) => {
                        const disabled = isTimeInPast(data.date, t) || isTimeFullyBooked(t);
                        return (
                          <button
                            key={t}
                            disabled={disabled}
                            onClick={() => setData({ ...data, time: t, zone: "" })}
                            className={`px-3 py-2 text-sm rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                              data.time === t
                                ? "bg-primary text-primary-foreground border-primary"
                                : disabled
                                  ? "bg-muted border-border"
                                  : "bg-muted border-border hover:border-primary/50"
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
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-display text-2xl mb-4">Welchen Bereich bevorzugst du?</h3>

            {data.time && (
              <div className="mb-4 bg-muted border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground">
                Reservierung für <span className="text-foreground font-semibold">{data.date}</span> um <span className="text-foreground font-semibold">{data.time} Uhr</span>
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
                const disabled = isFull || billardClosed;
                const nextFree = isFull && !billardClosed && data.time ? findNextFreeTimeForZone(zone, data.time) : null;

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
                    {billardClosed && (
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

            <div className="bg-card border border-border rounded-lg p-6 space-y-3 max-w-md">
              <p><strong>Datum:</strong> {data.date}</p>
              <p><strong>Uhrzeit:</strong> {data.time} Uhr</p>
              <p><strong>Personen:</strong> {data.guests}</p>
              <p><strong>Bereich:</strong> {ZONES.find(z => z.value === data.zone)?.label}</p>
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

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-6 py-2.5 border border-border text-foreground rounded-md disabled:opacity-30 hover:border-primary/50 transition-colors"
        >
          <ArrowLeft size={16} /> Zurück
        </button>
        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-md disabled:opacity-30 hover:bg-primary/90 transition-colors font-semibold"
          >
            Weiter <ArrowRight size={16} />
          </button>
        ) : (
          <div className="flex flex-col items-end gap-2">
            {submitError && <p className="text-destructive text-sm">{submitError}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
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
