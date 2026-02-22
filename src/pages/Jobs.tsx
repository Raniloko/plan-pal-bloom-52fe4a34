import { ArrowRight } from "lucide-react";

const Jobs = () => {
  return (
    <main className="pt-20 md:pt-24">
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Jobs & <span className="text-primary">Karriere</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            Du möchtest Teil des Rondo-Teams werden? Wir suchen immer motivierte Mitarbeiter, die Leidenschaft für Sport und Gastronomie mitbringen.
          </p>
          <p className="text-muted-foreground mb-8">
            Alle aktuellen Stellenangebote findest du in unserem Portal. Bewirb dich jetzt!
          </p>
          <a
            href="https://portal.gastfreund.net/rondo-sportsbar/346050"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors"
          >
            Stellenangebote ansehen <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </main>
  );
};

export default Jobs;
