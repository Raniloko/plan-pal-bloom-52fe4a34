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
    <main>
      {/* ===== 1. HERO - #161616 bg, header-bg image ===== */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "#161616" }}>
        <div
          className="absolute inset-0 bg-no-repeat bg-left-top opacity-30"
          style={{ backgroundImage: "url(/images/hero-header.png)", backgroundSize: "cover" }}
        />
        <div className="relative z-10 container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-0 items-center">
            {/* Left - decorative element */}
            <div className="flex justify-end px-[5%]" style={{ marginBottom: "-5px" }}>
              <img
                src="/images/hero-header.png"
                alt=""
                className="w-full max-w-lg object-contain"
              />
            </div>
            {/* Right - RONDO LOVES SPORTS */}
            <div className="text-left" style={{ marginTop: "150px", paddingBottom: "80px" }}>
              <h1
                className="font-display text-primary font-black"
                style={{ fontSize: "clamp(60px, 10vw, 130px)", lineHeight: "0.77" }}
              >
                RONDO
              </h1>
              <h1
                className="font-display text-primary font-black"
                style={{ fontSize: "clamp(60px, 10vw, 130px)", lineHeight: "0.77" }}
              >
                LOVES
              </h1>
              <h1
                className="font-display text-foreground font-black"
                style={{ fontSize: "clamp(60px, 10vw, 130px)", lineHeight: "0.77" }}
              >
                SPORTS
              </h1>
              {/* Arrow decoration */}
              <div className="mt-10 w-[250px] h-[2px] bg-primary" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. WELCOME - #000000 bg ===== */}
      <section className="bg-background" style={{ paddingTop: "150px", paddingBottom: "250px" }}>
        <div className="container mx-auto px-4">
          {/* Title */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl mb-0">
            <span className="text-primary">Welcome to</span>
            <br />
            <span className="text-primary">Rondo</span>{" "}
            <span className="text-foreground">SPORTSbar</span>
          </h1>

          {/* Two-column text */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mt-10">
            <div>
              <p className="text-muted-foreground leading-relaxed">
                Mit einem Besuch in unserer Bar garantieren wir dir leckeres Essen, gute Laune und
                ein unvergessliches Erlebnis für die ganze Familie. Bei 8 Olio- Billardtischen, 2
                Leonhart- Tischkickern und 2 Löwen- Elektronik Dart´s ist der Spaß vorprogrammiert!
                Durch unseren 140-Zoll-LED-TV, sowie den 8 weiteren TVs entsteht eine einzigartige
                Atmosphäre bei Live-Spielen, die schon fast an einen Stadionbesuch erinnert. Wir
                übertragen nahezu alle Live-Spiele (Bundesliga, DFB-Pokal, Champions- &
                Europa-League, Serie A, uvm.), aber auch NFL, Tennis oder Handball.{" "}
                <span className="text-primary">LIVE-SPORT</span> wird bei uns groß geschrieben! Vor
                dem Eingang befinden sich zusätzlich 400 kostenfreie Parkplätze!
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Ein Besuch bei uns lohnt sich!
              </p>
            </div>
            <div>
              <p className="text-muted-foreground leading-relaxed">
                Unsere Internetseite haben wir bewusst als OnePage angelegt und alle Inhalte unserer
                Sportsbar mit Live-Übertragungen, Restaurant-Speisekarte, Aktivitäten uvm. in
                unserer App gebündelt (auch als Web-Version). In unserer App haben wir alle häufigen
                Fragen, die in den letzten Jahren zusammengekommen sind, kompakt aufgegliedert. So
                findest du schnell die Antworten auf deine Fragen. Sollte es vorkommen, dass deine
                Frage unbeantwortet bleibt, so schreibe uns über den Kontaktbereich in der App.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Wir freuen uns, wenn wir dein Interesse geweckt haben und wir dich bald als Gast
                persönlich begrüßen können.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. APP SECTION - white/light bg ===== */}
      <section style={{ paddingTop: "75px", paddingBottom: "75px" }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - iPhone mockup */}
            <div className="flex justify-center" style={{ marginTop: "-300px" }}>
              <img
                src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/rondo-iphone-nfl-small.png"
                alt="Rondo App"
                className="max-w-full h-auto"
                loading="lazy"
              />
            </div>
            {/* Right - Text */}
            <div>
              <h1 className="font-display text-4xl md:text-6xl text-foreground">
                Die Rondo
                <br />
                Sportsbar <span className="text-primary">App</span>
              </h1>
              <p className="text-muted-foreground leading-relaxed mt-6">
                Hol dir unsere Rondo APP und verpasse keine Aktion mehr.
                <br />
                Die APP bietet Dir einen Eventkalender mit dem Du zu unseren Sportereignissen und
                Events deinen Lieblingsplatz reservieren kannst.
              </p>
              {/* Divider */}
              <div className="w-[175px] h-[3px] bg-primary my-8" />
              {/* QR Code */}
              <img
                src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/qr-code-new.png"
                alt="QR Code"
                className="max-w-[250px] h-auto"
                loading="lazy"
              />
              <div className="flex gap-4 mt-8">
                <a href="https://portal.gastfreund.net/rondo-sportsbar" target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/rondo-google-play.png"
                    alt="Google Play"
                    className="h-12"
                    loading="lazy"
                  />
                </a>
                <a href="https://portal.gastfreund.net/rondo-sportsbar" target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/rondo-appstore.png"
                    alt="App Store"
                    className="h-12"
                    loading="lazy"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4. RESERVIERUNG - light bg ===== */}
      <section style={{ paddingTop: "75px", paddingBottom: "0px" }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-end">
            {/* Left - Image overflowing */}
            <div className="flex justify-center px-[5%]" style={{ marginBottom: "-1px" }}>
              <img
                src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/reservierung-element.png"
                alt="Reservierung"
                className="w-full max-w-[165%] h-auto"
                loading="lazy"
              />
            </div>
            {/* Right - Text */}
            <div className="pb-10 md:pb-20">
              <h1 className="font-display text-4xl md:text-6xl text-foreground">
                Reservierung
                <br />
                im <span className="text-primary">Rondo</span>
              </h1>
              <div className="w-[150px] h-[3px] bg-primary my-8" />
              <p className="text-muted-foreground leading-relaxed">
                Du möchtest die Matches deiner Lieblingsmannschaft auf unserem{" "}
                <strong className="text-foreground">140-Zoll-LED-Screen</strong> und auf unseren{" "}
                <strong className="text-foreground">8 weiteren Screens</strong> genießen? Dann
                reserviere Dir jetzt deinen Platz in der Sportsbar.
                <br />
                Rondo steht für Live-Sport und daher übertragen wir fast alle Live-Spiele der
                Bundesliga, DFB-Pokal, Champions- & Europa-League, Serie A, uvm. so wie auch NFL,
                Tennis oder Handball.
              </p>
              <Link
                to="/reservierung"
                className="inline-flex items-center gap-2 mt-8 border-2 border-foreground text-foreground px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all"
              >
                Reservieren <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 5. BILLARD, KICKER ODER DART - dark bg with bg image ===== */}
      <section
        className="relative bg-background"
        style={{ paddingTop: "150px", paddingBottom: "150px" }}
      >
        <div
          className="absolute inset-0 bg-no-repeat bg-right-bottom opacity-40"
          style={{
            backgroundImage: "url(/images/billard-area.jpg)",
            backgroundSize: "cover",
          }}
        />
        <div className="absolute inset-0 bg-background/60" />
        <div className="relative z-10 container mx-auto px-4">
          {/* Title */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl">
            <span className="text-primary">Billard,</span>
            <br />
            Kicker <span className="text-primary">oder</span>
            <br />
            <span className="text-primary">Dart</span>
          </h1>
          <div className="w-[150px] h-[3px] bg-primary my-8" />

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-muted-foreground leading-relaxed">
                Auch für die sportliche Betätigung wird in der Rondo
                <br />
                Sportsbar gesorgt. Buche Dir und Deinen Freunden einen Platz auf einem unserer 8
                Olio- Billardtischen, 2 Leonhart- Tischkickern und 2 Löwen- Elektronik Dart´s
              </p>
              <Link
                to="/reservierung"
                className="inline-flex items-center gap-2 mt-8 border-2 border-foreground text-foreground px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all"
              >
                Reservieren <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 6. TESTIMONIALS - light/dark bg centered ===== */}
      <section style={{ paddingTop: "150px", paddingBottom: "150px" }}>
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="font-display text-3xl md:text-5xl text-foreground mb-2">
            Was unsere Kunden sagen
          </h2>
          <div className="w-[150px] h-[3px] bg-primary mx-auto my-8" />

          {/* Testimonial slider */}
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((t, i) => (
                  <div key={i} className="w-full flex-shrink-0 px-4">
                    <div className="max-w-2xl mx-auto py-8">
                      <p className="text-lg md:text-xl text-muted-foreground italic leading-relaxed">
                        "{t.text}"
                      </p>
                      <p className="font-semibold text-foreground mt-6">{t.author}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Vorheriges Testimonial"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Nächstes Testimonial"
            >
              <ChevronRight size={32} />
            </button>
            <div className="flex justify-center gap-2 mt-4">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i === currentTestimonial ? "bg-primary" : "bg-muted hover:bg-muted-foreground"
                  }`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 7. JOBS - #000000 bg ===== */}
      <section className="bg-background" style={{ paddingTop: "75px", paddingBottom: "0px" }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-end">
            {/* Left - Jobs image */}
            <div className="flex justify-center px-[5%]" style={{ marginBottom: "-1px" }}>
              <img
                src="https://www.rondo-sportsbar.de/wp-content/uploads/2021/07/jobs-bei-rondo.png"
                alt="Jobs bei Rondo"
                className="w-full max-w-[165%] h-auto"
                loading="lazy"
              />
            </div>
            {/* Right - Text */}
            <div className="pb-10 md:pb-20 pl-0 md:pl-[5%]">
              <h1 className="font-display text-4xl md:text-6xl text-foreground">
                <span className="text-primary">Jobs</span> bei
                <br />
                <span className="text-primary">Rondo</span>
              </h1>
              <div className="w-[150px] h-[3px] bg-primary my-8" />
              <p className="text-muted-foreground leading-relaxed">
                Mehr Information zu aktuellen Job-Ausschreibungen findest du in unserer APP. Schau
                doch mal rein und wir freuen uns schon darauf dich schon bald in unserem Team
                begrüßen zu dürfen.
              </p>
              <a
                href="https://portal.gastfreund.net/rondo-sportsbar/346050"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-8 border-2 border-foreground text-foreground px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all"
              >
                Zu den Jobs <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 8. ÖFFNUNGSZEITEN - light bg, 2 columns ===== */}
      <section style={{ paddingTop: "75px", paddingBottom: "0px" }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-end">
            {/* Left - Text */}
            <div className="pb-10 md:pb-20">
              <h1 className="font-display text-4xl md:text-6xl text-foreground">
                Time for
                <br />
                some <span className="text-primary">Action</span>
              </h1>
              <div className="w-[150px] h-[3px] bg-primary my-8" />
              <h3 className="font-display text-2xl text-foreground mb-6">Unsere Öffnungszeiten</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-3">
                  <span className="text-primary">▶</span>
                  <span className="font-display text-xl text-foreground">
                    Mo – Do: 15 Uhr – 01 Uhr
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">▶</span>
                  <span className="font-display text-xl text-foreground">
                    Fr: 15 Uhr – 03 Uhr
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">▶</span>
                  <span className="font-display text-xl text-foreground">
                    Sa: 13 Uhr – 03 Uhr
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">▶</span>
                  <span className="font-display text-xl text-foreground">
                    So: 13 Uhr – 01 Uhr
                  </span>
                </li>
              </ul>
              <p className="text-muted-foreground mt-6">
                Feiertage gelten die gleichen Öffnungszeiten wie regulär.
              </p>
              <p className="text-muted-foreground mt-4">
                An den gesetzlichen Feiertagen sind wir
                <br />
                zu den jeweiligen Wochentag gültigen
                <br />
                Öffnungszeiten für euch da.
              </p>
              <p className="text-muted-foreground mt-4">
                Kurzfristige Sonderöffnungszeiten
                <br />
                werden über unseren Google Account gepflegt.
              </p>
            </div>
            {/* Right - Image */}
            <div className="flex justify-center">
              <img
                src="/images/time-for-action.png"
                alt="Time for Action"
                className="w-full max-w-[125%] h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 9. PRIVATE FEIERN - #000000 bg with bg image ===== */}
      <section
        className="relative bg-background"
        style={{ paddingTop: "150px", paddingBottom: "150px" }}
      >
        <div
          className="absolute inset-0 bg-no-repeat bg-left-bottom opacity-30"
          style={{
            backgroundImage: "url(/images/podest.jpg)",
            backgroundSize: "cover",
          }}
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left - empty (bg image visible) */}
            <div />
            {/* Right - Text */}
            <div>
              <h1 className="font-display text-4xl md:text-6xl text-foreground">
                <span className="text-primary">Private</span>
                <br />
                Feiern
              </h1>
              <div className="w-[150px] h-[3px] bg-primary my-8" />
              <p className="text-muted-foreground leading-relaxed">
                Ob Geburtstagsfeiern, JGA, Firmen-Events, Weihnachtsfeiern
                <br />
                oder einfach nur so, bieten wir für größere Gruppen ab 11 Personen verschiedene
                Lösungen für private Feiern an wie unseren VIP-Raum oder unser Podest. Mehr
                Information findest du in unserer APP.
              </p>
              <Link
                to="/private-feiern"
                className="inline-flex items-center gap-2 mt-8 border-2 border-foreground text-foreground px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all"
              >
                Mehr Info <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 10. SOCIAL ICONS ===== */}
      <section className="py-12 text-center">
        <div className="flex justify-center gap-8">
          <a
            href="https://instagram.com/rondosportsbar/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <Instagram size={50} />
          </a>
          <a
            href="https://facebook.com/Rondosportsbar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <Facebook size={50} />
          </a>
        </div>
      </section>

      {/* ===== 11. COME IN - FEEL GOOD - #0a0a0a bg ===== */}
      <section
        className="text-center"
        style={{ backgroundColor: "#0a0a0a", paddingTop: "150px", paddingBottom: "100px" }}
      >
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-5xl text-foreground">
            Come in – <span className="text-primary">Feel good</span>
          </h2>
          <div className="w-[150px] h-[3px] bg-primary mx-auto my-8" />

          {/* 5 images in a row */}
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
                <p className="text-muted-foreground text-sm mt-3">{img.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
