import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Instagram, Facebook } from "lucide-react";

const testimonials = [
  {
    text: "...Wegen des Lockdowns finden wir es schade, dass wir nicht gemeinsam bei euch unsere Sonntagabende verbringen können. Es fehlt die Atmosphäre, das gute Essen und die Gespräche untereinander oder auch mit euch...",
    author: "Timo & die NFL-Jungs",
    role: "- NFL-Stammtisch",
  },
  {
    text: "...Wir fühlen uns bei euch immer pudelwohl. Das liegt warscheinlich an dem immer top gepflegten Billiardtisch...",
    author: "Niki, Serab, Michael",
    role: "- Donnerstags-Stammtisch",
  },
  {
    text: "super freundliches Personal, sehr zuvorkommend. (...) Essen und Trinken sind gut und preislich im Rahmen. Für einen entspannten Abend zu zweit oder als Location für eine Gruppe einfach der perfekte Ort",
    author: "Dirk M.",
    role: "- Bewertung über Quandoo",
  },
];

/* Pill-shaped CTA button matching original site */
const ReservierenButton = ({ to = "/reservierung", className = "" }: { to?: string; className?: string }) => (
  <Link
    to={to}
    className={`inline-flex items-center gap-3 border-2 border-foreground rounded-full pl-8 pr-2 py-2 font-display text-lg uppercase tracking-wider text-foreground hover:border-primary hover:text-primary transition-all group ${className}`}
  >
    RESERVIEREN
    <span className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
      <ArrowRight size={18} />
    </span>
  </Link>
);

const Index = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const nextTestimonial = useCallback(() => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevTestimonial = useCallback(() => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, [nextTestimonial]);

  return (
    <main className="pt-[68px] md:pt-[84px]">
      {/* ===== 1. HERO ===== */}
      <section
        className="relative overflow-hidden bg-[#161616]"
        style={{ minHeight: "85vh" }}
      >
        {/* Background image (smoke/player) */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero-header.png)" }}
        />
        <div className="absolute inset-0 bg-[#161616]/50" />

        <div className="relative z-10 container mx-auto px-6 flex flex-col justify-center" style={{ minHeight: "85vh" }}>
          <h1
            className="font-display font-black italic leading-[0.85]"
            style={{ fontSize: "clamp(56px, 12vw, 140px)" }}
          >
            <span className="text-primary">RONDO</span>
            <br />
            <span className="text-primary">LOVES</span>
            <br />
            <span className="text-foreground">SPORTS</span>
          </h1>
          <div className="mt-10">
            <ReservierenButton />
          </div>
        </div>
      </section>

      {/* ===== 2. WELCOME ===== */}
      <section className="bg-[#000000] py-20 md:py-32">
        <div className="container mx-auto px-6">
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl italic">
            <span className="text-primary">Welcome to</span>
            <br />
            <span className="text-primary">Rondo</span>{" "}
            <span className="text-foreground">SPORTSbar</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 mt-10">
            <p className="text-[#999] leading-relaxed text-sm md:text-base">
              Mit einem Besuch in unserer Bar garantieren wir dir leckeres Essen, gute Laune und
              ein unvergessliches Erlebnis für die ganze Familie. Bei 8 Olio- Billardtischen, 2
              Leonhart- Tischkickern und 2 Löwen- Elektronik Dart´s ist der Spaß vorprogrammiert!
              Durch unseren 140-Zoll-LED-TV, sowie den 8 weiteren TVs entsteht eine einzigartige
              Atmosphäre bei Live-Spielen, die schon fast an einen Stadionbesuch erinnert. Wir
              übertragen nahezu alle Live-Spiele (Bundesliga, DFB-Pokal, Champions- &
              Europa-League, Serie A, uvm.), aber auch NFL, Tennis oder Handball.{" "}
              <span className="text-primary font-semibold">LIVE-SPORT</span> wird bei uns groß geschrieben! Vor
              dem Eingang befinden sich zusätzlich 400 kostenfreie Parkplätze!
              <br /><br />
              Ein Besuch bei uns lohnt sich!
            </p>
            <p className="text-[#999] leading-relaxed text-sm md:text-base">
              Unsere Internetseite haben wir bewusst als OnePage angelegt und alle Inhalte unserer
              Sportsbar mit Live-Übertragungen, Restaurant-Speisekarte, Aktivitäten uvm. in
              unserer App gebündelt (auch als Web-Version). In unserer App haben wir alle häufigen
              Fragen, die in den letzten Jahren zusammengekommen sind, kompakt aufgegliedert. So
              findest du schnell die Antworten auf deine Fragen. Sollte es vorkommen, dass deine
              Frage unbeantwortet bleibt, so schreibe uns über den Kontaktbereich in der App.
              <br /><br />
              Wir freuen uns, wenn wir dein Interesse geweckt haben und wir dich bald als Gast
              persönlich begrüßen können.
            </p>
          </div>
        </div>
      </section>

      {/* ===== 3. APP SECTION - white bg ===== */}
      <section className="bg-white py-20 md:py-28 relative overflow-visible">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - iPhone mockup */}
            <div className="flex justify-center md:-mt-40">
              <img
                src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/rondo-iphone-nfl-small.png"
                alt="Rondo App"
                className="max-w-[300px] w-full h-auto"
                loading="lazy"
              />
            </div>
            {/* Right - Text */}
            <div>
              <h2 className="font-display text-4xl md:text-6xl text-[#111] italic">
                Die Rondo
                <br />
                Sportsbar <span className="text-primary">App</span>
              </h2>
              <p className="text-[#555] leading-relaxed mt-6 text-sm md:text-base">
                Hol dir unsere Rondo APP und verpasse keine Aktion mehr.
                <br />
                Die APP bietet Dir einen Eventkalender mit dem Du zu unseren Sportereignissen und
                Events deinen Lieblingsplatz reservieren kannst.
              </p>
              <div className="w-[175px] h-[3px] bg-primary my-8" />
              <img
                src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/qr-code-new.png"
                alt="QR Code"
                className="max-w-[200px] h-auto"
                loading="lazy"
              />
              <div className="flex gap-4 mt-6">
                <a href="https://portal.gastfreund.net/rondo-sportsbar" target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/rondo-google-play.png"
                    alt="Google Play"
                    className="h-10"
                    loading="lazy"
                  />
                </a>
                <a href="https://portal.gastfreund.net/rondo-sportsbar" target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/rondo-appstore.png"
                    alt="App Store"
                    className="h-10"
                    loading="lazy"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4. RESERVIERUNG - white bg ===== */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - Image */}
            <div className="flex justify-center">
              <img
                src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/reservierung-element.png"
                alt="Reservierung"
                className="w-full max-w-lg h-auto"
                loading="lazy"
              />
            </div>
            {/* Right - Text */}
            <div>
              <h2 className="font-display text-4xl md:text-6xl text-[#111] italic">
                Reservierung
                <br />
                im <span className="text-primary">Rondo</span>
              </h2>
              <div className="w-[150px] h-[3px] bg-primary my-8" />
              <p className="text-[#555] leading-relaxed text-sm md:text-base">
                Du möchtest die Matches deiner Lieblingsmannschaft auf unserem{" "}
                <strong className="text-[#111]">140-Zoll-LED-Screen</strong> und auf unseren{" "}
                <strong className="text-[#111]">8 weiteren Screens</strong> genießen? Dann
                reserviere Dir jetzt deinen Platz in der Sportsbar.
                <br /><br />
                Rondo steht für Live-Sport und daher übertragen wir fast alle Live-Spiele der
                Bundesliga, DFB-Pokal, Champions- & Europa-League, Serie A, uvm. so wie auch NFL,
                Tennis oder Handball.
              </p>
              <div className="mt-8">
                <Link
                  to="/reservierung"
                  className="inline-flex items-center gap-3 border-2 border-[#111] rounded-full pl-8 pr-2 py-2 font-display text-lg uppercase tracking-wider text-[#111] hover:border-primary hover:text-primary transition-all group"
                >
                  RESERVIEREN
                  <span className="w-10 h-10 rounded-full bg-[#111] text-white flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <ArrowRight size={18} />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 5. BILLARD, KICKER ODER DART ===== */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "80vh" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/billard-area.jpg)" }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 container mx-auto px-6 py-20 md:py-32 flex flex-col justify-center" style={{ minHeight: "80vh" }}>
          <h2
            className="font-display font-black italic leading-[0.85]"
            style={{ fontSize: "clamp(48px, 10vw, 110px)" }}
          >
            <span className="text-primary">BILLARD,</span>
            <br />
            <span className="text-foreground">KICKER </span>
            <span className="text-primary">ODER</span>
            <br />
            <span className="text-primary">DART</span>
          </h2>
          <div className="w-[150px] h-[3px] bg-primary my-8" />

          <div className="max-w-xl bg-black/50 backdrop-blur-sm p-6 rounded">
            <p className="text-[#ccc] leading-relaxed text-sm md:text-base">
              Auch für die sportliche Betätigung wird in der Rondo
              <br />
              Sportsbar gesorgt. Buche Dir und Deinen Freunden einen Platz auf einem unserer 8
              Olio- Billardtischen, 2 Leonhart- Tischkickern und 2 Löwen- Elektronik Dart´s
            </p>
          </div>

          <div className="mt-8">
            <ReservierenButton />
          </div>
        </div>
      </section>

      {/* ===== 6. TESTIMONIALS ===== */}
      <section className="bg-white py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="font-display text-3xl md:text-5xl text-[#111] italic mb-2">
            Was unsere Kunden sagen
          </h2>
          <div className="w-[150px] h-[3px] bg-primary mx-auto my-8" />

          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((t, i) => (
                  <div key={i} className="w-full flex-shrink-0 px-4">
                    <div className="max-w-2xl mx-auto py-8">
                      <p className="text-lg md:text-xl text-[#555] italic leading-relaxed">
                        "{t.text}"
                      </p>
                      <p className="font-semibold text-[#111] mt-6">{t.author}</p>
                      <p className="text-sm text-[#999] mt-1">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-[#111] hover:text-primary transition-colors"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#111] hover:text-primary transition-colors"
            >
              <ChevronRight size={32} />
            </button>
            <div className="flex justify-center gap-2 mt-4">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i === currentTestimonial ? "bg-primary" : "bg-[#ccc] hover:bg-[#999]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 7. JOBS ===== */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
              <img
                src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/jobs-bei-rondo.png"
                alt="Jobs bei Rondo"
                className="w-full max-w-md h-auto"
                loading="lazy"
              />
            </div>
            <div>
              <h2 className="font-display text-4xl md:text-6xl text-[#111] italic">
                <span className="text-primary">Jobs</span> bei
                <br />
                <span className="text-primary">Rondo</span>
              </h2>
              <div className="w-[150px] h-[3px] bg-primary my-8" />
              <p className="text-[#555] leading-relaxed text-sm md:text-base">
                Mehr Information zu aktuellen Job-Ausschreibungen findest du in unserer APP. Schau
                doch mal rein und wir freuen uns schon darauf dich schon bald in unserem Team
                begrüßen zu dürfen.
              </p>
              <div className="mt-8">
                <a
                  href="https://portal.gastfreund.net/rondo-sportsbar/346050"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 border-2 border-[#111] rounded-full pl-8 pr-2 py-2 font-display text-lg uppercase tracking-wider text-[#111] hover:border-primary hover:text-primary transition-all group"
                >
                  ZU DEN JOBS
                  <span className="w-10 h-10 rounded-full bg-[#111] text-white flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <ArrowRight size={18} />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 8. ÖFFNUNGSZEITEN - white bg ===== */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-6xl text-[#111] italic">
                Time for
                <br />
                some <span className="text-primary">Action</span>
              </h2>
              <div className="w-[150px] h-[3px] bg-primary my-8" />
              <h3 className="font-display text-2xl text-[#111] mb-6 italic">Unsere Öffnungszeiten</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="text-primary text-lg">▶</span>
                  <span className="font-display text-xl text-[#111]">Mo – Do: 16 Uhr – 00:00 Uhr</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary text-lg">▶</span>
                  <span className="font-display text-xl text-[#111]">Fr: 16 Uhr – 02 Uhr</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary text-lg">▶</span>
                  <span className="font-display text-xl text-[#111]">Sa: 14 Uhr – 02 Uhr</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary text-lg">▶</span>
                  <span className="font-display text-xl text-[#111]">So: 14 Uhr – 00:00 Uhr</span>
                </li>
              </ul>
              <p className="text-[#555] mt-8">
                Telefonisch erreichbar während der Öffnungszeiten.
              </p>
              <p className="text-[#555] mt-4">
                Kurzfristige Sonderöffnungszeiten
                <br />
                werden über unseren Google Account gepflegt.
              </p>
            </div>
            <div className="flex justify-center">
              <img
                src="/images/time-for-action.png"
                alt="Time for Action"
                className="w-full max-w-md h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 9. PRIVATE FEIERN - full bg image ===== */}
      <section className="relative overflow-hidden" style={{ minHeight: "80vh" }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/podest.jpg)" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 container mx-auto px-6 py-20 md:py-32 flex flex-col justify-center" style={{ minHeight: "80vh" }}>
          <h2
            className="font-display font-black italic leading-[0.85]"
            style={{ fontSize: "clamp(48px, 10vw, 110px)" }}
          >
            <span className="text-primary">PRIVATE</span>
            <br />
            <span className="text-foreground">FEIERN</span>
          </h2>
          <div className="w-[150px] h-[3px] bg-primary my-8" />
          <div className="max-w-xl">
            <p className="text-[#ccc] leading-relaxed text-sm md:text-base">
              Ob Geburtstagsfeiern, JGA, Firmen-Events, Tagung, Weihnachtsfeiern
              <br />
              oder einfach nur so, bieten wir für größere Gruppen ab 11 Personen verschiedene
              Lösungen für private Feiern an wie unseren VIP-Raum oder unser Podest. Termine können
              telefonisch während der Öffnungszeiten vereinbart werden.
            </p>
          </div>
        </div>
      </section>

      {/* ===== 10. SOCIAL ICONS - white bg ===== */}
      <section className="bg-white py-16 text-center">
        <div className="flex justify-center gap-10">
          <a
            href="https://instagram.com/rondosportsbar/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#111] hover:text-primary transition-colors"
          >
            <Instagram size={56} strokeWidth={1.5} />
          </a>
          <a
            href="https://facebook.com/Rondosportsbar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#111] hover:text-primary transition-colors"
          >
            <Facebook size={56} strokeWidth={1.5} />
          </a>
        </div>
      </section>

      {/* ===== 11. COME IN - FEEL GOOD ===== */}
      <section className="bg-[#0a0a0a] py-20 md:py-28">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-5xl text-foreground italic">
            Come in – <span className="text-primary">Feel good</span>
          </h2>
          <div className="w-[150px] h-[3px] bg-primary mx-auto my-8" />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
            {[
              { src: "/images/podest.jpg", label: "Podest für bis zu 33 Gäste" },
              { src: "/images/fensterbereich.jpg", label: "Fensterbereich" },
              { src: "/images/screen-140zoll.jpg", label: "140-Zoll-Screen" },
              { src: "/images/billard-area.jpg", label: "Billard-Area" },
              { src: "/images/tv-area.jpg", label: "TV-Area" },
            ].map((img, i) => (
              <div key={i} className="text-center">
                <div className="overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.label}
                    className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <p className="text-[#999] text-sm mt-3">{img.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
