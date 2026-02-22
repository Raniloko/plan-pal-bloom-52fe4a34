import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin } from "lucide-react";

interface FooterProps {
  onOpenCookieSettings?: () => void;
}

const Footer = ({ onOpenCookieSettings }: FooterProps) => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info */}
          <div>
            <img src="/images/rondo-logo.png" alt="Rondo Sportsbar" className="h-12 mb-4" />
            <div className="flex items-start gap-2 text-muted-foreground text-sm">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>Otto-Hahn-Str. 18, 63456 Hanau, Deutschland</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/impressum" className="text-muted-foreground hover:text-primary transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="text-muted-foreground hover:text-primary transition-colors">Datenschutz</Link>
            <button onClick={onOpenCookieSettings} className="text-left text-muted-foreground hover:text-primary transition-colors">Dateneinstellungen</button>
          </div>

          {/* Social */}
          <div className="flex gap-4 md:justify-end">
            <a href="https://instagram.com/rondosportsbar/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
              <Instagram size={24} />
            </a>
            <a href="https://facebook.com/Rondosportsbar" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
              <Facebook size={24} />
            </a>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Rondo Sportsbar. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
