import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";

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
  let closeTimeout: ReturnType<typeof setTimeout> | undefined;

  const openMenu = () => {
    if (closeTimeout) clearTimeout(closeTimeout);
    setIsOpen(true);
  };
  const closeMenu = () => setIsOpen(false);
  const delayedClose = () => {
    if (closeTimeout) clearTimeout(closeTimeout);
    closeTimeout = setTimeout(() => setIsOpen(false), 300);
  };

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
                onClick={() => (isOpen ? closeMenu() : openMenu())}
                onMouseEnter={openMenu}
                onMouseLeave={delayedClose}
                className={`lines-button relative w-[44px] h-[44px] flex items-center justify-center ${isOpen ? "is-active" : ""}`}
                aria-label="Menü öffnen"
              >
                <span className="lines" />
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
        onClick={closeMenu}
        onMouseEnter={delayedClose}
      />

      {/* Slide-in panel (right) */}
      <div
        onMouseEnter={openMenu}
        onMouseLeave={delayedClose}
        className={`fixed top-0 right-0 h-[100dvh] w-[85vw] max-w-[320px] bg-[#000] z-[60] flex flex-col pt-24 px-8 transition-transform duration-[400ms] ease-[cubic-bezier(0.77,0,0.18,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <ul className={`side-menu-list list-none p-0 m-0 ${isOpen ? "is-open" : ""}`}>
          {dummyLinks.map((link) => (
            <li key={link.label} className="my-5">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-white text-[22px] no-underline hover:text-primary transition-colors"
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
