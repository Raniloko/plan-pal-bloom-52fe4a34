import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

const navLinks = [
  { to: "/", label: "Startseite" },
  { to: "/private-feiern", label: "Private Feiern" },
  { to: "/reservierung", label: "Reservierung" },
  { to: "/speisekarte", label: "Speisekarte" },
  { to: "/kontakt", label: "Kontakt" },
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
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#111111]/95 backdrop-blur-md" : "bg-[#111111]"
      }`}>
        <div className="border-b-2 border-primary">
          <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
            <button
              onClick={() => setIsOpen(true)}
              className="text-primary hover:text-primary/80 transition-colors z-10"
              aria-label="Menü öffnen"
            >
              <Menu size={28} strokeWidth={2.5} />
            </button>

            <Link to="/" className="absolute left-1/2 -translate-x-1/2">
              <img src="/images/rondo-logo.png" alt="Rondo Sportsbar" className="h-12 md:h-16" />
            </Link>

            <div className="w-7" />
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
        {/* Close button */}
        <div className="flex justify-start p-5">
          <button
            onClick={() => setIsOpen(false)}
            className="text-primary-foreground hover:text-primary-foreground/70 transition-colors"
            aria-label="Menü schließen"
          >
            <Menu size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* "RESERVIERUNG" title - clickable link */}
        <Link
          to="/reservierung"
          onClick={() => setIsOpen(false)}
          className="block px-8 mt-8 mb-16 group"
        >
          <h2 className="text-4xl md:text-5xl text-primary-foreground font-bold tracking-wider transition-all duration-300 group-hover:translate-x-2 group-hover:text-primary-foreground/80">
            RESERVIERUNG
          </h2>
        </Link>

        {/* Nav links */}
        <div className="flex flex-col items-start gap-4 px-8 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={`font-display text-2xl md:text-3xl uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:translate-x-2 hover:text-primary-foreground/70 ${
                location.pathname === link.to ? "underline underline-offset-4" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;
