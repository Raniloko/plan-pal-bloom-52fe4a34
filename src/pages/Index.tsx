import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  { text: "Wegen des Lockdowns finden wir es schade, dass wir nicht gemeinsam bei euch unsere Sonntagabende verbringen können. Es fehlt die Atmosphäre, das gute Essen und die Gespräche untereinander oder auch mit euch.", author: "Timo & die NFL-Jungs", role: "NFL-Stammtisch" },
  { text: "Wir fühlen uns bei euch immer pudelwohl. Das liegt wahrscheinlich an dem immer top gepflegten Billardtisch.", author: "Niki, Serab, Michael", role: "Donnerstags-Stammtisch" },
  { text: "Super freundliches Personal, sehr zuvorkommend. Essen und Trinken sind gut und preislich im Rahmen. Für einen entspannten Abend zu zweit oder als Location für eine Gruppe einfach der perfekte Ort.", author: "Dirk M.", role: "Bewertung über Quandoo" },
  { text: "Die beste Sportsbar in der Region! Das Erlebnis auf dem 140-Zoll-Screen ist einzigartig. Man fühlt sich wie im Stadion!", author: "Marco S.", role: "Stammgast" },
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
      {/* Hero - dark bg with large typography */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: "#161616" }}>
        <div className="absolute inset-0">
          <img src="/images/hero-header.png" alt="" className="w-full h-full object-cover opacity-30" />
        </div>
        <div className="relative z-10 container mx-auto px-4 pt-20 pb-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - decorative image */}
            <div className="hidden md:flex justify-center">
              <img
                src="/images/hero-header.png"
                alt="Rondo Sportsbar"
                className="max-h-[600px] object-contain"
              />
            </div>
            {/* Right - headline */}
            <div className="text-left">
              <h1 className="font-display leading-none" style={{ fontSize: "clamp(80px, 12vw, 140px)", lineHeight: "0.85" }}>
                <span className="text-primary block">RONDO</span>
                <span className="text-primary block">LOVES</span>
                <span className="text-foreground block">SPORTS</span>
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome - 2-column text on black */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="font-display text-4xl md:text-6xl mb-10 text-center">
            <span className="text-primary">Welcome to</span><br />
            <span className="text-primary">Rondo</span> <span className="text-foreground">SPORTSbar</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <p className="text-muted-foreground leading-relaxed">
              Mit einem Besuch in unserer Bar garantieren wir dir leckeres Essen, gute Laune und ein unvergessliches Erlebnis für die ganze Familie. Bei 8 Olio-Billardtischen, 2 Leonhart-Tischkickern und 2 Löwen-Elektronik Dart's ist der Spaß vorprogrammiert! Durch unseren 140-Zoll-LED-TV, sowie den 8 weiteren TVs entsteht eine einzigartige Atmosphäre bei Live-Spielen, die schon fast an einen Stadionbesuch erinnert. Wir übertragen nahezu alle Live-Spiele (Bundesliga, DFB-Pokal, Champions- & Europa-League, Serie A, uvm.), aber auch NFL, Tennis oder Handball. <span className="text-primary font-semibold">LIVE-SPORT</span> wird bei uns groß geschrieben! Vor dem Eingang befinden sich zusätzlich 400 kostenfreie Parkplätze!
            </p>
            <div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Unsere Internetseite haben wir bewusst als OnePage angelegt und alle Inhalte unserer Sportsbar mit Live-Übertragungen, Restaurant-Speisekarte, Aktivitäten uvm. in unserer App gebündelt (auch als Web-Version). In unserer App haben wir alle häufigen Fragen, die in den letzten Jahren zusammengekommen sind, kompakt aufgegliedert.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Wir freuen uns, wenn wir dein Interesse geweckt haben und wir dich bald als Gast persönlich begrüßen können.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reservierung - image left, text right */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-lg overflow-hidden">
            <img src="/images/screen-140zoll.jpg" alt="140-Zoll Screen" className="w-full h-auto" loading="lazy" />
          </div>
          <div>
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              Reservierung<br />im <span className="text-primary">Rondo</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Du möchtest die Matches deiner Lieblingsmannschaft auf unserem <strong className="text-foreground">140-Zoll-LED-Screen</strong> und auf unseren <strong className="text-foreground">8 weiteren Screens</strong> genießen? Dann reserviere dir jetzt deinen Platz in der Sportsbar.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Rondo steht für Live-Sport und daher übertragen wir fast alle Live-Spiele der Bundesliga, DFB-Pokal, Champions- & Europa-League, Serie A, uvm. so wie auch NFL, Tennis oder Handball.
            </p>
            <Link
              to="/reservierung"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              Reservieren <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Billard, Kicker oder Dart */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              Billard,<br /><span className="text-primary">Kicker oder Dart</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Auch für die sportliche Betätigung wird in der Rondo Sportsbar gesorgt. Buche dir und deinen Freunden einen Platz auf einem unserer 8 Olio-Billardtischen, 2 Leonhart-Tischkickern und 2 Löwen-Elektronik Dart's.
            </p>
            <Link
              to="/reservierung"
              className="inline-flex items-center gap-2 border border-primary text-primary px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Reservieren <ArrowRight size={18} />
            </Link>
          </div>
          <div className="order-1 md:order-2 rounded-lg overflow-hidden">
            <img src="/images/billard-area.jpg" alt="Billard Area" className="w-full h-auto" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-4xl md:text-5xl text-center mb-12">
            Was unsere <span className="text-primary">Kunden sagen</span>
          </h2>
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((t, i) => (
                  <div key={i} className="w-full flex-shrink-0 px-4">
                    <div className="border border-border/30 p-8 md:p-12 text-center max-w-2xl mx-auto">
                      <p className="text-lg md:text-xl text-muted-foreground italic mb-6 leading-relaxed">"{t.text}"</p>
                      <p className="font-semibold text-foreground">{t.author}</p>
                      <p className="text-sm text-primary mt-1">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 border border-border/30 rounded-full p-2 text-foreground hover:text-primary hover:border-primary transition-colors bg-background/80"
              aria-label="Vorheriges Testimonial"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 border border-border/30 rounded-full p-2 text-foreground hover:text-primary hover:border-primary transition-colors bg-background/80"
              aria-label="Nächstes Testimonial"
            >
              <ChevronRight size={24} />
            </button>
            <div className="flex justify-center gap-2 mt-6">
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

      {/* Öffnungszeiten */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="font-display text-4xl md:text-6xl mb-2">
            Time for some <span className="text-primary">Action</span>
          </h2>
          <div className="w-24 h-1 bg-primary mb-8 mx-auto" />
          <h3 className="font-display text-2xl mb-6">Unsere Öffnungszeiten</h3>
          <div className="inline-block text-left">
            {[
              { day: "Mo – Do", time: "15:00 – 01:00 Uhr" },
              { day: "Fr", time: "15:00 – 03:00 Uhr" },
              { day: "Sa", time: "13:00 – 03:00 Uhr" },
              { day: "So", time: "13:00 – 01:00 Uhr" },
            ].map((o, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Clock size={18} className="text-primary" />
                <span className="font-display text-lg">{o.day}: {o.time}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Feiertage gelten die gleichen Öffnungszeiten wie regulär.<br />
            Kurzfristige Sonderöffnungszeiten werden über unseren Google Account gepflegt.
          </p>
        </div>
      </section>

      {/* Private Feiern */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              Private<br /><span className="text-primary">Feiern</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Ob Geburtstagsfeiern, JGA, Firmen-Events, Weihnachtsfeiern oder einfach nur so – bieten wir für größere Gruppen ab 11 Personen verschiedene Lösungen für private Feiern an wie unseren VIP-Raum oder unser Podest.
            </p>
            <Link
              to="/private-feiern"
              className="inline-flex items-center gap-2 border border-primary text-primary px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Mehr Info <ArrowRight size={18} />
            </Link>
          </div>
          <div className="rounded-lg overflow-hidden">
            <img src="/images/podest.jpg" alt="Private Feiern" className="w-full h-auto" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Gallery - Come in Feel good */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl md:text-5xl text-center mb-12">
            Come in – <span className="text-primary">Feel good</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { src: "/images/podest.jpg", label: "Podest für bis zu 33 Gäste" },
              { src: "/images/fensterbereich.jpg", label: "Fensterbereich" },
              { src: "/images/screen-140zoll.jpg", label: "140-Zoll-Screen" },
              { src: "/images/billard-area.jpg", label: "Billard-Area" },
              { src: "/images/tv-area.jpg", label: "TV-Area" },
            ].map((img, i) => (
              <div key={i} className="relative group overflow-hidden aspect-[4/3]">
                <img src={img.src} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-3">
                  <span className="font-display text-sm md:text-base text-foreground">{img.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
