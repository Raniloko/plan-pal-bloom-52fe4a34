import { Link } from "react-router-dom";
import RondoReservationSystem from "@/components/RondoReservationSystem";
import { Info } from "lucide-react";

const Reservierung = () => {
  return (
    <main className="pt-20 md:pt-24">
      <section className="py-8 md:py-16">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto md:max-w-5xl">
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl mb-3 md:mb-4 text-center">
            Reserv<span className="text-primary">ierung</span> im <span className="text-primary">Rondo</span>
          </h1>
          <p className="text-center text-muted-foreground mb-6 md:mb-10 max-w-xl mx-auto text-sm sm:text-base px-2">
            Du möchtest die Matches deiner Lieblingsmannschaft auf unserem 140-Zoll-LED-Screen genießen? Reserviere dir jetzt deinen Platz!
          </p>

          <div className="bg-card border border-border rounded-lg p-3 sm:p-6 md:p-8 reservation-form-wrap">
            <RondoReservationSystem />
          </div>

          <div className="mt-5 flex justify-center">
            <Link
              to="/reservierung/info"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Info size={14} className="text-primary" />
              Infos & FAQ zur Reservierung →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Reservierung;
