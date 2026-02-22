import { ArrowRight } from "lucide-react";

const Speisekarte = () => {
  return (
    <main className="pt-20 md:pt-24">
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Speise<span className="text-primary">karte</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Unsere vollständige Speisekarte findest du in unserer App bzw. Web-Version. Dort findest du alle aktuellen Gerichte, Getränke und Angebote.
          </p>
          <a
            href="https://portal.gastfreund.net/rondo-sportsbar/340856"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors"
          >
            Speisekarte öffnen <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </main>
  );
};

export default Speisekarte;
