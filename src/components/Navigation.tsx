import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Instagram, Facebook } from "lucide-react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/private-feiern", label: "Private Feiern" },
  { to: "/reservierung", label: "Reservierung" },
  { to: "/speisekarte", label: "Speisekarte" },
  { to: "/kontakt", label: "Kontakt" },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        {/* Social icons */}
        <div className="flex items-center gap-3">
          <a href="https://instagram.com/rondosportsbar/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
            <Instagram size={22} />
          </a>
          <a href="https://facebook.com/Rondosportsbar" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
            <Facebook size={22} />
          </a>
        </div>

        {/* Logo */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <img src="/images/rondo-logo.png" alt="Rondo Sportsbar" className="h-12 md:h-16" />
        </Link>

        {/* Desktop CTA + Hamburger */}
        <div className="flex items-center gap-4">
          <Link
            to="/reservierung"
            className="hidden md:inline-block border border-primary text-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Reservierung
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative z-[60] text-foreground hover:text-primary transition-colors"
            aria-label={isOpen ? "Menü schließen" : "Menü öffnen"}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Fullscreen Menu Overlay */}
      {isOpen && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-background z-50 flex flex-col items-center justify-center animate-fade-in"
          style={{ minHeight: "100dvh" }}
        >
          {/* Close button inside overlay */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 z-[60] text-foreground hover:text-primary transition-colors"
            aria-label="Menü schließen"
          >
            <X size={28} />
          </button>

          <div className="flex flex-col items-center gap-6">
            {navLinks.map((link, index) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`font-display text-4xl md:text-5xl uppercase tracking-wider transition-all duration-300 ${
                  location.pathname === link.to ? "text-primary" : "text-foreground hover:text-primary"
                }`}
                style={{
                  animationDelay: `${index * 60}ms`,
                  animationFillMode: "both",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-6 mt-10">
            <a href="https://instagram.com/rondosportsbar/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
              <Instagram size={28} />
            </a>
            <a href="https://facebook.com/Rondosportsbar" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
              <Facebook size={28} />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
