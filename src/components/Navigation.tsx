import { ArrowLeft } from "lucide-react";

const Navigation = () => {
  return (
    <div className="fixed top-4 left-4 z-50">
      <a
        href="https://www.rondo-sportsbar.de/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-full shadow-lg hover:scale-105 hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-200"
      >
        <ArrowLeft size={18} strokeWidth={2.5} />
        Zur Startseite
      </a>
    </div>
  );
};

export default Navigation;
