import { Link } from "react-router-dom";

const PrivateFeiern = () => {
  return (
    <main className="pt-20 md:pt-24">
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Private <span className="text-primary">Feiern</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Ob Geburtstagsfeiern, JGA, Firmen-Events, Tagungen, Weihnachtsfeiern oder einfach nur so – wir bieten für größere Gruppen ab 11 Personen verschiedene Lösungen für private Feiern an wie unseren VIP-Raum oder unser Podest. Termine können telefonisch während der Öffnungszeiten vereinbart werden.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="rounded-lg overflow-hidden">
              <img src="/images/podest.jpg" alt="Podest" className="w-full h-72 object-cover" loading="lazy" />
              <div className="bg-card p-4 border border-border border-t-0 rounded-b-lg">
                <h3 className="font-display text-2xl">Podest</h3>
                <p className="text-sm text-muted-foreground">Für bis zu 33 Gäste</p>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden">
              <img src="/images/fensterbereich.jpg" alt="Fensterbereich" className="w-full h-72 object-cover" loading="lazy" />
              <div className="bg-card p-4 border border-border border-t-0 rounded-b-lg">
                <h3 className="font-display text-2xl">Fensterbereich</h3>
                <p className="text-sm text-muted-foreground">Gemütliche Atmosphäre</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/reservierung"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              Jetzt reservieren
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              Oder rufen Sie uns während der Öffnungszeiten an.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PrivateFeiern;
