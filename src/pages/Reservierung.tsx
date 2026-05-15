import { Link } from "react-router-dom";
import RondoReservationSystem from "@/components/RondoReservationSystem";
import { Clock, ArrowRight, Info, AlertTriangle, Sparkles } from "lucide-react";

const Reservierung = () => {
  return (
    <main className="pt-20 md:pt-24 relative overflow-hidden">
      {/* Subtle ambient glow keeping brand palette */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl" />
      </div>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10 md:mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-widest mb-5">
              <Sparkles size={14} /> Online Reservierung
            </span>
            <h1 className="font-display text-5xl md:text-7xl mb-4 leading-[0.95]">
              Reserv<span className="text-primary">ierung</span> im <span className="text-primary">Rondo</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
              Sichere dir deinen Platz vor unserem 140-Zoll-LED-Screen – in wenigen Schritten gebucht.
            </p>
          </div>

          {/* Reservation Card */}
          <div className="relative">
            <div aria-hidden className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent opacity-60 blur-md" />
            <div className="relative bg-card/90 backdrop-blur-sm border border-border rounded-3xl p-5 sm:p-8 md:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,218,0,0.04)]">
              <RondoReservationSystem />
            </div>
          </div>

          {/* So funktioniert's */}
          <div className="mt-20">
            <h2 className="font-display text-3xl md:text-4xl mb-6 text-primary">So funktioniert's</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <ArrowRight size={18} className="text-primary mt-1 shrink-0" />
                <span className="text-muted-foreground">Folge den Anweisungen im Reservierungssystem.</span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight size={18} className="text-primary mt-1 shrink-0" />
                <span className="text-muted-foreground">
                  Wähle den Bereich aus für den Du reservieren möchtest: <strong className="text-foreground">Billiard Tisch, Restaurantbereich am 140 Zoll Screen, Restaurantbereich am 75 Zoll Screen oder VIP Raum.</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight size={18} className="text-primary mt-1 shrink-0" />
                <span className="text-muted-foreground">
                  Falls du zu einer bestimmten Liveübertragung reservieren möchtest, dann schreibe uns unbedingt diese in das Kommentar-Feld, damit wir dich vor den richtigen Screen setzen können.{" "}
                  <a href="https://portal.gastfreund.net/rondo-sportsbar/340856" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    Hier der Überblick
                  </a>
                </span>
              </li>
            </ul>
          </div>

          {/* Tipp */}
          <div className="mt-10 bg-muted/60 border border-border rounded-2xl p-6">
            <h3 className="font-display text-2xl text-primary mb-3">Tipp</h3>
            <p className="text-muted-foreground">
              Wir empfehlen eine Vorlaufzeit von 24 Stunden, bei Reservierungen am Wochenende, teilweise bis zu drei Tage. Kurzfristige Reservierungen sind möglich, wenn entsprechende Verfügbarkeiten angezeigt werden.
            </p>
          </div>

          {/* FAQ */}
          <div className="mt-10 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display text-xl mb-3 flex items-center gap-2">
                <Info size={18} className="text-primary" />
                Wann ist meine Reservierung gültig?
              </h3>
              <p className="text-sm text-muted-foreground">
                Reservierungen sind nur dann gültig, wenn sie über unser Buchungssystem eingehen und Du im Anschluss eine Bestätigungsmail bekommen hast.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display text-xl mb-3 flex items-center gap-2">
                <Info size={18} className="text-primary" />
                Wie kann ich stornieren?
              </h3>
              <p className="text-sm text-muted-foreground">
                In der Bestätigungsmail findest Du einen Link zum Stornieren. Klicke diesen einfach an und bestätige mit „ja" – schon wird Deine Reservierung aus unserem System genommen. Stornierungen sind auch 10 Minuten vor Reservierungsbeginn möglich.
              </p>
            </div>
          </div>

          {/* Billard-Reservierungen */}
          <div className="mt-10 bg-muted/60 border border-primary/30 rounded-2xl p-6">
            <h2 className="font-display text-2xl md:text-3xl mb-4 text-primary">Billard-Reservierungen</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-primary mt-0.5 shrink-0" />
                <span>Billardreservierung gerade nicht möglich? Dann sind bereits alle Billardtische reserviert. Du kannst gerne trotzdem vorbeikommen – wir halten auch immer zwei bis drei Billardtische für spontane Gäste frei!</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-primary mt-0.5 shrink-0" />
                <span>Bitte reserviert nur so viele Billardtische, wie ihr wirklich benötigt. Ab zwei gleichzeitig reservierten Billardtischen gilt ein gesonderter Mindestumsatz.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-primary mt-0.5 shrink-0" />
                <span><strong className="text-foreground">Preise:</strong> 0,23€ pro Minute, minutengenaue Abrechnungsweise.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-primary mt-0.5 shrink-0" />
                <span>Billardtische können nur bis 20 Uhr reserviert werden. Um 20:01 Uhr beginnen wir mit der Warteliste.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-primary mt-0.5 shrink-0" />
                <span>Leider können wir Reservierungen nur bei einer Verspätung von maximal fünf Minuten gewährleisten.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-primary mt-0.5 shrink-0" />
                <span><strong className="text-foreground">Freitag bis Sonntag:</strong> Maximale Reservierungsdauer 2 Stunden. Automatische Stornierung nach 15 Minuten bei Nichterscheinen.</span>
              </li>
            </ul>
          </div>

          {/* Info Cards */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-muted/60 border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={20} className="text-primary" />
                <h3 className="font-display text-xl">Öffnungszeiten</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Mo – Do: 16:00 – 00:00 Uhr</p>
                <p>Fr: 16:00 – 02:00 Uhr</p>
                <p>Sa: 14:00 – 02:00 Uhr</p>
                <p>So: 14:00 – 00:00 Uhr</p>
              </div>
            </div>
            <div className="bg-muted/60 border border-border rounded-2xl p-6">
              <h3 className="font-display text-xl mb-3">Veranstaltungskalender</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Wirf einen Blick in unseren Veranstaltungskalender. Hier findest du eine Übersicht unserer Events und Übertragungen und die Info in welchem TV-Bereich wir welche Übertragung zeigen.
              </p>
              <a
                href="https://portal.gastfreund.net/rondo-sportsbar/340856"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary text-sm font-semibold hover:underline"
              >
                Zum Eventkalender <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Reservierung;
