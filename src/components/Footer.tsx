import { Link } from "react-router-dom";

interface FooterProps {
  onOpenCookieSettings?: () => void;
}

const Footer = ({ onOpenCookieSettings }: FooterProps) => {
  return (
    <footer className="bg-background py-12">
      <div className="container mx-auto px-4 text-center">
        <p className="text-foreground font-semibold mb-1">Rondo - Sportsbar</p>
        <p className="text-muted-foreground text-sm mb-6">
          Otto-Hahn-Str. 18, 63456 Hanau, Deutschland
        </p>
        <div className="flex justify-center flex-wrap gap-2 text-sm text-muted-foreground">
          <a href="https://www.rondo-sportsbar.de/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Website</a>
          <span>|</span>
          <a href="https://www.rondo-sportsbar.de/reservierung" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Reservierung</a>
          <span>|</span>
          <a href="https://www.rondo-sportsbar.de/impressum/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Impressum</a>
          <span>|</span>
          <a href="https://www.rondo-sportsbar.de/datenschutz/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Datenschutz</a>
          <span>|</span>
          <button onClick={onOpenCookieSettings} className="hover:text-primary transition-colors">Dateneinstellungen</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
