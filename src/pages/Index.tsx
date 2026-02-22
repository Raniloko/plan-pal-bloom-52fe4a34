import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Tv, Target, Gamepad2, MonitorPlay, ChevronLeft, ChevronRight } from "lucide-react";

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

  // Auto-slide
  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, [nextTestimonial]);

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero-header.png" alt="Rondo Sportsbar" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background" />
        </div>
        <div className="relative z-10 text-center px-4 pt-20">
          <h1 className="font-display text-7xl md:text-9xl leading-none">
            <span className="text-primary">RONDO</span><br />
            <span className="text-primary">LOVES</span><br />
            <span className="text-foreground">SPORTS</span>
          </h1>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/reservierung"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              Reservieren <ArrowRight size={18} />
            </Link>
            <a
              href="https://portal.gastfreund.net/rondo-sportsbar/340856"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-foreground text-foreground px-8 py-3 font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
            >
              Eventkalender
            </a>
          </div>
        </div>
      </section>

      {/* Welcome */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="font-display text-4xl md:text-6xl mb-6">
            Welcome to <span className="text-primary">Rondo Sportsbar</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Mit einem Besuch in unserer Bar garantieren wir dir leckeres Essen, gute Laune und ein unvergessliches Erlebnis für die ganze Familie. Bei 8 Olio-Billardtischen, 2 Leonhart-Tischkickern und 2 Löwen-Elektronik Dart's ist der Spaß vorprogrammiert! Durch unseren 140-Zoll-LED-TV, sowie den 8 weiteren TVs entsteht eine einzigartige Atmosphäre bei Live-Spielen, die schon fast an einen Stadionbesuch erinnert.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Wir übertragen nahezu alle Live-Spiele (Bundesliga, DFB-Pokal, Champions- & Europa-League, Serie A, uvm.), aber auch NFL, Tennis oder Handball. LIVE-SPORT wird bei uns groß geschrieben! Vor dem Eingang befinden sich zusätzlich 400 kostenfreie Parkplätze!
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl md:text-5xl text-center mb-12">
            Unsere <span className="text-primary">Highlights</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Tv size={32} />, title: "140-Zoll-LED-TV", desc: "Einzigartiges Stadion-Feeling auf unserem riesigen Screen" },
              { icon: <MonitorPlay size={32} />, title: "8 weitere TVs", desc: "Live-Sport auf allen Screens – keine Minute verpassen" },
              { icon: <Target size={32} />, title: "8 Olio-Billardtische", desc: "Professionelle Billardtische für Amateure und Profis" },
              { icon: <Gamepad2 size={32} />, title: "2 Leonhart-Tischkicker", desc: "Action-geladene Kicker-Duelle mit Freunden" },
              { icon: <Target size={32} />, title: "2 Löwen-Elektronik Darts", desc: "Modernste Dart-Automaten für den perfekten Wurf" },
              { icon: <Clock size={32} />, title: "400 Parkplätze", desc: "Kostenfreie Parkplätze direkt vor der Tür" },
            ].map((f, i) => (
              <div key={i} className="bg-muted p-6 rounded-lg border border-border hover:border-primary/50 transition-colors group">
                <div className="text-primary mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-display text-2xl mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reservierung CTA */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              Reservierung <span className="text-primary">im Rondo</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Du möchtest die Matches deiner Lieblingsmannschaft auf unserem 140-Zoll-LED-Screen und auf unseren 8 weiteren Screens genießen? Dann reserviere dir jetzt deinen Platz in der Sportsbar.
            </p>
            <Link
              to="/reservierung"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              Jetzt reservieren <ArrowRight size={18} />
            </Link>
          </div>
          <div className="rounded-lg overflow-hidden">
            <img src="/images/screen-140zoll.jpg" alt="140-Zoll Screen" className="w-full h-auto" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Billard/Kicker */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 rounded-lg overflow-hidden">
            <img src="/images/billard-area.jpg" alt="Billard Area" className="w-full h-auto" loading="lazy" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              Billard, <span className="text-primary">Kicker oder Dart</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Auch für die sportliche Betätigung wird in der Rondo Sportsbar gesorgt. Buche dir und deinen Freunden einen Platz auf einem unserer 8 Olio-Billardtischen, 2 Leonhart-Tischkickern und 2 Löwen-Elektronik Dart's.
            </p>
            <Link
              to="/reservierung"
              className="inline-flex items-center gap-2 border border-primary text-primary px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Reservieren <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Slider */}
      <section className="py-20">
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
                    <div className="bg-card border border-border rounded-lg p-8 md:p-12 text-center max-w-2xl mx-auto">
                      <p className="text-lg md:text-xl text-muted-foreground italic mb-6 leading-relaxed">"{t.text}"</p>
                      <p className="font-semibold text-foreground">{t.author}</p>
                      <p className="text-sm text-primary mt-1">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 bg-card border border-border rounded-full p-2 text-foreground hover:text-primary hover:border-primary transition-colors"
              aria-label="Vorheriges Testimonial"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 bg-card border border-border rounded-full p-2 text-foreground hover:text-primary hover:border-primary transition-colors"
              aria-label="Nächstes Testimonial"
            >
              <ChevronRight size={24} />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i === currentTestimonial ? "bg-primary" : "bg-border hover:bg-muted-foreground"
                  }`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Öffnungszeiten */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl md:text-5xl mb-8">
            Time for some <span className="text-primary">Action</span>
          </h2>
          <h3 className="font-display text-2xl mb-6">Unsere Öffnungszeiten</h3>
          <div className="inline-block text-left">
            {[
              { day: "Mo – Do", time: "16:00 – 00:00 Uhr" },
              { day: "Fr", time: "16:00 – 02:00 Uhr" },
              { day: "Sa", time: "14:00 – 02:00 Uhr" },
              { day: "So", time: "14:00 – 00:00 Uhr" },
            ].map((o, i) => (
              <div key={i} className="flex justify-between gap-12 py-2 border-b border-border last:border-0">
                <span className="font-semibold">{o.day}</span>
                <span className="text-primary">{o.time}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Telefonisch erreichbar während der Öffnungszeiten.<br />
            Kurzfristige Sonderöffnungszeiten werden über unseren Google Account gepflegt.
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl md:text-5xl text-center mb-12">
            Come in – <span className="text-primary">Feel good</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { src: "/images/podest.jpg", label: "Podest für bis zu 33 Gäste" },
              { src: "/images/fensterbereich.jpg", label: "Fensterbereich" },
              { src: "/images/screen-140zoll.jpg", label: "140-Zoll-Screen" },
              { src: "/images/billard-area.jpg", label: "Billard-Area" },
              { src: "/images/tv-area.jpg", label: "TV-Area" },
            ].map((img, i) => (
              <div key={i} className="relative group overflow-hidden rounded-lg">
                <img src={img.src} alt={img.label} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-4">
                  <span className="font-display text-xl">{img.label}</span>
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
