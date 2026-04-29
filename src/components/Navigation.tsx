import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
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

            {/* Right: Reservierung button */}
            <div className="flex items-center gap-3 z-10">
              <Link to="/reservierung"
                className={`inline-flex items-center border border-primary text-primary rounded-full px-4 py-1.5 text-sm font-semibold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-all duration-300 ${
                  location.pathname === "/reservierung" ? "bg-primary text-primary-foreground" : ""
                }`}>
                Reservierung
              </Link>
            </div>
          </div>
        </div>
      </nav>
  );
};

export default Navigation;
