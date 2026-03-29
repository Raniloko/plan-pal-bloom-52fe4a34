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
        <div className="flex justify-center gap-2 text-sm text-muted-foreground">
          <Link to="/impressum" className="hover:text-primary transition-colors">Impressum</Link>
          <span>|</span>
          <Link to="/datenschutz" className="hover:text-primary transition-colors">Datenschutz</Link>
          <span>|</span>
          <button onClick={onOpenCookieSettings} className="hover:text-primary transition-colors">Dateneinstellungen</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
