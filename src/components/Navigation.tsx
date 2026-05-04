import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Menu, X } from "lucide-react";

const menuLinks = [
  { label: "Startseite", href: "https://www.rondo-sportsbar.de/" },
  { label: "Reservierung", href: "https://www.rondo-sportsbar.de/reservierung" },
  { label: "Impressum", href: "https://www.rondo-sportsbar.de/impressum/" },
  { label: "Datenschutz", href: "https://www.rondo-sportsbar.de/datenschutz/" },
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
            <a href="https://www.rondo-sportsbar.de/" target="_blank" rel="noopener noreferrer" className="absolute left-1/2 -translate-x-1/2">
              <img src="/images/rondo-logo.png" alt="Rondo Sportsbar" className="h-12 md:h-16" />
            </a>

            {/* Right: Hamburger */}
            <div className="flex items-center gap-3 z-10">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-primary hover:text-primary/80 transition-colors p-2"
                aria-label="Menü öffnen"
              >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
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

      {/* Slide-in panel (left, yellow) */}
      <div
        className={`fixed top-0 left-0 h-[100dvh] w-[85vw] max-w-[320px] bg-primary z-[60] flex flex-col pt-24 px-8 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ul className="list-none p-0 m-0">
          {menuLinks.map((link) => (
            <li key={link.label} className="my-5">
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground font-bold text-[22px] no-underline hover:opacity-70 transition-opacity"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Navigation;
