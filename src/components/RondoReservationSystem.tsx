import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Users, MapPin, Utensils, User, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

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

const TIMES = [
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00",
];

const STEPS = [
  { icon: <CalendarDays size={20} />, label: "Datum & Uhrzeit" },
  { icon: <Users size={20} />, label: "Personenanzahl" },
  { icon: <MapPin size={20} />, label: "Bereich" },
  { icon: <Utensils size={20} />, label: "Anlass" },
  { icon: <User size={20} />, label: "Kontaktdaten" },
  { icon: <CheckCircle size={20} />, label: "Bestätigung" },
];

const RondoReservationSystem = () => {
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
      const { data: result, error } = await supabase.functions.invoke("create-reservation", {
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
      if (error) {
        setSubmitError("Fehler beim Senden. Bitte versuche es erneut.");
      } else if (result?.error) {
        setSubmitError(result.error);
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

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
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                  className="w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Uhrzeit</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {TIMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setData({ ...data, time: t })}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        data.time === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border hover:border-primary/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
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
              {ZONES.map((z) => (
                <button
                  key={z.value}
                  onClick={() => setData({ ...data, zone: z.value as ReservationZone })}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    data.zone === z.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold">{z.label}</p>
                  <p className="text-xs text-muted-foreground">{z.desc}</p>
                </button>
              ))}
            </div>
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
