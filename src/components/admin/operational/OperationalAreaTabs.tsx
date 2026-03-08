import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AREA_TABS = [
  { id: "billard", label: "1. Billard Tisch" },
  { id: "salitos", label: "2. Salitos Lounge / Outdoor" },
  { id: "rest140", label: "3. Restaurant 140 Zoll" },
  { id: "rest75", label: "4. Restaurant 75 Zoll / Sport" },
  { id: "vip", label: "5. VIP Raum / Sport" },
];

interface Props {
  activeArea: string;
  onAreaChange: (area: string) => void;
}

export const OperationalAreaTabs = ({ activeArea, onAreaChange }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });

  return (
    <div style={{
      display: "flex", alignItems: "center", height: 44, minHeight: 44,
      background: "#1e1e1e", borderBottom: "1px solid #2a2a2a",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <button onClick={() => scroll(-1)} style={{
        width: 32, height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#666", background: "transparent", border: "none", borderRight: "1px solid #2a2a2a", cursor: "pointer",
      }}><ChevronLeft size={14} /></button>

      <div ref={scrollRef} style={{
        flex: 1, display: "flex", alignItems: "center", height: "100%",
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {AREA_TABS.map(tab => {
          const active = activeArea === tab.id;
          return (
            <button key={tab.id} onClick={() => onAreaChange(tab.id)} style={{
              padding: "0 22px", height: "100%", fontSize: 13, fontWeight: 600,
              whiteSpace: "nowrap", border: "none", cursor: "pointer",
              color: active ? "#fff" : "#666",
              background: active ? "rgba(255,255,255,0.07)" : "transparent",
              borderBottom: active ? "2px solid #c9a84c" : "2px solid transparent",
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      <button onClick={() => scroll(1)} style={{
        width: 32, height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#666", background: "transparent", border: "none", borderLeft: "1px solid #2a2a2a", cursor: "pointer",
      }}><ChevronRight size={14} /></button>
    </div>
  );
};
