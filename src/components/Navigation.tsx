import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Menu } from "lucide-react";

const dummyLinks = [
  { label: "Startseite" },
  { label: "Private Feiern" },
  { label: "Reservierung" },
  { label: "Speisekarte" },
  { label: "Kontakt" },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#111111]/95 backdrop-blur-md" : "bg-[#111111]"
      }`}>
        <div className="border-b-2 border-primary">
          <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
            {/* Left: Social icons */}
            <div className="flex items-center gap-3 z-10">
              <a href="https://instagram.com/rondosportsbar/" target="_blank" rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors">
                <Instagram size={24} strokeWidth={2} />
              </a>
              <a href="https://facebook.com/Rondosportsbar" target="_blank" rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors">
                <Facebook size={24} strokeWidth={2} />
              </a>
            </div>

            {/* Center: Logo */}
            <Link to="/reservierung" className="absolute left-1/2 -translate-x-1/2">
              <img src="/images/rondo-logo.png" alt="Rondo Sportsbar" className="h-12 md:h-16" />
            </Link>

            {/* Right: Hamburger */}
            <div className="flex items-center gap-3 z-10">
              <button
                onClick={() => setIsOpen(true)}
                className="text-foreground hover:text-primary transition-colors"
                aria-label="Menü öffnen"
              >
                <Menu size={28} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[55] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Yellow slide-in panel */}
      <div
        className={`fixed top-0 left-0 h-[100dvh] w-[85vw] max-w-[400px] bg-primary z-[60] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-start p-5">
          <button
            onClick={() => setIsOpen(false)}
            className="text-primary-foreground hover:text-primary-foreground/70 transition-colors"
            aria-label="Menü schließen"
          >
            <Menu size={28} strokeWidth={2.5} />
          </button>
        </div>

        <div className="block px-8 mt-6 mb-12">
          <h2 className="text-2xl md:text-3xl text-primary-foreground font-bold tracking-wider">
            RESERVIERUNG
          </h2>
        </div>

        <div className="flex flex-col items-start gap-4 px-8 flex-1">
          {dummyLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={(e) => e.preventDefault()}
              className="text-2xl md:text-3xl uppercase tracking-wider text-primary-foreground font-semibold transition-all duration-300 hover:translate-x-2 hover:text-primary-foreground/70 cursor-default text-left"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;
