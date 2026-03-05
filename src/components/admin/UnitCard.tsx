interface UnitCardProps {
  unit: { id: string; area: string; name: string; status: string; occupied_until?: string | null; capacity: number };
  onClick: () => void;
}

const BilliardSVG = () => (
  <svg viewBox="0 0 200 120" className="w-full">
    <rect x="10" y="10" width="180" height="100" rx="8" fill="#1a5c2a" stroke="#2a8c4a" strokeWidth="2"/>
    <rect x="20" y="20" width="160" height="80" rx="4" fill="none" stroke="#0d3d18" strokeWidth="1"/>
    <circle cx="20" cy="20" r="6" fill="#111"/><circle cx="100" cy="16" r="5" fill="#111"/>
    <circle cx="180" cy="20" r="6" fill="#111"/><circle cx="20" cy="100" r="6" fill="#111"/>
    <circle cx="100" cy="104" r="5" fill="#111"/><circle cx="180" cy="100" r="6" fill="#111"/>
  </svg>
);

const KickerSVG = () => (
  <svg viewBox="0 0 200 120" className="w-full">
    <rect x="10" y="10" width="180" height="100" rx="4" fill="#1a4c2a" stroke="#2a6c3a" strokeWidth="2"/>
    <rect x="0" y="40" width="12" height="40" rx="2" fill="#333"/>
    <rect x="188" y="40" width="12" height="40" rx="2" fill="#333"/>
    {[50, 90, 130, 170].map(x => <line key={x} x1={x} y1="12" x2={x} y2="108" stroke="#666" strokeWidth="1.5"/>)}
    {[[50,40],[50,70],[90,30],[90,60],[90,90]].map(([x,y], i) => <circle key={`r${i}`} cx={x} cy={y} r="4" fill="#e81f1f"/>)}
    {[[130,30],[130,60],[130,90],[170,40],[170,70]].map(([x,y], i) => <circle key={`b${i}`} cx={x} cy={y} r="4" fill="#1f7ae8"/>)}
  </svg>
);

const DartSVG = () => (
  <svg viewBox="0 0 200 200" className="w-full">
    <circle cx="100" cy="100" r="90" fill="#1a1a2a" stroke="#333" strokeWidth="2"/>
    <circle cx="100" cy="100" r="70" fill="#882222" stroke="#333" strokeWidth="1"/>
    <circle cx="100" cy="100" r="50" fill="#1a1a2a" stroke="#333" strokeWidth="1"/>
    <circle cx="100" cy="100" r="30" fill="#882222" stroke="#333" strokeWidth="1"/>
    <circle cx="100" cy="100" r="12" fill="#1fe87a" stroke="#333" strokeWidth="1"/>
    <circle cx="100" cy="100" r="4" fill="#e81f1f"/>
  </svg>
);

const graphicMap: Record<string, React.FC> = { billard: BilliardSVG, kicker: KickerSVG, dart: DartSVG };

const statusConfig: Record<string, { label: string; borderClass: string; bgClass: string; dotClass: string }> = {
  free: { label: "Frei", borderClass: "border-success/50", bgClass: "", dotClass: "bg-success" },
  occupied: { label: "Belegt", borderClass: "border-primary/50", bgClass: "bg-primary/5", dotClass: "bg-primary" },
  blocked: { label: "Gesperrt", borderClass: "border-muted-foreground/30", bgClass: "opacity-50", dotClass: "bg-muted-foreground" },
};

const UnitCard = ({ unit, onClick }: UnitCardProps) => {
  const Graphic = graphicMap[unit.area] || BilliardSVG;
  const status = statusConfig[unit.status] || statusConfig.free;
  const occupiedTime = unit.occupied_until ? new Date(unit.occupied_until).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <button onClick={onClick} className={`bg-card border ${status.borderClass} rounded-xl p-4 text-left hover:bg-muted/30 transition-all group ${status.bgClass}`}>
      <div className="aspect-[5/3] mb-3 rounded-lg overflow-hidden bg-background/50 p-2"><Graphic /></div>
      <div className="flex items-center justify-between">
        <span className="font-display text-lg tracking-wider">{unit.name}</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${status.dotClass}`} />
          <span className="text-xs text-muted-foreground">
            {unit.status === "occupied" && occupiedTime ? `Belegt bis ${occupiedTime}` : status.label}
          </span>
        </div>
      </div>
    </button>
  );
};

export default UnitCard;
