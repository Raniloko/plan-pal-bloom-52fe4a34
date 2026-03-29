import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Instagram, Facebook } from "lucide-react";

const navLinks = [
  { to: "/", label: "Startseite" },
  { to: "/private-feiern", label: "Private Feiern" },
  { to: "/reservierung", label: "Reservierung" },
  { to: "/speisekarte", label: "Speisekarte" },
  { to: "/kontakt", label: "Kontakt" },
  { to: "/jobs", label: "Jobs", external: "https://portal.gastfreund.net/rondo-sportsbar/346050" },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-background/95 backdrop-blur-md shadow-lg" : "bg-transparent"
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        {/* Logo - centered */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <img src="/images/rondo-logo.png" alt="Rondo Sportsbar" className="h-10 md:h-14" />
        </Link>

        {/* Left side - Social icons */}
        <div className="flex items-center gap-3">
          <a href="https://instagram.com/rondosportsbar/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
            <Instagram size={20} />
          </a>
          <a href="https://facebook.com/Rondosportsbar" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
            <Facebook size={20} />
          </a>
        </div>

        {/* Right side - CTA + Hamburger */}
        <div className="flex items-center gap-4">
          <Link
            to="/reservierung"
            className="hidden md:inline-block border border-primary text-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Reservierung
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            className="text-foreground hover:text-primary transition-colors"
            aria-label="Menü öffnen"
          >
            <Menu size={28} />
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 z-[55] transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-in Panel - FROM RIGHT, dark background */}
      <div
        className={`fixed top-0 right-0 h-[100dvh] w-[320px] max-w-[85vw] bg-background border-l border-border/20 z-[56] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <div className="flex justify-start p-5">
          <button
            onClick={() => setIsOpen(false)}
            className="text-foreground hover:text-primary transition-colors"
            aria-label="Menü schließen"
          >
            <X size={28} />
          </button>
        </div>

        {/* Nav links */}
        <div className="flex flex-col items-start gap-5 px-8 flex-1 mt-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={`font-display text-3xl md:text-4xl uppercase tracking-wider transition-colors ${
                location.pathname === link.to
                  ? "text-primary"
                  : "text-foreground hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Social icons */}
        <div className="flex gap-6 px-8 pb-10">
          <a href="https://instagram.com/rondosportsbar/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
            <Instagram size={24} />
          </a>
          <a href="https://facebook.com/Rondosportsbar" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
            <Facebook size={24} />
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
