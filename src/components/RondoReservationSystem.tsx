import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Users, MapPin, Utensils, User, CheckCircle, ArrowRight, ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { useOpeningHours } from "@/hooks/useOpeningHours";

type ReservationZone = "hauptbereich" | "billard" | "vip" | "podest" | "fenster" | "";
type ReservationAnlass = "sport" | "feier" | "essen" | "billard" | "sonstiges" | "";

interface ReservationData {
  date: string;
  time: string;
  guests: number;
  zone: ReservationZone;
  anlass: ReservationAnlass;
  name: string;
  email: string;
  phone: string;
  message: string;
}

const ZONES = [
  { value: "hauptbereich", label: "Restaurantbereich am 140-Zoll Screen", desc: "Direkt vor dem großen 140-Zoll-LED-Screen", info: "" },
  { value: "fenster", label: "Restaurantbereich am 75-Zoll Screen", desc: "Fensterbereich mit 75-Zoll Screens", info: "" },
  {
    value: "billard",
    label: "Billard-Tisch",
    desc: "8 Olio-Billardtische · 0,23€/Min",
    info: "⏱ Abrechnung: 0,23 €/Min pro Tisch (ca. 13,80 €/Std). Die Abrechnung startet ab Spielbeginn und wird vor Ort bezahlt. Reservierung sichert dir einen Tisch – keine Vorauszahlung nötig.",
  },
  { value: "vip", label: "VIP-Raum", desc: "Privater Bereich für Gruppen ab 11 Personen", info: "👥 Mindestens 11 Personen erforderlich. Der VIP-Raum ist ein abgetrennter, privater Bereich mit eigenem Service." },
  { value: "podest", label: "Podest", desc: "Erhöhter Bereich für bis zu 33 Gäste", info: "🔺 Erhöhter Bereich mit Platz für bis zu 33 Gäste – ideal für größere Gruppen und Feiern." },
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
  fenster: 5,
  billard: 8,
  vip: 1,
  podest: 1,
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
  const [data, setData] = useState<ReservationData>({
    date: "",
    time: "",
    guests: 2,
    zone: "",
    anlass: "",
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
      .neq("status", "cancelled")
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
      case 3: return data.anlass !== "";
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
          anlass: data.anlass,
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
          <p className="text-sm"><strong>Anlass:</strong> {ANLAESSE.find(a => a.value === data.anlass)?.label}</p>
          <p className="text-sm"><strong>E-Mail:</strong> {data.email}</p>
          <p className="text-sm"><strong>Telefon:</strong> {data.phone}</p>
          {data.message && <p className="text-sm"><strong>Nachricht:</strong> {data.message}</p>}
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Wir bestätigen deine Reservierung telefonisch oder per E-Mail.
        </p>
        <button
          onClick={() => { setSubmitted(false); setStep(0); setData({ date: "", time: "", guests: 2, zone: "", anlass: "", name: "", email: "", phone: "", message: "" }); }}
          className="mt-6 border border-primary text-primary px-6 py-2 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Neue Reservierung
        </button>
      </div>
    );
  }

  return (
    <div>
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
      <div className="min-h-[280px]">
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
                <p className="text-xs text-muted-foreground mt-2">Belegte Zeiten werden automatisch gesperrt.</p>
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
                        <Loader2 size={14} className="animate-spin" /> Verfügbarkeit wird aktualisiert...
                      </p>
                    )}
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {TIMES.map((t) => {
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
                    <p className="text-xs text-muted-foreground mt-2">Ausgegraute Uhrzeiten sind belegt oder bereits vorbei.</p>
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
              Für Gruppen ab 11 Personen empfehlen wir unseren VIP-Raum oder das Podest.
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-display text-2xl mb-4">Welchen Bereich bevorzugst du?</h3>

            {data.time && (
              <div className="mb-4 bg-muted border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground">
                Verfügbarkeit für <span className="text-foreground font-semibold">{data.date}</span> um <span className="text-foreground font-semibold">{data.time} Uhr</span>
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
                const capacity = ZONE_CAPACITY[zone];
                const isFull = Boolean(data.time) && booked >= capacity;

                return (
                  <button
                    key={z.value}
                    disabled={isFull}
                    onClick={() => setData({ ...data, zone: z.value as ReservationZone })}
                    className={`text-left p-4 rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                      data.zone === z.value
                        ? "border-primary bg-primary/10"
                        : isFull
                          ? "border-border bg-muted"
                          : "border-border bg-muted hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold">{z.label}</p>
                    <p className="text-xs text-muted-foreground">{z.desc}</p>
                    {data.time && (
                      <p className={`text-xs mt-2 ${isFull ? "text-destructive" : "text-muted-foreground"}`}>
                        {booked}/{capacity} belegt {isFull ? "· nicht verfügbar" : "· verfügbar"}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {data.time && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-primary" />
                Voll belegte Bereiche sind deaktiviert und nicht auswählbar.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-display text-2xl mb-4">Was ist der Anlass?</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {ANLAESSE.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setData({ ...data, anlass: a.value as ReservationAnlass })}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    data.anlass === a.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold">{a.label}</p>
                </button>
              ))}
            </div>
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
              <p><strong>Anlass:</strong> {ANLAESSE.find(a => a.value === data.anlass)?.label}</p>
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
