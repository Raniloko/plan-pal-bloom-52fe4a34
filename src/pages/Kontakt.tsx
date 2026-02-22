import { MapPin, Mail, Clock, Instagram, Facebook } from "lucide-react";

const Kontakt = () => {
  return (
    <main className="pt-20 md:pt-24">
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="font-display text-5xl md:text-7xl mb-12 text-center">
            Kon<span className="text-primary">takt</span>
          </h1>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Info */}
            <div className="space-y-8">
              <div>
                <h3 className="font-display text-2xl mb-3 flex items-center gap-2"><MapPin className="text-primary" size={20} /> Adresse</h3>
                <p className="text-muted-foreground">
                  Rondo Sportsbar<br />
                  Otto-Hahn-Str. 18<br />
                  63456 Hanau, Deutschland
                </p>
              </div>

              <div>
                <h3 className="font-display text-2xl mb-3 flex items-center gap-2"><Mail className="text-primary" size={20} /> E-Mail</h3>
                <a href="mailto:mail@rondo-sportsbar.de" className="text-primary hover:underline">mail@rondo-sportsbar.de</a>
              </div>

              <div>
                <h3 className="font-display text-2xl mb-3 flex items-center gap-2"><Clock className="text-primary" size={20} /> Öffnungszeiten</h3>
                <div className="text-muted-foreground space-y-1 text-sm">
                  <p>Mo – Do: 16:00 – 00:00 Uhr</p>
                  <p>Fr: 16:00 – 02:00 Uhr</p>
                  <p>Sa: 14:00 – 02:00 Uhr</p>
                  <p>So: 14:00 – 00:00 Uhr</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Telefonisch erreichbar während der Öffnungszeiten.</p>
              </div>

              <div>
                <h3 className="font-display text-2xl mb-3">Social Media</h3>
                <div className="flex gap-4">
                  <a href="https://instagram.com/rondosportsbar/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                    <Instagram size={28} />
                  </a>
                  <a href="https://facebook.com/Rondosportsbar" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                    <Facebook size={28} />
                  </a>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="rounded-lg overflow-hidden border border-border h-[400px] md:h-full min-h-[400px]">
              <iframe
                title="Rondo Sportsbar Standort"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2556.5!2d8.9234!3d50.1217!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bd0f3c4f8a1c1d%3A0x4c8a1c1d4f8a1c1d!2sOtto-Hahn-Str.%2018%2C%2063456%20Hanau!5e0!3m2!1sde!2sde!4v1700000000000!5m2!1sde!2sde"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Kontakt;
