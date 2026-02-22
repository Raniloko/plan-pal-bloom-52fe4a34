import { Link } from "react-router-dom";
import RondoReservationSystem from "@/components/RondoReservationSystem";
import { Clock } from "lucide-react";

const Reservierung = () => {
  return (
    <main className="pt-20 md:pt-24">
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-display text-5xl md:text-7xl mb-4 text-center">
            Reserv<span className="text-primary">ierung</span>
          </h1>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Du möchtest die Matches deiner Lieblingsmannschaft auf unserem 140-Zoll-LED-Screen genießen? Reserviere dir jetzt deinen Platz!
          </p>

          <div className="bg-card border border-border rounded-lg p-6 md:p-8">
            <RondoReservationSystem />
          </div>

          {/* Info */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-muted border border-border rounded-lg p-6">
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
            <div className="bg-muted border border-border rounded-lg p-6">
              <h3 className="font-display text-xl mb-3">Eventkalender</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Schau dir unseren Eventkalender an, um aktuelle Live-Übertragungen und Events zu sehen.
              </p>
              <a
                href="https://portal.gastfreund.net/rondo-sportsbar/340856"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm font-semibold hover:underline"
              >
                Eventkalender öffnen →
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Reservierung;
